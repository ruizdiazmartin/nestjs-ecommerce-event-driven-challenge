import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import path from 'path';
import { Module as NodeModule } from 'module';
import { configureNestApp } from '../src/bootstrap';

type RequestHandler = ReturnType<typeof express>;

let cachedServer: RequestHandler | null = null;

function registerSrcAliasForServerless() {
  const runtimeRoot = process.cwd();
  const srcRoot = path.join(runtimeRoot, 'src');
  process.env.NODE_PATH = process.env.NODE_PATH
    ? `${process.env.NODE_PATH}${path.delimiter}${runtimeRoot}${path.delimiter}${srcRoot}`
    : `${runtimeRoot}${path.delimiter}${srcRoot}`;
  (NodeModule as unknown as { _initPaths: () => void })._initPaths();
}

async function createServer(): Promise<RequestHandler> {
  registerSrcAliasForServerless();
  const { AppModule } = await import('../src/app.module');
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
