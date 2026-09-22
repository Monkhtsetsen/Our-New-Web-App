// sum.js — ДАРАА НЬ ФУНКЦЫГ БИЧИХ (TDD-ийн "Ногоон" шат)

/**
 * Хоёр тоог нэмнэ.
 *
 * @param {number} a - Эхний нэмэгдэхүүн
 * @param {number} b - Хоёр дахь нэмэгдэхүүн
 * @returns {number} Хоёр тооны нийлбэр
 * @throws {Error} Аргумент аль нэг нь тоо биш бол
 */
function sum(a, b) {
  if (typeof a !== 'number' || typeof b !== 'number') {
    throw new Error('Тоо оруулах шаардлагатай!');
  }
  return a + b;
}

module.exports = sum;
