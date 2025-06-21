import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CardsModule } from './cards/cards.module';
import { TransactionsModule } from './transactions/transactions.module';
import { AppleWalletController } from './apple-wallet.controller';
import { GoogleWalletController } from './google-wallet.controller';

@Module({
  imports: [
    CardsModule,
    TransactionsModule,
  ],
  controllers: [AppController, AppleWalletController, GoogleWalletController],
  providers: [AppService],
})
export class AppModule {}
