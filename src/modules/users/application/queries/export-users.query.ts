import log from '@/shared/infrastructure/logging/logger';

import type { UsersRepositoryPort } from '../../domain/repositories/users.repository';
import type { ExportUsersInput, ExportUsersResult } from '../dto/users.dto';

export type ExportUsersDeps = {
  usersRepository: UsersRepositoryPort;
};

const csvEscape = (value: unknown): string => {
  const raw = String(value ?? '');
  if (/[",\n\r]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
};

/**
 * Builds a CSV export of non-deleted users (optional filters).
 * Row count is capped in the repository to avoid unbounded dumps.
 */
export class ExportUsersQuery {
  constructor(private readonly deps: ExportUsersDeps) {}

  async execute(input: ExportUsersInput = {}): Promise<ExportUsersResult> {
    const rows = await this.deps.usersRepository.exportActive({
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      ...(input.isVerified !== undefined ? { isVerified: input.isVerified } : {}),
      ...(input.search?.trim() ? { search: input.search.trim() } : {}),
    });

    const csvHeader = 'ID,Email,First Name,Last Name,Phone,Active,Verified,Created At\n';
    const csvRows = rows
      .map((user) =>
        [
          csvEscape(user.id),
          csvEscape(user.email),
          csvEscape(user.firstName),
          csvEscape(user.lastName),
          csvEscape(user.phone),
          csvEscape(user.isActive),
          csvEscape(user.isVerified),
          csvEscape(user.createdAt),
        ].join(','),
      )
      .join('\n');
    const csv = csvHeader + csvRows;

    log.info('Users exported', { count: rows.length });

    return { csv, count: rows.length, rows };
  }
}
