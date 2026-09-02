/**
 * Users express-validator rules (presentation layer).
 */
import { validate_user } from '@/shared/utils/validation/users.validation';

export const usersSchemas = {
  updateUserInfo: validate_user.updateUserInfo,
  updateUserRole: validate_user.updateUserRole,
  deleteUser: validate_user.deleteUser,
  searchUser: validate_user.searchUser,
  listUsers: validate_user.listUsers,
  getUserById: validate_user.getUserById,
};

export { validate_user };
