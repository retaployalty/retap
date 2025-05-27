import {
    Controller,
    Post,
    Get,
    Body,
    Req,
    Param,
    BadRequestException,
  } from '@nestjs/common';
  import { SupabaseService } from '../supabase.service';
  import { CreateTxDto } from './create-tx.dto';
  
  interface Balance {
    merchant_id: string;
    merchant_name: string;
    balance: number;
    is_issuer: boolean;
    industry: string;
  }
  
  @Controller('tx')
  export class TransactionsController {
    constructor(private readonly supabase: SupabaseService) {}
  
    @Post()
    async createTx(@Body() dto: CreateTxDto, @Req() req: any) {
      const merchantId = req.headers['x-merchant-id'];
  
      // 1️⃣ Opzionale: verifica che la carta esista
      const { data: card, error: cardErr } = await this.supabase.client
        .from('cards')
        .select('id, customer_id')
        .eq('id', dto.cardId)
        .single();
  
      if (cardErr) throw new BadRequestException('Card not found');
  
      // 2️⃣ Inserisci la transazione
      const { data, error } = await this.supabase.client
        .from('transactions')
        .insert({
          id: crypto.randomUUID(),
          card_id: dto.cardId,
          merchant_id: merchantId,
          points: dto.points,
        })
        .select()
        .single();
  
      if (error) throw new BadRequestException(error.message);
  
      return data; // JSON della transazione appena creata
    }

    @Get('balance/:cardId')
    async getCardBalance(@Param('cardId') cardId: string, @Req() req: any) {
      const merchantId = req.headers['x-merchant-id'];

      // Verifica che la carta esista e appartenga al merchant
      const { data: card, error: cardErr } = await this.supabase.client
        .from('cards')
        .select('id')
        .eq('id', cardId)
        .eq('merchant_id', merchantId)
        .single();

      if (cardErr) throw new BadRequestException('Card not found');

      // Calcola il saldo totale
      const { data: transactions, error: txError } = await this.supabase.client
        .from('transactions')
        .select('points')
        .eq('card_id', cardId);

      if (txError) throw new BadRequestException(txError.message);

      const balance = transactions.reduce(
        (sum, tx) => sum + tx.points,
        0
      );

      return { balance };
    }

    @Get('web-balance/:cardId')
    async getWebCardBalance(@Param('cardId') cardId: string) {
      // Ottieni tutti i merchant associati alla carta con i loro saldi
      const { data: balances, error } = await this.supabase.client
        .rpc('get_card_balance', { card_id: cardId });

      if (error) throw new BadRequestException(error.message);

      return { balances };
    }
  }
  