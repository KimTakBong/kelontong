import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { ApiLogsService } from './api-logs.service';
import { QueryLogsDto } from './dto/query-logs.dto';

// Admin-only log viewer.
@ApiTags('logs')
@Roles('admin')
@Controller('logs')
export class ApiLogsController {
  constructor(private readonly apiLogsService: ApiLogsService) {}

  @Get()
  @ApiOperation({ summary: 'List API log (admin only)' })
  findAll(@Query() query: QueryLogsDto) {
    return this.apiLogsService.findAll(query);
  }
}
