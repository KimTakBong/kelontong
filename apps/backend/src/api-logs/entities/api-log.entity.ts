import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

// No FK to users on purpose: logs must survive even if the user is deleted
// (Architecture-Note §4). Join manually when a user name is needed.
@Entity('api_logs')
export class ApiLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 10 })
  method: string;

  @Index('idx_api_logs_path')
  @Column({ length: 500 })
  path: string;

  @Index('idx_api_logs_status_code')
  @Column({ name: 'status_code' })
  statusCode: number;

  @Column({ type: 'integer' })
  duration: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  ip: string | null;

  @Column({ name: 'user_agent', type: 'varchar', length: 500, nullable: true })
  userAgent: string | null;

  @Index('idx_api_logs_user_id')
  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @Column({ name: 'request_body', type: 'jsonb', nullable: true })
  requestBody: Record<string, unknown> | null;

  @Index('idx_api_logs_created_at')
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
