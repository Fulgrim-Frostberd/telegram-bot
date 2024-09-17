// index.js

import { Telegraf } from 'telegraf';
import { Configuration, OpenAIApi } from 'openai';
import { TELEGRAM_TOKEN, OPENAI_API_KEY } from './config.js';
import { isAuthenticated } from './auth.js';
import { userSessions, limitContextMessages } from './session.js';
import { modelsCommand } from './commands/models.js';
import { imageCommand } from './commands/image.js';
import { startCommand } from './commands/start.js';
import { resetCommand } from './commands/reset.js';
import { redoAction, resetPrompts } from './actions/redo.js';
import logger from './logger.js';

// Создание экземпляра бота и OpenAI
const bot = new Telegraf(TELEGRAM_TOKEN);

const configuration = new Configuration({
  apiKey: OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

// Подключение команд
startCommand(bot);
resetCommand(bot);
modelsCommand(bot, openai);
imageCommand(bot, openai);

// Подключение действий
redoAction(bot, openai);

// Интервал для сброса контекста
const CONTEXT_RESET_INTERVAL = 86400000; // 24 часа

setInterval(() => {
  userSessions.clear();
  resetPrompts();
  logger.info('Контексты сессий очищены.');
}, CONTEXT_RESET_INTERVAL);

// Обработка текстовых сообщений
bot.on('text', async (ctx) => {
  const userId = ctx.from.id;
  const userName = ctx.from.username || ctx.from.first_name || 'Неизвестный';

  if (isAuthenticated(userId)) {
    if (!ctx.message.text.startsWith('/')) {
      let session = userSessions.get(userId) || { active: true, messages: [] };

      // Логируем входящее сообщение
      logger.debug(`Пользователь ${userName} (${userId}) отправил: ${ctx.message.text}`);

      if (ctx.message.reply_to_message && ctx.message.reply_to_message.text) {
        const replyToMessage = {
          role: 'user',
          content: `На сообщение: "${ctx.message.reply_to_message.text}" пользователь ответил: `,
        };
        session.messages.push(replyToMessage);
      }

      session.messages = limitContextMessages([
        ...session.messages,
        { role: 'user', content: ctx.message.text },
      ]);

      userSessions.set(userId, session);

      const messagesForAI = [
        {
          role: 'system',
          content:
            'Представь, что ты Telegram-бот. Вся информация должна быть предоставлена в удобочитаемом для чата виде. Ты не должен упоминать в диалоге, что ты телеграм-бот. Вот что спрашивает пользователь:\n',
        },
        ...session.messages,
      ];

      try {
        // Логируем запрос к OpenAI
        logger.silly(`Запрос к OpenAI для пользователя ${userName} (${userId}): ${JSON.stringify(messagesForAI)}`);

        const chatCompletion = await openai.createChatCompletion({
          model: session?.model || 'chatgpt-4o-latest',
          messages: messagesForAI,
        });

        if (chatCompletion.data.choices && chatCompletion.data.choices.length > 0) {
          const replyContent = chatCompletion.data.choices[0].message.content;
          ctx.reply(replyContent || 'Не могу сформировать ответ.', {
            parse_mode: 'Markdown',
          });

          // Логируем ответ модели
          logger.debug(`Модель ответила пользователю ${userName} (${userId}): ${replyContent}`);

          session.messages.push({ role: 'system', content: replyContent });
          userSessions.set(userId, session);
        } else {
          ctx.reply('Не могу сформировать ответ.', { parse_mode: 'Markdown' });
        }
      } catch (error) {
        logger.error('Ошибка генерации ответа:', error);
        ctx.reply('Ошибка при обработке запроса.', { parse_mode: 'Markdown' });
      }
    }
  } else {
    ctx.reply('У вас нет доступа.', { parse_mode: 'Markdown' });
    logger.warn(`Неавторизованный пользователь ${userName} (${userId}) попытался отправить сообщение.`);
  }
});

// Запуск бота
bot.launch().then(() => {
  logger.info('Бот запущен...');
});
