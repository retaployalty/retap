import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SupabaseService } from './supabase.service';
import { CardsModule } from './cards/cards.module';
import { TransactionsModule } from './transactions/transactions.module';
import { RewardsAndCheckpointsController } from './rewards.controller';
import { AppleWalletController } from './apple-wallet.controller';

@Module({
  imports: [
    CardsModule,
    TransactionsModule,
  ],
  controllers: [AppController, RewardsAndCheckpointsController, AppleWalletController],
  providers: [AppService, SupabaseService],
})
export class AppModule {}
