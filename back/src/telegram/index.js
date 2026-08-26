const { Telegraf } = require('telegraf');
const config = require('../config');
const { isAuthorized, saveChat } = require('./middleware/auth');
const { getUserState, clearUserState } = require('./middleware/state');
const { mainKeyboard } = require('./keyboards/main');

const {
  showProducts,
  showStats,
  productsMenu,
  startAdd,
  startEdit,
  startDelete,
  handleState: handleProductState
} = require('./handlers/products');
const {
  showAllReviews,
  reviewsMenu,
  startAddReview,
  startDeleteReview,
  handleState: handleReviewState
} = require('./handlers/reviews');
const {
  showAllWorks,
  worksMenu,
  startAddWork,
  startDeleteWork,
  handleState: handleWorkState,
  handlePhotoUpload
} = require('./handlers/works');
const { showHelp } = require('./handlers/menu');
const { handlePhotoUpload: handleProductPhoto } = require('./handlers/photos');
const L = require('./labels');

let app = null;
let bot = null;

function normalizeSendOptions(options = {}) {
  if (!options || typeof options !== 'object') {
    return {};
  }

  const { timeout, ...safeOptions } = options;
  return safeOptions;
}

function createBotApi(telegrafApp) {
  return {
    async sendMessage(chatId, text, options = {}) {
      return telegrafApp.telegram.sendMessage(chatId, text, normalizeSendOptions(options));
    },
    async getFileLink(fileId) {
      const link = await telegrafApp.telegram.getFileLink(fileId);
      return String(link);
    },
    stop(reason = 'shutdown') {
      telegrafApp.stop(reason);
    }
  };
}

function setupHandlers(telegrafApp, botApi) {
  // Обработчик callback_query для инлайн-кнопок (пагинация)
  telegrafApp.on('callback_query', async (ctx) => {
    const chatId = ctx.chat.id;
    const data = ctx.callbackQuery.data;

    if (!data) return ctx.answerCbQuery();

    // Пагинация товаров: prod_page:N
    if (data.startsWith('prod_page:')) {
      await ctx.answerCbQuery();
      const page = parseInt(data.split(':')[1]);
      if (isNaN(page) || page < 1) return;

      const state = getUserState(chatId);

      if (!state) {
        await showProducts(botApi, chatId, page);
      } else if (state.action === 'edit_select') {
        state.page = page;
        await startEdit(botApi, chatId, page);
      } else if (state.action === 'delete') {
        state.page = page;
        await startDelete(botApi, chatId, page);
      } else {
        await showProducts(botApi, chatId, page);
      }
      return;
    }

    // Игнорирование кликов по неактивным кнопкам
    if (data === 'ignore') {
      await ctx.answerCbQuery();
      return;
    }

    // Остальные callback_query игнорируем
    await ctx.answerCbQuery();
  });

  telegrafApp.use(async (ctx, next) => {
    const msg = ctx.message;

    if (!msg) {
      return next();
    }

    const chatId = msg.chat.id;
    const text = typeof msg.text === 'string' ? msg.text : '';

    if (Array.isArray(msg.photo) && msg.photo.length) {
      if (!isAuthorized(chatId)) {
        return;
      }

      const state = getUserState(chatId);

      if (state && (
          (state.action === 'edit' && state.editField === 'photo_upload') ||
          (state.action === 'add' && state.step === 5)
      )) {
        await handleProductPhoto(botApi, msg, state);
        return;
      }

      if (state && state.action === 'add_work' && state.step === 1) {
        await handlePhotoUpload(botApi, msg, state);
      }

      return;
    }

    if (!isAuthorized(chatId)) {
      if (text && !text.startsWith('/') && text === config.telegramBotPassword) {
        saveChat(chatId);
        await botApi.sendMessage(chatId, 'Авторизация успешна.', mainKeyboard);
        return;
      }

      if (text && !text.startsWith('/')) {
        await botApi.sendMessage(chatId, 'Введите пароль или /start');
        return;
      }

      return next();
    }

    const state = getUserState(chatId);
    if (state) {
      if (state.action === 'add' || state.action === 'edit_select' || state.action === 'edit' || state.action === 'delete') {
        await handleProductState(botApi, msg, state);
      } else if (state.action === 'add_review' || state.action === 'delete_review') {
        await handleReviewState(botApi, msg, state);
      } else if (state.action === 'add_work' || state.action === 'delete_work') {
        await handleWorkState(botApi, msg, state);
      }
      return;
    }

    if (text === L.BTN_STATS) {
      await showStats(botApi, chatId);
      return;
    }

    if (text === L.BTN_PRODUCTS) {
      await productsMenu(botApi, chatId);
      return;
    }

    if (text === L.BTN_REVIEWS) {
      await reviewsMenu(botApi, chatId);
      return;
    }

    if (text === L.BTN_WORKS) {
      await worksMenu(botApi, chatId);
      return;
    }

    if (text === L.BTN_HELP) {
      await showHelp(botApi, chatId);
      return;
    }

    if (L.isNav(text)) {
      clearUserState(chatId);
      await botApi.sendMessage(chatId, 'Главное меню:', mainKeyboard);
      return;
    }

    if (text === L.BTN_ALL_PRODUCTS) {
      await showProducts(botApi, chatId);
      return;
    }

    if (text === L.BTN_ADD_PRODUCT) {
      await startAdd(botApi, chatId);
      return;
    }

    if (text === L.BTN_EDIT) {
      await startEdit(botApi, chatId);
      return;
    }

    if (text === L.BTN_DELETE) {
      await startDelete(botApi, chatId);
      return;
    }

    if (text === L.BTN_ALL_REVIEWS) {
      await showAllReviews(botApi, chatId);
      return;
    }

    if (text === L.BTN_ADD_REVIEW) {
      await startAddReview(botApi, chatId);
      return;
    }

    if (text === L.BTN_DELETE_REVIEW) {
      await startDeleteReview(botApi, chatId);
      return;
    }

    if (text === L.BTN_ALL_WORKS) {
      await showAllWorks(botApi, chatId);
      return;
    }

    if (text === L.BTN_ADD_WORK) {
      await startAddWork(botApi, chatId);
      return;
    }

    if (text === L.BTN_DELETE_WORK) {
      await startDeleteWork(botApi, chatId);
      return;
    }

    return next();
  });

  telegrafApp.start(async (ctx) => {
    await botApi.sendMessage(ctx.chat.id, 'Питер-Жалюзи — панель управления.', mainKeyboard);
  });

  telegrafApp.command('stats', async (ctx) => showStats(botApi, ctx.chat.id));
  telegrafApp.command('products', async (ctx) => productsMenu(botApi, ctx.chat.id));
  telegrafApp.command('reviews', async (ctx) => reviewsMenu(botApi, ctx.chat.id));
  telegrafApp.command('works', async (ctx) => worksMenu(botApi, ctx.chat.id));
  telegrafApp.command('help', async (ctx) => showHelp(botApi, ctx.chat.id));
}

