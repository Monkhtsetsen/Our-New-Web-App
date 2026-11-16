**Асуулт 1. Ажил дууссан гэж хэзээ хэлэх вэ?**
Багийн хэлэлцүүлгийн үр дүнд тухайн ажил нь тавигдсан шаардлагын дагуу бүрэн хэрэгжиж, кодын алдааг шалгаж, шаардлагатай тестүүдийг амжилттай давсан, багийн гишүүдээр хянуулсан, баримтжуулалт хийгдсэн тохиолдолд дууссан гэж үзнэ.
Мөн тухайн функц зөв ажиллаж байгаа нь тестээр батлагдсан бөгөөд бусад функцийн ажиллагаанд сөргөөр нөлөөлөөгүй байх шаардлагатай.
**Асуулт 2. Кодыг Production орчинд байрлуулахад ямар шаардлагууд хангагдсан байх ёстой вэ?**
Багийн хэлэлцүүлгийн үр дүнд кодыг Production орчинд байрлуулахаас өмнө дараах шаардлагуудыг хангасан байх ёстой гэж үзэв.
Программын бүх шаардлагатай функц бүрэн хэрэгжсэн байх.
Кодын синтакс болон логикийн алдааг зассан байх.
Нэгжийн тестүүд (Unit Testing) амжилттай давсан байх.
Integration тест шаардлагатай тохиолдолд амжилттай давсан байх.
Багийн гишүүдээр Code Review хийлгэсэн байх.
Кодын стандарт, загварчлалын дүрмийг мөрдсөн байх.
Аюулгүй байдлын үндсэн шаардлагуудыг хангасан байх.
Шаардлагатай баримтжуулалт хийгдсэн байх.
Программын өгөгдөл болон нөөцлөлтийн тохиргоо бэлэн байх.
Production орчинд байршуулсны дараа системийн ажиллагааг шалгах боломжтой байх.
**Эхлээд sum.js файлыг бичихгүйгээр зөвхөн tests/sum.test.js файлыг үүсгэж, дараах тестийн кодыг бичнэ.**
const sum = require('../src/sum');

test('1 + 2 = 3 гарах ёстой', () => {
    expect(sum(1, 2)).toBe(3);
});

npm test

> lab_11_nemelt@1.0.0 test
> jest

 FAIL  tests/sum.test.js
  ✕ 1 + 2 = 3 гарах ёстой (1 ms)

  ● 1 + 2 = 3 гарах ёстой

    TypeError: sum is not a function

      3 |
      4 | test('1 + 2 = 3 гарах ёстой', () => {
    > 5 |     expect(sum(1, 2)).toBe(3);
        |            ^
      6 | });
      7 |

      at Object.sum (tests/sum.test.js:5:12)

Test Suites: 1 failed, 1 total
Tests:       1 failed, 1 total
Snapshots:   0 total
Time:        0.192 s
Ran all test suites.

**Одоо src/sum.js файлыг үүсгэж дараах кодыг бичнэ.**
function sum(a, b) {
    return a + b;
}

module.exports = sum

npm test

> lab_11_nemelt@1.0.0 test
> jest

 PASS  tests/sum.test.js
  ✓ 1 + 2 = 3 гарах ёстой (1 ms)

Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total
Snapshots:   0 total
Time:        0.171 s, estimated 1 s
Ran all test suites.

**Одоо функцэд тоон бус утга оруулсан үед алдаа заадаг байх шаардлага нэмнэ.**
const sum = require('../src/sum');

test('1 + 2 = 3 гарах ёстой', () => {
    expect(sum(1, 2)).toBe(3);
});

test('Тоо биш өгөгдөл өгвөл алдаа заана', () => {
    expect(() => sum('1', 2))
        .toThrow('Тоо оруулах шаардлагатай!');
});

 npm test

> lab_11_nemelt@1.0.0 test
> jest

 FAIL  tests/sum.test.js
  ✓ 1 + 2 = 3 гарах ёстой (1 ms)
  ✕ Тоо биш өгөгдөл өгвөл алдаа заана (1 ms)

  ● Тоо биш өгөгдөл өгвөл алдаа заана

    expect(received).toThrow(expected)

    Expected substring: "Тоо оруулах шаардлагатай!"

    Received function did not throw

       8 | test('Тоо биш өгөгдөл өгвөл алдаа заана', () => {
       9 |     expect(() => sum('1', 2))
    > 10 |         .toThrow('Тоо оруулах шаардлагатай!');
         |          ^
      11 | });
      12 |

      at Object.toThrow (tests/sum.test.js:10:10)

Test Suites: 1 failed, 1 total
Tests:       1 failed, 1 passed, 2 total
Snapshots:   0 total
Time:        0.185 s, estimated 1 s
Ran all test suites.
**Тайлбар: Одоогийн sum() функц тоон бус утгыг шалгах нөхцөлгүй байгаа учраас шаардлагатай алдааг үүсгэсэнгүй. Иймээс хоёр дахь тест амжилтгүй боллоо. Энэ нь дахин RED үе шат юм.**

**Одоо src/sum.js файлын кодыг дараах байдлаар өөрчилнө.**
function sum(a, b) {

    if (typeof a !== 'number' || typeof b !== 'number') {
        throw new Error('Тоо оруулах шаардлагатай!');
    }

    return a + b;
}

module.exports = sum;


npm test

> lab_11_nemelt@1.0.0 test
> jest

 PASS  tests/sum.test.js
  ✓ 1 + 2 = 3 гарах ёстой (2 ms)
  ✓ Тоо биш өгөгдөл өгвөл алдаа заана (1 ms)

Test Suites: 1 passed, 1 total
Tests:       2 passed, 2 total
Snapshots:   0 total
Time:        0.174 s, estimated 1 s
Ran all test suites.

**Кодын давхардлыг багасгаж, тоо шалгах үйлдлийг тусдаа функц болгон салгана.**

function validateNumbers(a, b) {
    if (typeof a !== 'number' || typeof b !== 'number') {
        throw new Error('Тоо оруулах шаардлагатай!');
    }
}

function sum(a, b) {
    validateNumbers(a, b);
    return a + b;
}

module.exports = sum;

 npm test

> lab_11_nemelt@1.0.0 test
> jest

 PASS  tests/sum.test.js
  ✓ 1 + 2 = 3 гарах ёстой (1 ms)
  ✓ Тоо биш өгөгдөл өгвөл алдаа заана (2 ms)

Test Suites: 1 passed, 1 total
Tests:       2 passed, 2 total
Snapshots:   0 total
Time:        0.175 s, estimated 1 s
Ran all test suites.

# Definition of Done (DoD)

## 1. Ажил дууссан гэж үзэх нөхцөл

- Шаардлагын дагуу код бичигдсэн байх.
- Кодын алдаа шалгагдсан байх.
- Unit test амжилттай давсан байх.
- Code review хийгдсэн байх.
- Баримтжуулалт хийгдсэн байх.

## 2. Production-д байршуулах шаардлага

- Бүх функц бүрэн ажилладаг байх.
- Бүх unit test PASS болсон байх.
- Integration test амжилттай байх.
- Аюулгүй байдлын шалгалт хийгдсэн байх.
- Кодын стандарт мөрдсөн байх.
- Баримтжуулалт бэлэн байх.

## 3. Багийн DoD Checklist

- [ ] Код бичигдсэн.
- [ ] Unit test бичигдсэн.
- [ ] Бүх тест амжилттай давсан.
- [ ] Code review хийгдсэн.
- [ ] Кодын стандарт мөрдсөн.
- [ ] Баримтжуулалт хийгдсэн.
