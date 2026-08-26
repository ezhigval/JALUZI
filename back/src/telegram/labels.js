// Shared Telegram admin button labels (no decorative emoji).
module.exports = {
  BTN_STATS: 'Статистика',
  BTN_PRODUCTS: 'Товары',
  BTN_REVIEWS: 'Отзывы',
  BTN_WORKS: 'Работы',
  BTN_HELP: 'Помощь',
  BTN_CANCEL: 'Отмена',
  BTN_BACK: 'Назад',
  BTN_MENU: 'В меню',
  BTN_ALL_PRODUCTS: 'Все товары',
  BTN_ADD_PRODUCT: 'Добавить товар',
  BTN_EDIT: 'Редактировать',
  BTN_DELETE: 'Удалить',
  BTN_ALL_REVIEWS: 'Все отзывы',
  BTN_ADD_REVIEW: 'Добавить отзыв',
  BTN_DELETE_REVIEW: 'Удалить отзыв',
  BTN_ALL_WORKS: 'Все работы',
  BTN_ADD_WORK: 'Добавить работу',
  BTN_DELETE_WORK: 'Удалить работу',
  BTN_NAME: 'Название',
  BTN_CATEGORY: 'Категория',
  BTN_PRICE: 'Цена',
  BTN_STOCK: 'В наличии',
  BTN_UPLOAD_PHOTO: 'Загрузить фото',
  BTN_DONE: 'Готово',
  isNav(text) {
    return text === this.BTN_CANCEL || text === this.BTN_BACK || text === this.BTN_MENU;
  }
};
