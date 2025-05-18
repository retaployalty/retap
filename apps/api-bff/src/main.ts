// 🔁 Aggiungi questa riga in cima
import 'dotenv/config';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Abilita CORS
  app.enableCors({
    origin: '*', // In produzione, specificare i domini consentiti
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Ascolta su tutte le interfacce
  await app.listen(4000, '0.0.0.0');
  console.log('✅ API avviata su http://localhost:4000');
}
bootstrap();
