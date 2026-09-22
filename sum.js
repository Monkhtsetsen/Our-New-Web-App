// sum.js — TDD-ийн "Рефактор" шат
//
// Рефакторын дүрэм: ЗАН ТӨЛӨВ ӨӨРЧЛӨГДӨХГҮЙ. Зөвхөн кодын бүтэц сайжирна.
// Тиймээс шинэ тест бичээгүй бөгөөд өмнөх 2 тест ногоон хэвээр байх ёстой.

const ALDAANY_MEDEE = 'Тоо оруулах шаардлагатай!';

/**
 * Өгөгдсөн утга тоо эсэхийг шалгана.
 *
 * Number.isFinite-г сонгосон шалтгаан:
 *   - typeof NaN === 'number' ба typeof Infinity === 'number' тул typeof
 *     шалгалт эдгээрийг нэвтрүүлдэг байв.
 *   - Number.isFinite нь аргументаа тоо руу ХӨРВҮҮЛДЭГГҮЙ тул '2' зэрэг
 *     мөрийг мөн шууд няцаана (глобал isFinite('2') бол true буцаана).
 * Ингэснээр гурван тохиолдлыг нэг шалгалтаар хамрав.
 *
 * @param {*} value - Шалгах утга
 * @throws {Error} Утга нь төгсгөлөг тоо биш бол
 */
function assertNumber(value) {
  if (!Number.isFinite(value)) {
    throw new Error(ALDAANY_MEDEE);
  }
}

/**
 * Хоёр тоог нэмнэ.
 *
 * @param {number} a - Эхний нэмэгдэхүүн
 * @param {number} b - Хоёр дахь нэмэгдэхүүн
 * @returns {number} Хоёр тооны нийлбэр
 * @throws {Error} Аргумент аль нэг нь тоо биш бол
 */
function sum(a, b) {
  assertNumber(a);
  assertNumber(b);
  return a + b;
}

module.exports = sum;
