import log from '@/shared/infrastructure/logging/logger';

import type { UsersRepositoryPort } from '../../domain/repositories/users.repository';
import type { ExportUsersResult } from '../dto/users.dto';

export type ExportUsersDeps = {
  usersRepository: UsersRepositoryPort;
};

/**
 * Builds a CSV export of active (non-deleted) users.
 */
export class ExportUsersQuery {
  constructor(private readonly deps: ExportUsersDeps) {}

  async execute(): Promise<ExportUsersResult> {
    const rows = await this.deps.usersRepository.exportActive();

    const csvHeader = 'ID,Email,First Name,Last Name,Phone,Active,Verified,Created At\n';
    const csvRows = rows
      .map(
        (user) =>
          `${user.id},${user.email},${user.firstName},${user.lastName},${user.phone},${user.isActive},${user.isVerified},${user.createdAt}`,
      )
      .join('\n');
    const csv = csvHeader + csvRows;

    log.info('Users exported', { count: rows.length });

    return { csv, count: rows.length, rows };
  }
}
