import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiLog } from './entities/api-log.entity';
import { ApiLogsController } from './api-logs.controller';
import { ApiLogsService } from './api-logs.service';
import { ApiLogsInterceptor } from './api-logs.interceptor';

@Module({
  imports: [TypeOrmModule.forFeature([ApiLog])],
  controllers: [ApiLogsController],
  providers: [ApiLogsService, ApiLogsInterceptor],
  exports: [ApiLogsService, ApiLogsInterceptor],
})
export class ApiLogsModule {}
