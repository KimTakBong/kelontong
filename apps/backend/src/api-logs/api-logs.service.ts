import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { PaginatedResult } from '../common/dto/pagination.dto';
import { ApiLog } from './entities/api-log.entity';
import { QueryLogsDto } from './dto/query-logs.dto';

export interface CreateLogParams {
  method: string;
  path: string;
  statusCode: number;
  duration: number;
  ip: string | null;
  userAgent: string | null;
  userId: string | null;
  requestBody: Record<string, unknown> | null;
}

@Injectable()
export class ApiLogsService {
  constructor(
    @InjectRepository(ApiLog)
    private readonly logsRepo: Repository<ApiLog>,
  ) {}

  // Fire-and-forget write from the interceptor. Errors are swallowed so logging
  // never breaks the actual request path.
  async record(params: CreateLogParams): Promise<void> {
    try {
      await this.logsRepo.save(this.logsRepo.create(params));
    } catch {
      // intentionally ignored — observability must not affect request handling
    }
  }

  async findAll(query: QueryLogsDto): Promise<PaginatedResult<ApiLog>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Record<string, unknown> = {};
    if (query.statusCode !== undefined) where.statusCode = query.statusCode;
    if (query.userId) where.userId = query.userId;

    // Date range filter on created_at.
    if (query.startDate && query.endDate) {
      where.createdAt = Between(
        new Date(query.startDate),
        new Date(query.endDate),
      );
    } else if (query.startDate) {
      where.createdAt = MoreThanOrEqual(new Date(query.startDate));
    } else if (query.endDate) {
      where.createdAt = LessThanOrEqual(new Date(query.endDate));
    }

    const qb = this.logsRepo
      .createQueryBuilder('log')
      .where(where)
      .orderBy('log.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    // Partial path match is applied separately (ILIKE).
    if (query.path) {
      qb.andWhere('log.path ILIKE :path', { path: `%${query.path}%` });
    }

    const [items, total] = await qb.getManyAndCount();
    return new PaginatedResult(items, total, page, limit);
  }
}
