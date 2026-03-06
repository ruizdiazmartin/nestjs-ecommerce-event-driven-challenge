export class ProductDeactivatedEvent {
  constructor(
    public readonly productId: number,
    public readonly merchantId: number,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
