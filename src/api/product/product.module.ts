import { Module } from '@nestjs/common';
import { ProductService } from './services/product.service';
import { ProductController } from './controllers/product.controller';
import { Category } from '../../database/entities/category.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../user/user.module';
import { User } from '../../database/entities/user.entity';
import { Product } from 'src/database/entities/product.entity';
import { ProductEvent } from 'src/database/entities/productEvent.entity';
import { ProductEventLogListener } from './listeners/product-event-log.listener';
import { ProductActivationMetadataListener } from './listeners/product-activation-metadata.listener';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Product, Category, ProductEvent]),
    UserModule,
  ],
  controllers: [ProductController],
  providers: [
    ProductService,
    ProductEventLogListener,
    ProductActivationMetadataListener,
  ],
})
export class ProductModule {}
