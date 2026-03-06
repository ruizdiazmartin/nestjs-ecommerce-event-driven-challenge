import { Injectable } from '@nestjs/common';

export type HealthResponse = {
  status: 'ok';
  service: string;
  timestamp: string;
};

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  getHealth(): HealthResponse {
    return {
      status: 'ok',
      service: 'nestjs-ecommerce-api',
      timestamp: new Date().toISOString(),
    };
  }
}
