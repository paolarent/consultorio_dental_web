// main.ts
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());

  app.enableCors({
    origin: 'http://localhost:4200', //ruta del front
    credentials: true,
  });

  await app.listen(process.env.PORT || 3000);
}
bootstrap();

