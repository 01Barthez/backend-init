import change_password from './Auth/change_password';
import forgot_password from './Auth/forgot_password';
import login from './Auth/login';
import logout from './Auth/logout';
import resend_otp from './Auth/resend_otp';
import reset_password from './Auth/reset_password';
import signup from './Auth/signup';
import verify_otp from './Auth/verify_otp';
import oauth_accounts from './OAuth/oauth-accounts';
import oauth_authorize from './OAuth/oauth-authorize';
import oauth_callback from './OAuth/oauth-callback';
import oauth_unlink from './OAuth/oauth-unlink';
import telegram_auth from './OAuth/telegram-auth';
import clear_all_users from './users/clear_all_users';
import delete_user from './users/delete_user';
import delete_user_permently from './users/delete_user_permently';
import export_users from './users/export_users';
import get_user_by_id from './users/get_user_by_id';
import list_users from './users/list_users';
import restore_deleted_user from './users/restore_deleted_user';
import search_user from './users/search_user';
import update_user_info from './users/update_user_info';
import update_user_role from './users/update_user_role';

const users_controller = {
  // ***************************************************************************************************************************************************************************************************************************************
  //* AUTH ******************************************************************************************
  // ***************************************************************************************************************************************************************************************************************************************
  login,
  logout,
  verify_otp,
  resend_otp,
  signup,
  reset_password,
  forgot_password,
  change_password,

  // ***************************************************************************************************************************************************************************************************************************************
  //* OAUTH2.0 AUTHENTICATION ******************************************************************************************
  // ***************************************************************************************************************************************************************************************************************************************
  oauth_authorize,
  oauth_callback,
  oauth_accounts,
  oauth_unlink,
  telegram_auth,

  // ***************************************************************************************************************************************************************************************************************************************
  //* MANAGE USER ******************************************************************************************
  // ***************************************************************************************************************************************************************************************************************************************
  list_users,
  search_user,
  get_user_by_id,
  update_user_info,
  update_user_role,
  export_users,
  clear_all_users,
  delete_user_permently,
  restore_deleted_user,
  delete_user,
};

export default users_controller;
