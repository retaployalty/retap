import { Module } from '@nestjs/common';
import { CardsController } from './cards.controller';
import { SupabaseService } from '../supabase.service';

@Module({
  controllers: [CardsController],
  providers: [SupabaseService], // 👈 aggiungi qui
})
export class CardsModule {}
