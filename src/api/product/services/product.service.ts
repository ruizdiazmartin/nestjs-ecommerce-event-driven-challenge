import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EntityManager, FindOptionsWhere } from 'typeorm';
import { InjectEntityManager } from '@nestjs/typeorm';
import {
  CreateProductDto,
  FindProductsQueryDto,
  ProductDetailsDto,
} from '../dto/product.dto';
import { Category } from '../../../database/entities/category.entity';
import { Product } from 'src/database/entities/product.entity';
import { ProductEvent } from 'src/database/entities/productEvent.entity';
import { errorMessages } from 'src/errors/custom';
import { validate } from 'class-validator';
import { successObject } from 'src/common/helper/sucess-response.interceptor';
import { ProductActivatedEvent } from '../events/product-activated.event';
import { ProductCreatedEvent } from '../events/product-created.event';
import { ProductDeactivatedEvent } from '../events/product-deactivated.event';
import {
  PRODUCT_ACTIVATED_EVENT,
  PRODUCT_CREATED_EVENT,
  PRODUCT_DEACTIVATED_EVENT,
} from '../events/product.events';

@Injectable()
export class ProductService {
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getProducts(query: FindProductsQueryDto) {
    const where: FindOptionsWhere<Product> = {};

    if (query.active !== undefined) {
      where.isActive = query.active === 'true';
    }

    if (query.merchantId !== undefined) {
      where.merchantId = query.merchantId;
    }

    return this.entityManager.find(Product, {
      where,
      order: { id: 'DESC' },
    });
  }

  async getProduct(productId: number) {
    const product = await this.entityManager.findOne(Product, {
      where: {
        id: productId,
      },
    });

    if (!product) throw new NotFoundException(errorMessages.product.notFound);

    return product;
  }

  async getProductEvents(productId: number) {
    await this.getProduct(productId);

    return this.entityManager.find(ProductEvent, {
      where: { productId },
      order: { occurredAt: 'ASC', id: 'ASC' },
    });
  }

  async createProduct(data: CreateProductDto, merchantId: number) {
    const category = await this.entityManager.findOne(Category, {
      where: {
        id: data.categoryId,
      },
    });

    if (!category) throw new NotFoundException(errorMessages.category.notFound);

    const product = this.entityManager.create(Product, {
      category,
      merchantId,
      ...data,
    });

    const savedProduct = await this.entityManager.save(product);

    void this.eventEmitter.emitAsync(
      PRODUCT_CREATED_EVENT,
      new ProductCreatedEvent(
        savedProduct.id,
        savedProduct.merchantId,
        savedProduct.categoryId,
      ),
    );

    return savedProduct;
  }

  async addProductDetails(
    productId: number,
    body: ProductDetailsDto,
    merchantId: number,
    isAdmin = false,
  ) {
    await this.getProductForLifecycle(productId, merchantId, isAdmin);

    const qb = this.entityManager
      .createQueryBuilder()
      .update<Product>(Product)
      .set({
        ...body,
      })
      .where('id = :id', { id: productId });

    if (!isAdmin) {
      qb.andWhere('merchantId = :merchantId', { merchantId });
    }

    const result = await qb.returning(['id']).execute();

    if (result.affected < 1)
      throw new NotFoundException(errorMessages.product.notFound);

    return result.raw[0];
  }

  async activateProduct(
    productId: number,
    merchantId: number,
    isAdmin = false,
  ) {
    const product = await this.getProductForLifecycle(
      productId,
      merchantId,
      isAdmin,
    );

    // Admin can force activation for legacy/incomplete records in this demo.
    if (!isAdmin && !(await this.validate(product)))
      throw new ConflictException(errorMessages.product.notFulfilled);

    const qb = this.entityManager
      .createQueryBuilder()
      .update<Product>(Product)
      .set({
        isActive: true,
      })
      .where('id = :id', { id: productId });

    if (!isAdmin) {
      qb.andWhere('merchantId = :merchantId', { merchantId });
    }

    const result = await qb.returning(['id', 'isActive']).execute();

    if (result.affected < 1)
      throw new NotFoundException(errorMessages.product.notFound);

    const activatedProduct = result.raw[0];

    void this.eventEmitter.emitAsync(
      PRODUCT_ACTIVATED_EVENT,
      new ProductActivatedEvent(activatedProduct.id, product.merchantId),
    );

    return activatedProduct;
  }

  async deactivateProduct(
    productId: number,
    merchantId: number,
    isAdmin = false,
  ) {
    const product = await this.getProductForLifecycle(
      productId,
      merchantId,
      isAdmin,
    );

    const qb = this.entityManager
      .createQueryBuilder()
      .update<Product>(Product)
      .set({
        isActive: false,
      })
      .where('id = :id', { id: productId });

    if (!isAdmin) {
      qb.andWhere('merchantId = :merchantId', { merchantId });
    }

    const result = await qb.returning(['id', 'isActive']).execute();

    if (result.affected < 1)
      throw new NotFoundException(errorMessages.product.notFound);

    const deactivatedProduct = result.raw[0];

    void this.eventEmitter.emitAsync(
      PRODUCT_DEACTIVATED_EVENT,
      new ProductDeactivatedEvent(deactivatedProduct.id, product.merchantId),
    );

    return deactivatedProduct;
  }

  async validate(product: Product) {
    const errors = await validate(product);

    if (errors.length > 0) return false;

    return true;
  }

  private async getProductForLifecycle(
    productId: number,
    actorMerchantId: number,
    isAdmin: boolean,
  ) {
    const where: FindOptionsWhere<Product> = { id: productId };
    const product = await this.entityManager.findOne(Product, { where });

    if (!product) {
      throw new NotFoundException(errorMessages.product.notFound);
    }

    if (!isAdmin && product.merchantId !== actorMerchantId) {
      throw new ForbiddenException(errorMessages.auth.notAllowed);
    }

    return product;
  }

  async deleteProduct(productId: number, merchantId: number) {
    const result = await this.entityManager
      .createQueryBuilder()
      .delete()
      .from(Product)
      .where('id = :productId', { productId })
      .andWhere('merchantId = :merchantId', { merchantId })
      .execute();

    if (result.affected < 1)
      throw new NotFoundException(errorMessages.product.notFound);

    return successObject;
  }
}
