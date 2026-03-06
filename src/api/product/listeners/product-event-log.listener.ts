import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectEntityManager } from '@nestjs/typeorm';
import {
  ProductEvent,
  ProductEventType,
} from 'src/database/entities/productEvent.entity';
import { EntityManager } from 'typeorm';
import { ProductActivatedEvent } from '../events/product-activated.event';
import { ProductCreatedEvent } from '../events/product-created.event';
import { ProductDeactivatedEvent } from '../events/product-deactivated.event';
import {
  PRODUCT_ACTIVATED_EVENT,
  PRODUCT_CREATED_EVENT,
  PRODUCT_DEACTIVATED_EVENT,
} from '../events/product.events';

@Injectable()
export class ProductEventLogListener {
  private readonly logger = new Logger(ProductEventLogListener.name);

  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  @OnEvent(PRODUCT_CREATED_EVENT)
  async handleProductCreated(event: ProductCreatedEvent): Promise<void> {
    await this.persist({
      productId: event.productId,
      type: ProductEventType.PRODUCT_CREATED,
      payload: {
        merchantId: event.merchantId,
        categoryId: event.categoryId,
      },
      occurredAt: event.occurredAt,
    });
  }

  @OnEvent(PRODUCT_ACTIVATED_EVENT)
  async handleProductActivated(event: ProductActivatedEvent): Promise<void> {
    await this.persist({
      productId: event.productId,
      type: ProductEventType.PRODUCT_ACTIVATED,
      payload: {
        merchantId: event.merchantId,
      },
      occurredAt: event.occurredAt,
    });
  }

  @OnEvent(PRODUCT_DEACTIVATED_EVENT)
  async handleProductDeactivated(
    event: ProductDeactivatedEvent,
  ): Promise<void> {
    await this.persist({
      productId: event.productId,
      type: ProductEventType.PRODUCT_DEACTIVATED,
      payload: {
        merchantId: event.merchantId,
      },
      occurredAt: event.occurredAt,
    });
  }

  private async persist(data: Partial<ProductEvent>): Promise<void> {
    try {
      const row = this.entityManager.create(ProductEvent, data);
      await this.entityManager.save(ProductEvent, row);
    } catch (error) {
      this.logger.error(
        'Failed to persist product event log',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
