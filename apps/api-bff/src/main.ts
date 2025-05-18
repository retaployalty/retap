// 🔁 Aggiungi questa riga in cima
import 'dotenv/config';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Abilita CORS
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001'], // Aggiungi qui gli URL delle tue app frontend
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'x-merchant-id'],
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 4000);
  console.log(`✅ API avviata su http://localhost:${process.env.PORT ?? 4000}`);
}
bootstrap();
