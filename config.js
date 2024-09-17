// config.js

import dotenv from 'dotenv';

dotenv.config();

export const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
export const ALLOWED_USERS = process.env.ALLOWED_USERS.split(',').map(id => parseInt(id.trim()));
export const LOG_LEVEL = process.env.LOG_LEVEL 
export const LOG_TO_CONSOLE = process.env.LOG_TO_CONSOLE 
