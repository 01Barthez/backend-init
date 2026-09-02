import type { CreateUserInput, UpdateUserInput, UserEntity } from '../entities/user.entity';

/**
 * Port for user persistence required by auth use cases.
 * Infrastructure provides a Prisma implementation.
 */
export interface UserRepositoryPort {
  findByEmail(email: string, options?: { includeDeleted?: boolean }): Promise<UserEntity | null>;

  findById(id: string, options?: { includeDeleted?: boolean }): Promise<UserEntity | null>;

  create(data: CreateUserInput): Promise<UserEntity>;

  update(id: string, data: UpdateUserInput): Promise<UserEntity>;

  /** Convenience: mark session active after successful login. */
  setActive(id: string, isActive: boolean): Promise<void>;
}
