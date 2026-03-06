import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { RoleIds } from '../../role/enum/role.enum';
import {
  CreateProductDto,
  FindProductsQueryDto,
  ProductDetailsDto,
} from '../dto/product.dto';
import { ProductService } from '../services/product.service';
import { Auth } from 'src/api/auth/guards/auth.decorator';
import { CurrentUser } from 'src/api/auth/guards/user.decorator';
import { User } from 'src/database/entities/user.entity';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  async getProducts(@Query() query: FindProductsQueryDto) {
    return this.productService.getProducts(query);
  }

  @Get(':id')
  async getProduct(@Param('id', ParseIntPipe) productId: number) {
    return this.productService.getProduct(productId);
  }

  @Get(':id/events')
  async getProductEvents(@Param('id', ParseIntPipe) productId: number) {
    return this.productService.getProductEvents(productId);
  }

  @Auth(RoleIds.Admin, RoleIds.Merchant)
  @Post('create')
  async createProduct(
    @Body() body: CreateProductDto,
    @CurrentUser() user: User,
  ) {
    return this.productService.createProduct(body, user.id);
  }

  @Auth(RoleIds.Admin, RoleIds.Merchant)
  @Post(':id/details')
  async addProductDetails(
    @Param('id', ParseIntPipe) productId: number,
    @Body() body: ProductDetailsDto,
    @CurrentUser() user: User,
  ) {
    const isAdmin = user.roles?.some((role) => role.id === RoleIds.Admin);
    return this.productService.addProductDetails(
      productId,
      body,
      user.id,
      isAdmin,
    );
  }

  @Auth(RoleIds.Admin, RoleIds.Merchant)
  @Post(':id/activate')
  async activateProduct(
    @Param('id', ParseIntPipe) productId: number,
    @CurrentUser() user: User,
  ) {
    const isAdmin = user.roles?.some((role) => role.id === RoleIds.Admin);
    return this.productService.activateProduct(productId, user.id, isAdmin);
  }

  @Auth(RoleIds.Admin, RoleIds.Merchant)
  @Post(':id/deactivate')
  async deactivateProduct(
    @Param('id', ParseIntPipe) productId: number,
    @CurrentUser() user: User,
  ) {
    const isAdmin = user.roles?.some((role) => role.id === RoleIds.Admin);
    return this.productService.deactivateProduct(productId, user.id, isAdmin);
  }

  @Auth(RoleIds.Admin, RoleIds.Merchant)
  @Delete(':id')
  async deleteProduct(
    @Param('id', ParseIntPipe) productId: number,
    @CurrentUser() user: User,
  ) {
    return this.productService.deleteProduct(productId, user.id);
  }
}
