import changePassword from './auth/change-password';
import forgotPassword from './auth/forgot-password';
import login from './auth/login';
import logout from './auth/logout';
import resendOtp from './auth/resend-otp';
import resetPassword from './auth/reset-password';
import signup from './auth/signup';
import verifyOtp from './auth/verify-otp';
import oauthAccounts from './oauth/oauth-accounts';
import oauthAuthorize from './oauth/oauth-authorize';
import oauthCallback from './oauth/oauth-callback';
import oauthUnlink from './oauth/oauth-unlink';
import telegramAuth from './oauth/telegram-auth';
import clearAllUsers from './users/clear-all-users';
import deleteUser from './users/delete-user';
import deleteUserPermanently from './users/delete-user-permanently';
import exportUsers from './users/export-users';
import getUserById from './users/get-user-by-id';
import listUsers from './users/list-users';
import restoreUser from './users/restore-user';
import searchUsers from './users/search-users';
import updateUser from './users/update-user';
import updateUserRole from './users/update-user-role';

const usersController = {
  login,
  logout,
  verifyOtp,
  resendOtp,
  signup,
  resetPassword,
  forgotPassword,
  changePassword,
  oauthAuthorize,
  oauthCallback,
  oauthAccounts,
  oauthUnlink,
  telegramAuth,
  listUsers,
  searchUsers,
  getUserById,
  updateUser,
  updateUserRole,
  exportUsers,
  clearAllUsers,
  deleteUserPermanently,
  restoreUser,
  deleteUser,
};

export default usersController;
