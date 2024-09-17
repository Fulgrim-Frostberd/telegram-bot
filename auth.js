// auth.js

import { ALLOWED_USERS } from './config.js';

export const isAuthenticated = (userId) => {
  return ALLOWED_USERS.includes(userId);
};
