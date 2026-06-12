import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSourceOptions } from './database/data-source';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { UploadsModule } from './uploads/uploads.module';
import { ApiLogsModule } from './api-logs/api-logs.module';
import { AuthenticatedGuard } from './common/guards/authenticated.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ApiLogsInterceptor } from './api-logs/api-logs.interceptor';

@Module({
  imports: [
    TypeOrmModule.forRoot(dataSourceOptions),
    AuthModule,
    UsersModule,
    CategoriesModule,
    ProductsModule,
    UploadsModule,
    ApiLogsModule,
  ],
  providers: [
    // ── Global guards (order matters: auth first, then role) ──
    { provide: APP_GUARD, useClass: AuthenticatedGuard },
    { provide: APP_GUARD, useClass: RolesGuard },

    // ── Global interceptors ──
    // ApiLogs is outermost so it measures full duration & final status code;
    // Response wraps the payload in the { data } / { data, meta } envelope.
    { provide: APP_INTERCEPTOR, useClass: ApiLogsInterceptor },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },

    // ── Global error envelope ──
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
  ],
})
export class AppModule {}
