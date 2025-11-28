import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  app.use(cookieParser());

  const frontUrl = process.env.FRONTEND_URL;

  app.enableCors({
    origin: frontUrl, //ruta del front
    credentials: true,
  });

  await app.listen(process.env.PORT || 3000);
}
bootstrap();

