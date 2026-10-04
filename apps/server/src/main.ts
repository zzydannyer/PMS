import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app.module.js";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: ["http://localhost:1420", "http://localhost:4173"],
    credentials: true,
  });
  await app.listen(process.env.PORT || 3100);
}

bootstrap();