function initBot({ mode = 'full' } = {}) {
  if (!config.telegramBotToken) {
    console.error('❌ TELEGRAM_BOT_TOKEN not set');
    return Promise.resolve(null);
  }

  try {
    app = new Telegraf(config.telegramBotToken, {
      handlerTimeout: 15000,
      telegram: {
        apiRoot: config.telegramApiRoot
      }
    });
    bot = createBotApi(app);

    app.catch((error) => {
      console.log('⚠️  TG update:', error.code || error.name, error.message);
    });

    if (mode === 'send-only' || mode === 'send-only') {
      console.log('🤖 Telegram send-only client ready via ' + config.telegramApiRoot);
      return Promise.resolve(bot);
    }

    setupHandlers(app, bot);

    if (config.telegramMode === 'webhook') {
      const webhookPath = config.telegramWebhookPath || '/telegram/webhook';
      let hostname = '';
      try {
        hostname = new URL(config.siteUrl).hostname;
      } catch {
        hostname = String(config.siteUrl || '')
          .replace(/^https?:\/\//, '')
          .split('/')[0];
      }

      if (!hostname && !config.telegramWebhookPublicUrl) {
        console.error('❌ SITE_URL or TELEGRAM_WEBHOOK_PUBLIC_URL required for TELEGRAM_MODE=webhook');
        return Promise.resolve(null);
      }

      const hookUrl =
        config.telegramWebhookPublicUrl || `https://${hostname}${webhookPath}`;

      return app.telegram
        .setWebhook(hookUrl, {
          secret_token: config.telegramWebhookSecret || undefined,
          allowed_updates: ['message', 'callback_query'],
          max_connections: 40
        })
        .then(() => {
          const middleware = app.webhookCallback(webhookPath, {
            secretToken: config.telegramWebhookSecret || undefined
          });
          console.log(`🤖 Telegram webhook → ${hookUrl} via ${config.telegramApiRoot}`);
          bot.webhookMiddleware = middleware;
          bot.webhookPath = webhookPath;
          return bot;
        })
        .catch((error) => {
          console.error('❌ Telegram webhook init failed:', error.message);
          bot = null;
          app = null;
          return null;
        });
    }

    return app
      .launch({
        dropPendingUpdates: false,
        allowedUpdates: ['message', 'callback_query']
      })
      .then(() => {
        console.log('🤖 Telegram bot polling via ' + config.telegramApiRoot);
        return bot;
      })
      .catch((error) => {
        console.error('❌ Telegram bot init failed:', error.message);
        bot = null;
        app = null;
        return null;
      });
  } catch (error) {
    console.error('❌ Telegram bot init failed:', error.message);
    bot = null;
    app = null;
    return Promise.resolve(null);
  }
}

function getBot() {
  return bot;
}

function stopBot(reason = 'shutdown') {
  if (app) {
    try {
      app.stop(reason);
    } catch (error) {
      // send-only clients were never launched
      if (!/not running/i.test(String(error.message || error))) {
        console.error('Telegram stop:', error.message || error);
      }
    }
    app = null;
  }

  bot = null;
}

module.exports = { initBot, getBot, stopBot };