import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SupabaseService } from './supabase.service';
import { CardsModule } from './cards/cards.module';
import { TransactionsModule } from './transactions/transactions.module';

@Module({
  imports: [
    CardsModule,
    TransactionsModule,
  ],
  controllers: [AppController],
  providers: [AppService, SupabaseService],
})
export class AppModule {}
