import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { AppModule } from '../src/app.module';
import { configureNestApp } from '../src/bootstrap';

type RequestHandler = ReturnType<typeof express>;

let cachedServer: RequestHandler | null = null;

async function createServer(): Promise<RequestHandler> {
  const server = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
  configureNestApp(app);
  await app.init();
  return server;
}

export default async function handler(req, res) {
  if (!cachedServer) {
    cachedServer = await createServer();
  }
  return cachedServer(req, res);
}
