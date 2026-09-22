/** @type {import('jest').Config} */
module.exports = {
  // Node орчинд ажиллана (энэ модулиуд хөтчийн DOM шаарддаггүй).
  testEnvironment: 'node',

  // Тест бүрийн нэр, PASS/FAIL мөрийг бүрэн хэвлэнэ.
  verbose: true,

  // reporters-ийг тодорхой заасан шалтгаан:
  // Jest 30 дээр терминал TTY биш үед (ж.нь гаралтыг файл руу дамжуулахад)
  // "PASS ./sum.test.js" болон тест бүрийн нэр хэвлэгдэхгүй, зөвхөн
  // хураангуй л үлддэг байв. Тайланд нотолгоо хадгалах шаардлагатай тул
  // default reporter-ийг ил заав.
  reporters: ['default'],
};
