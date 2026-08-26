const { mainKeyboard } = require('../keyboards/main');
const L = require('../labels');

async function showHelp(bot, chatId) {
  const text = `*Помощь*\n\n` +
    `*${L.BTN_STATS}* — обзор по товарам и заявкам\n` +
    `*${L.BTN_PRODUCTS}* — управление каталогом\n` +
    `*${L.BTN_REVIEWS}* — отзывы на сайте\n` +
    `*${L.BTN_WORKS}* — фото работ\n\n` +
    `${L.BTN_CANCEL} / ${L.BTN_BACK} / ${L.BTN_MENU} — выход из мастера`;

  bot.sendMessage(chatId, text, { parse_mode: 'Markdown', ...mainKeyboard });
}

module.exports = { showHelp };
