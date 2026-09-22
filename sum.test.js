// sum.test.js — ЭХЛЭЭД ТЕСТЛЭЛИЙГ БИЧИХ (TDD-ийн "Улаан" шат)
const sum = require('./sum');

test('1 + 2 = 3 гарах ёстой', () => {
  expect(sum(1, 2)).toBe(3);
});
