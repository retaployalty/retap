import {
    Controller,
    Post,
    Get,
    Body,
    Req,
    BadRequestException,
    Query,
  } from '@nestjs/common';
  import { SupabaseService } from '../supabase.service';
  
  @Controller('cards')
  export class CardsController {
    constructor(private readonly supabase: SupabaseService) {}
  
    @Post()
    async createCard(
      @Body() body: { cardId: string; uid: string; customerId?: string },
      @Req() req: any,
    ) {
      const merchantId = req.headers['x-merchant-id'];
      const { cardId, uid, customerId } = body;

      // Se non viene fornito un customerId, creiamo un nuovo cliente
      let finalCustomerId = customerId;
      if (!customerId) {
        const { data: customer, error: customerError } = await this.supabase.client
          .from('customers')
          .insert({
            merchant_id: merchantId,
            email: null, // Potremmo aggiungere un campo per l'email se necessario
          })
          .select()
          .single();

        if (customerError) throw new BadRequestException(customerError.message);
        finalCustomerId = customer.id;
      }
  
      const { data, error } = await this.supabase.client
        .from('cards')
        .insert({
          id: cardId,
          uid,
          customer_id: finalCustomerId,
          merchant_id: merchantId,
        })
        .select()
        .single();
  
      if (error) throw new BadRequestException(error.message);
  
      return data;
    }

    @Get()
    async getCards(@Req() req: any, @Query('uid') uid?: string) {
      const merchantId = req.headers['x-merchant-id'];
      console.log('Searching for card with UID:', uid);
      console.log('Merchant ID:', merchantId);

      // Se viene fornito un UID, cerca quella carta specifica
      if (uid) {
        // Prima verifichiamo se la carta esiste senza filtri
        const { data: allCards, error: allCardsError } = await this.supabase.client
          .from('cards')
          .select('*')
          .eq('uid', uid);

        console.log('All cards with this UID:', allCards);
        console.log('All cards error:', allCardsError);

        // Poi proviamo con il filtro merchant
        const { data: card, error: cardError } = await this.supabase.client
          .from('cards')
          .select('*')
          .eq('uid', uid)
          .eq('issuing_merchant_id', merchantId);

        console.log('Filtered cards:', card);
        console.log('Filtered cards error:', cardError);

        if (cardError) throw new BadRequestException('Card not found');
        if (!card || card.length === 0) throw new BadRequestException('Card not found');
        return card[0];
      }

      // Altrimenti ottieni tutte le carte
      const { data: cards, error: cardsError } = await this.supabase.client
        .from('cards')
        .select()
        .eq('issuing_merchant_id', merchantId);

      if (cardsError) throw new BadRequestException(cardsError.message);

      // Per ogni carta, ottieni il saldo
      const cardsWithBalance = await Promise.all(
        cards.map(async (card) => {
          const { data: balanceData, error: balanceError } = await this.supabase.client
            .from('transactions')
            .select('points')
            .eq('card_id', card.id);

          if (balanceError) throw new BadRequestException(balanceError.message);

          const balance = balanceData.reduce(
            (sum, tx) => sum + tx.points,
            0
          );

          return {
            ...card,
            points: balance,
          };
        })
      );

      return cardsWithBalance;
    }
  }
  