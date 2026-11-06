import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseOptions } from './database/data-source';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ClothesModule } from './clothes/clothes.module';
import { HomeModule } from './home/home.module';
import { OrdersModule } from './orders/orders.module';
import { SharedModule } from './shared/shared.module';
import { HttpLoggingMiddleware } from './common/middleware/http-logger.middleware';

@Module({
  imports: [TypeOrmModule.forRoot({...databaseOptions, retryAttempts: 2}), HomeModule, SharedModule, ClothesModule, OrdersModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // Nest 11 / Express 5 requires a named wildcard; braces include the root route.
    consumer.apply(HttpLoggingMiddleware).forRoutes('{*path}');
  }
}
