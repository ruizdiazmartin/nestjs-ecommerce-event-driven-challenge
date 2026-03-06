import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectEntityManager } from '@nestjs/typeorm';
import { Product } from 'src/database/entities/product.entity';
import { EntityManager } from 'typeorm';
import { ProductActivatedEvent } from '../events/product-activated.event';
import { PRODUCT_ACTIVATED_EVENT } from '../events/product.events';

@Injectable()
export class ProductActivationMetadataListener {
  private readonly logger = new Logger(ProductActivationMetadataListener.name);

  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  @OnEvent(PRODUCT_ACTIVATED_EVENT)
  async handleProductActivated(event: ProductActivatedEvent): Promise<void> {
    try {
      await this.entityManager
        .createQueryBuilder()
        .update(Product)
        .set({ activatedAt: event.occurredAt })
        .where('id = :id', { id: event.productId })
        .andWhere('activatedAt IS NULL')
        .execute();
    } catch (error) {
      this.logger.error(
        'Failed to update product activation metadata',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
