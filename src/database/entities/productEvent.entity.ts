import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum ProductEventType {
  PRODUCT_CREATED = 'PRODUCT_CREATED',
  PRODUCT_ACTIVATED = 'PRODUCT_ACTIVATED',
  PRODUCT_DEACTIVATED = 'PRODUCT_DEACTIVATED',
}

@Entity({ name: 'product_event' })
@Index('IDX_product_event_productId_occurredAt', ['productId', 'occurredAt'])
export class ProductEvent {
  @PrimaryGeneratedColumn()
  public id!: number;

  @Column({ type: 'int' })
  @Index('IDX_product_event_productId')
  public productId: number;

  @Column({ type: 'varchar', length: 60 })
  @Index('IDX_product_event_type')
  public type: ProductEventType;

  @Column({ type: 'jsonb', nullable: true })
  public payload?: Record<string, unknown> | null;

  @Column({ type: 'timestamp', default: () => 'now()' })
  public occurredAt: Date;

  @CreateDateColumn({ type: 'timestamp' })
  public createdAt!: Date;
}
