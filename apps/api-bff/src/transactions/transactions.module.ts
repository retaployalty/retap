import { Module } from '@nestjs/common';
import { TransactionsController } from './transactions.controller';
import { SupabaseService } from '../supabase.service';

@Module({
  controllers: [TransactionsController],
  providers: [SupabaseService]
})
export class TransactionsModule {}
