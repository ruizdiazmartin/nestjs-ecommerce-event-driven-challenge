export class ProductCreatedEvent {
  constructor(
    public readonly productId: number,
    public readonly merchantId: number,
    public readonly categoryId: number,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
