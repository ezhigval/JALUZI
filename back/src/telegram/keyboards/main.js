const L = require('../labels');

const mainKeyboard = {
  reply_markup: {
    keyboard: [
      [L.BTN_STATS, L.BTN_PRODUCTS],
      [L.BTN_REVIEWS, L.BTN_WORKS],
      [L.BTN_HELP]
    ],
    resize_keyboard: true
  }
};

const cancelKeyboard = {
  reply_markup: {
    keyboard: [[L.BTN_CANCEL, L.BTN_BACK]],
    resize_keyboard: true
  }
};

const categoryKeyboard = {
  reply_markup: {
    keyboard: [
      ['Рулонные', 'Вертикальные'],
      ['Горизонтальные', 'Пластиковые'],
      ['Зебра', L.BTN_BACK]
    ],
    resize_keyboard: true
  }
};

const editProductKeyboard = {
  reply_markup: {
    keyboard: [
      [L.BTN_NAME, L.BTN_CATEGORY],
      [L.BTN_PRICE, L.BTN_STOCK],
      [L.BTN_UPLOAD_PHOTO, L.BTN_DONE],
      [L.BTN_CANCEL]
    ],
    resize_keyboard: true
  }
};

const reviewsMenuKeyboard = {
  reply_markup: {
    keyboard: [
      [L.BTN_ALL_REVIEWS, L.BTN_ADD_REVIEW],
      [L.BTN_DELETE_REVIEW, L.BTN_MENU]
    ],
    resize_keyboard: true
  }
};

const worksMenuKeyboard = {
  reply_markup: {
    keyboard: [
      [L.BTN_ALL_WORKS, L.BTN_ADD_WORK],
      [L.BTN_DELETE_WORK, L.BTN_MENU]
    ],
    resize_keyboard: true
  }
};

const productsMenuKeyboard = {
  reply_markup: {
    keyboard: [
      [L.BTN_ALL_PRODUCTS, L.BTN_ADD_PRODUCT],
      [L.BTN_EDIT, L.BTN_DELETE],
      [L.BTN_MENU]
    ],
    resize_keyboard: true
  }
};

module.exports = {
  mainKeyboard,
  cancelKeyboard,
  categoryKeyboard,
  editProductKeyboard,
  reviewsMenuKeyboard,
  worksMenuKeyboard,
  productsMenuKeyboard
};
