import { ValidationPipe } from '@nestjs/common';
import { INestApplication } from '@nestjs/common/interfaces';

export function configureNestApp(app: INestApplication) {
  // Keep permissive for challenge/demo; tighten allowed origins in production.
  app.enableCors({ origin: true });
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
}
