import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/filters/http-exception.filter";
import helmet from "helmet";
import compression from "compression";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security headers
  app.use(helmet());

  // Compression
  app.use(compression());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  //   // Global exception filter
  //   app.useGlobalFilters(new AllExceptionsFilter());

  //   // CORS
  //   app.enableCors({
  //     origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:3000',
  //     credentials: true,
  //     methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  //     allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID'],
  //   });

  // API prefix
  app.setGlobalPrefix("api/v1");

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`🔐 Auth endpoints: http://localhost:${port}/api/v1/auth`);
}
bootstrap();
