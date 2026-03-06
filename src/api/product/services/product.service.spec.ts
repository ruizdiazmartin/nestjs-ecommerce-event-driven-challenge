import { EventEmitter2 } from '@nestjs/event-emitter';
import { getEntityManagerToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { successObject } from 'src/common/helper/sucess-response.interceptor';
import {
  Categories,
  Category,
  CategoryIds,
} from 'src/database/entities/category.entity';
import { Product, VariationTypes } from 'src/database/entities/product.entity';
import { errorMessages } from 'src/errors/custom';
import { CreateProductDto, ProductDetailsDto } from '../dto/product.dto';
import { ComputerDetails } from '../dto/productDetails/computer.details';
import { ProductService } from './product.service';

describe('ProductService', () => {
  let service: ProductService;
  let fakeEntityManager: Partial<EntityManager>;
  let fakeEventEmitter: Partial<EventEmitter2>;

  const computersCategory = {
    id: CategoryIds.Computers,
    name: Categories.Computers,
  } as Category;

  const testProduct = {
    id: 1,
    title: 'test title',
    category: computersCategory,
    merchantId: 1,
    categoryId: 1,
  } as Product;

  const fulfilledProduct = {
    id: 3,
    title: 'test title',
    code: 'test UPC code',
    description: 'description 1',
    about: ['about 1'],
    variationType: VariationTypes.NONE,
    details: {
      brand: 'Dell',
      series: 'XPS',
      capacity: 2,
      category: 'Computers',
      capacityType: 'HD',
      capacityUnit: 'TB',
    },
    isActive: true,
    merchantId: 1,
    categoryId: 1,
  } as Product;

  const computerDetails: ComputerDetails = {
    category: Categories.Computers,
    capacity: 2,
    capacityUnit: 'TB',
    capacityType: 'HD',
    brand: 'Dell',
    series: 'XPS',
  };

  const productDetails: ProductDetailsDto = {
    details: computerDetails,
    about: ['about 1'],
    description: 'test description',
    code: 'test UPC code',
    title: 'test title',
    variationType: VariationTypes.NONE,
  };

  const createProductPayload: CreateProductDto = {
    categoryId: 1,
    title: 'test title',
    code: 'test UPC code',
    variationType: VariationTypes.NONE,
    description: 'test description',
    about: ['about 1'],
    details: computerDetails,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    fakeEntityManager = {
      findOne: jest.fn().mockImplementation(async (entity) => {
        if (entity === Category) {
          return computersCategory;
        }
        return testProduct;
      }),
      find: jest.fn().mockResolvedValue([]),
      save: jest.fn().mockImplementation((data) => data),
      create: jest.fn().mockReturnValue(testProduct),
      createQueryBuilder: jest.fn().mockReturnValue({
        update: jest.fn(),
        delete: jest.fn(),
      }),
    };

    fakeEventEmitter = {
      emitAsync: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        {
          provide: getEntityManagerToken(),
          useValue: fakeEntityManager,
        },
        {
          provide: EventEmitter2,
          useValue: fakeEventEmitter,
        },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getProducts', () => {
    it('should return all products when no filters provided', async () => {
      await service.getProducts({});

      expect(fakeEntityManager.find).toBeCalledWith(Product, {
        where: {},
        order: { id: 'DESC' },
      });
    });

    it('should apply filters for active and merchantId', async () => {
      await service.getProducts({ active: 'true', merchantId: 4 });

      expect(fakeEntityManager.find).toBeCalledWith(Product, {
        where: { isActive: true, merchantId: 4 },
        order: { id: 'DESC' },
      });
    });
  });

  describe('getProduct', () => {
    it('should throw not found product', async () => {
      fakeEntityManager.findOne = jest.fn().mockResolvedValue(null);
      const result = service.getProduct(1);

      expect(fakeEntityManager.findOne).toBeCalled();
      expect(result).rejects.toThrowError(
        errorMessages.product.notFound.message,
      );
    });

    it('should success', async () => {
      fakeEntityManager.findOne = jest.fn().mockResolvedValue(testProduct);
      const result = await service.getProduct(1);
      expect(fakeEntityManager.findOne).toBeCalled();
      expect(result.id).toBe(testProduct.id);
    });
  });

  describe('getProductEvents', () => {
    it('should throw not found product', async () => {
      fakeEntityManager.findOne = jest.fn().mockResolvedValue(null);
      const result = service.getProductEvents(1);

      expect(result).rejects.toThrowError(
        errorMessages.product.notFound.message,
      );
    });

    it('should success', async () => {
      fakeEntityManager.findOne = jest.fn().mockResolvedValue(testProduct);
      fakeEntityManager.find = jest
        .fn()
        .mockResolvedValue([{ id: 1, productId: 1, type: 'PRODUCT_CREATED' }]);

      const result = await service.getProductEvents(1);

      expect(fakeEntityManager.findOne).toBeCalled();
      expect(fakeEntityManager.find).toBeCalled();
      expect(result).toHaveLength(1);
    });
  });

  describe('createProduct', () => {
    it('should throw not found category', async () => {
      fakeEntityManager.findOne = jest.fn().mockResolvedValue(null);
      const result = service.createProduct(createProductPayload, 1);

      expect(fakeEntityManager.findOne).toBeCalled();
      expect(result).rejects.toThrowError(
        errorMessages.category.notFound.message,
      );
    });

    it('should success', async () => {
      const result = await service.createProduct(createProductPayload, 1);

      expect(fakeEntityManager.findOne).toBeCalled();
      expect(fakeEntityManager.create).toBeCalled();
      expect(fakeEventEmitter.emitAsync).toBeCalled();
      expect(result.id).toBe(testProduct.id);
    });
  });

  describe('addProductDetails', () => {
    it('should throw not allowed for non-owner merchant', async () => {
      fakeEntityManager.findOne = jest.fn().mockResolvedValue({
        ...testProduct,
        merchantId: 999,
      });

      const result = service.addProductDetails(1, productDetails, 1);

      expect(result).rejects.toThrowError(errorMessages.auth.notAllowed.message);
    });

    it('should throw not found product', async () => {
      fakeEntityManager.createQueryBuilder = jest.fn().mockReturnValue({
        update: jest.fn().mockReturnValue({
          set: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          returning: jest.fn().mockReturnThis(),
          execute: jest.fn().mockResolvedValueOnce({ affected: 0, raw: [] }),
        }),
      });
      const result = service.addProductDetails(1, productDetails, 1);

      expect(result).rejects.toThrowError(
        errorMessages.product.notFound.message,
      );
    });

    it('should success', async () => {
      fakeEntityManager.createQueryBuilder = jest.fn().mockReturnValue({
        update: jest.fn().mockReturnValue({
          set: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          returning: jest.fn().mockReturnThis(),
          execute: jest
            .fn()
            .mockResolvedValueOnce({ affected: 1, raw: [testProduct] }),
        }),
      });
      const result = await service.addProductDetails(1, productDetails, 1);

      expect(result.id).toBe(testProduct.id);
    });
  });

  describe('activateProduct', () => {
    it('should throw not found product', async () => {
      fakeEntityManager.findOne = jest.fn().mockReturnValueOnce(null);
      const result = service.activateProduct(1, 1);

      expect(fakeEntityManager.findOne).toBeCalled();
      expect(result).rejects.toThrowError(
        errorMessages.product.notFound.message,
      );
    });

    it('should throw error if product not fulfilled', async () => {
      const incompleteProduct = new Product();
      incompleteProduct.merchantId = 1;
      fakeEntityManager.findOne = jest.fn().mockReturnValueOnce(incompleteProduct);
      const result = service.activateProduct(1, 1);

      expect(fakeEntityManager.findOne).toBeCalled();
      expect(result).rejects.toThrowError(
        errorMessages.product.notFulfilled.message,
      );
    });

    it('should success', async () => {
      const returnedActiveProduct = {
        id: 1,
        isActive: true,
      };
      fakeEntityManager.findOne = jest
        .fn()
        .mockReturnValueOnce(fulfilledProduct);
      fakeEntityManager.createQueryBuilder = jest.fn().mockReturnValue({
        update: jest.fn().mockReturnValue({
          set: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          returning: jest.fn().mockReturnThis(),
          execute: jest.fn().mockResolvedValueOnce({
            affected: 1,
            raw: [returnedActiveProduct],
          }),
        }),
      });
      const result = await service.activateProduct(1, 1);

      expect(fakeEntityManager.findOne).toBeCalled();
      expect(fakeEventEmitter.emitAsync).toBeCalled();
      expect(result.id).toBe(returnedActiveProduct.id);
      expect(result.isActive).toBe(true);
    });

    it('should allow admin to activate incomplete product', async () => {
      const returnedActiveProduct = {
        id: 1,
        isActive: true,
      };
      const incompleteProduct = new Product();
      incompleteProduct.id = 1;
      incompleteProduct.merchantId = 999;

      fakeEntityManager.findOne = jest
        .fn()
        .mockReturnValueOnce(incompleteProduct);
      fakeEntityManager.createQueryBuilder = jest.fn().mockReturnValue({
        update: jest.fn().mockReturnValue({
          set: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          returning: jest.fn().mockReturnThis(),
          execute: jest.fn().mockResolvedValueOnce({
            affected: 1,
            raw: [returnedActiveProduct],
          }),
        }),
      });

      const result = await service.activateProduct(1, 1, true);

      expect(result.id).toBe(returnedActiveProduct.id);
      expect(result.isActive).toBe(true);
    });
  });

  describe('deactivateProduct', () => {
    it('should throw not allowed for non-owner merchant', async () => {
      fakeEntityManager.findOne = jest.fn().mockResolvedValue({
        ...testProduct,
        merchantId: 999,
      });

      const result = service.deactivateProduct(1, 1);

      expect(result).rejects.toThrowError(errorMessages.auth.notAllowed.message);
    });

    it('should throw not found product', async () => {
      fakeEntityManager.createQueryBuilder = jest.fn().mockReturnValue({
        update: jest.fn().mockReturnValue({
          set: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          returning: jest.fn().mockReturnThis(),
          execute: jest.fn().mockResolvedValueOnce({ affected: 0, raw: [] }),
        }),
      });
      const result = service.deactivateProduct(1, 1);

      expect(result).rejects.toThrowError(
        errorMessages.product.notFound.message,
      );
    });

    it('should success', async () => {
      const returnedInactiveProduct = {
        id: 1,
        isActive: false,
      };
      fakeEntityManager.createQueryBuilder = jest.fn().mockReturnValue({
        update: jest.fn().mockReturnValue({
          set: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          returning: jest.fn().mockReturnThis(),
          execute: jest.fn().mockResolvedValueOnce({
            affected: 1,
            raw: [returnedInactiveProduct],
          }),
        }),
      });
      const result = await service.deactivateProduct(1, 1);

      expect(fakeEventEmitter.emitAsync).toBeCalled();
      expect(result.id).toBe(returnedInactiveProduct.id);
      expect(result.isActive).toBe(false);
    });
  });

  describe('deleteProduct', () => {
    it('should throw not found product', async () => {
      fakeEntityManager.createQueryBuilder = jest.fn().mockReturnValue({
        delete: jest.fn().mockReturnValue({
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          execute: jest.fn().mockResolvedValueOnce({ affected: 0, raw: [] }),
        }),
      });
      const result = service.deleteProduct(1, 1);

      expect(result).rejects.toThrowError(
        errorMessages.product.notFound.message,
      );
    });

    it('should success', async () => {
      fakeEntityManager.createQueryBuilder = jest.fn().mockReturnValue({
        delete: jest.fn().mockReturnValue({
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          execute: jest.fn().mockResolvedValueOnce({ affected: 1, raw: [] }),
        }),
      });
      const result = await service.deleteProduct(1, 1);

      expect(result.message).toBe(successObject.message);
    });
  });
});
