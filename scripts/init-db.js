const db = require('../db/database');
const { initializeDatabase } = require('../db/init');
const { uniqueSlug } = require('../utils/slug');
const { ensureDefaultSettings } = require('../utils/settings');

const adminUsername = 'zxfmDarkadmTM';
const adminPasswordHash = '$2b$10$bCEAktNv45EP6Eq2rov.hO0PcACcuUxBmpuHxJMqCbiodr9uvX3eW';

const categories = [
  ['Гидравлические масла', 'Масла TOR для гидравлических систем спецтехники, промышленного оборудования и техники, работающей при переменных температурах.'],
  ['Моторные масла', 'Моторные масла TOR для дизельных двигателей коммерческого транспорта и спецтехники.'],
  ['Трансмиссионные масла', 'Трансмиссионные масла TOR для механических коробок передач, мостов, редукторов и дифференциалов.'],
  ['Трансмиссионно-гидравлические масла', 'Универсальные масла UTTO для трансмиссий, гидросистем, мокрых тормозов и сцеплений строительной и сельскохозяйственной техники.']
];

const products = [
  {
    title: 'Масло гидравлическое TOR Hydraulic HVLP-32 п/с 205л.',
    category: 'Гидравлические масла',
    shortDescription: 'Полусинтетическое гидравлическое масло TOR Hydraulic HVLP-32 для техники и оборудования, работающих при переменных температурах.',
    fullDescription: 'TOR Hydraulic HVLP-32 предназначено для гидравлических систем спецтехники, промышленного и мобильного оборудования. Масло помогает поддерживать стабильную работу гидравлики, защищает узлы от износа и рассчитано на эксплуатацию в тяжелых режимах.',
    packaging: '205 л',
    specifications: 'Тип: гидравлическое масло HVLP\nОснова: полусинтетическая\nКласс вязкости: ISO VG 32\nНазначение: гидравлические системы спецтехники и промышленного оборудования\nИсточник: карточка TOR Hydraulic HVLP-32 на toroils.ru',
    image: '/images/products/tor-hydraulic-hvlp-32-205l.png',
    isFeatured: 1
  },
  {
    title: 'Масло гидравлическое TOR Hydraulic HVLP-46 п/с 205л.',
    category: 'Гидравлические масла',
    shortDescription: 'Полусинтетическое гидравлическое масло TOR Hydraulic HVLP-46 для нагруженных гидросистем спецтехники.',
    fullDescription: 'TOR Hydraulic HVLP-46 применяется в гидравлических системах строительной, дорожной, сельскохозяйственной и промышленной техники. Продукт рассчитан на защиту оборудования от износа и стабильную работу гидравлики при интенсивной эксплуатации.',
    packaging: '205 л',
    specifications: 'Тип: гидравлическое масло HVLP\nОснова: полусинтетическая\nКласс вязкости: ISO VG 46\nНазначение: нагруженные гидравлические системы\nИсточник: карточка TOR Hydraulic HVLP-46 на toroils.ru',
    image: '/images/products/tor-hydraulic-hvlp-46-205l.png',
    isFeatured: 1
  },
  {
    title: 'Масло моторное TOR Premium Diesel 10W40 CI-4/SL синт 20л.',
    category: 'Моторные масла',
    shortDescription: 'Синтетическое моторное масло TOR Premium Diesel 10W40 CI-4/SL для дизельных двигателей коммерческого транспорта и спецтехники.',
    fullDescription: 'TOR Premium Diesel 10W40 CI-4/SL предназначено для надежной защиты дизельных двигателей при тяжелых режимах работы. Масло подходит для коммерческого транспорта и спецтехники, помогает поддерживать чистоту двигателя и стабильные смазочные свойства.',
    packaging: '20 л',
    specifications: 'Тип: моторное масло для дизельных двигателей\nОснова: синтетическая\nВязкость SAE: 10W-40\nКласс API: CI-4/SL\nНазначение: коммерческий транспорт и спецтехника\nИсточник: карточка TOR Premium Diesel 10W40 CI-4/SL на toroils.ru',
    image: '/images/products/tor-premium-diesel-10w40-ci4-sl-20l.png',
    isFeatured: 1
  },
  {
    title: 'Масло моторное TOR Premium Diesel 15W40 CI-4/SL синт 20л.',
    category: 'Моторные масла',
    shortDescription: 'Моторное масло TOR Diesel 15W40 класса CI-4/SL для дизельной техники и коммерческого транспорта.',
    fullDescription: 'Масло линейки TOR Diesel 15W40 рассчитано на защиту дизельных двигателей грузового транспорта и спецтехники. В каталоге производителя точная карточка Premium Diesel 15W40 CI-4/SL не найдена, поэтому описание адаптировано по линейке TOR Diesel и требуемой спецификации.',
    packaging: '20 л',
    specifications: 'Тип: моторное масло для дизельных двигателей\nОснова: синтетическая\nВязкость SAE: 15W-40\nКласс API: CI-4/SL\nНазначение: грузовой транспорт и спецтехника\nИсточник изображения: ближайшая карточка TOR Diesel 15W40 на toroils.ru',
    image: '/images/products/tor-premium-diesel-15w40-ci4-sl-20l.png',
    isFeatured: 1
  },
  {
    title: 'Масло транмиссионное TOR Extra Transmission 75W-90 GL-4/GL-5 синт 20л.',
    category: 'Трансмиссионные масла',
    shortDescription: 'Синтетическое трансмиссионное масло TOR Extra Transmission 75W-90 GL-4/GL-5 для узлов механической трансмиссии.',
    fullDescription: 'TOR Extra Transmission 75W-90 GL-4/GL-5 применяется в механических коробках передач, мостах, редукторах и дифференциалах, где требуется надежная защита зубчатых передач. Продукт рассчитан на стабильную работу трансмиссии и защиту от износа.',
    packaging: '20 л',
    specifications: 'Тип: трансмиссионное масло\nОснова: синтетическая\nВязкость SAE: 75W-90\nКласс API: GL-4/GL-5\nНазначение: МКПП, мосты, редукторы, дифференциалы\nИсточник: карточка TOR Extra Transmission 75W90 GL-4/GL-5 на toroils.ru',
    image: '/images/products/tor-extra-transmission-75w90-gl4-gl5-20l.png',
    isFeatured: 0
  },
  {
    title: 'Масло транмиссионное TOR Extra Transmission 75W-90 GL-4 п.синт 20л.',
    category: 'Трансмиссионные масла',
    shortDescription: 'Полусинтетическое трансмиссионное масло TOR Extra Transmission 75W-90 GL-4 для механических трансмиссий.',
    fullDescription: 'TOR Extra Transmission 75W-90 GL-4 предназначено для механических коробок передач и трансмиссионных узлов, где требуется масло класса GL-4. Подходит для подбора под технику и условия эксплуатации по рекомендации менеджера.',
    packaging: '20 л',
    specifications: 'Тип: трансмиссионное масло\nОснова: полусинтетическая\nВязкость SAE: 75W-90\nКласс API: GL-4\nНазначение: механические коробки передач и трансмиссионные узлы\nИсточник: раздел трансмиссионных масел TOR на toroils.ru',
    image: '/images/products/tor-extra-transmission-75w90-gl4-20l.png',
    isFeatured: 0
  },
  {
    title: 'Масло транмиссионное TOR Extra Transmission 75W-90 GL-5 п.синт 20л.',
    category: 'Трансмиссионные масла',
    shortDescription: 'Полусинтетическое трансмиссионное масло TOR Extra Transmission 75W-90 GL-5 для нагруженных передач.',
    fullDescription: 'TOR Extra Transmission 75W-90 GL-5 используется в трансмиссионных узлах, мостах и редукторах, где требуется защита высоконагруженных зубчатых передач. Рекомендации по применению зависят от требований производителя техники.',
    packaging: '20 л',
    specifications: 'Тип: трансмиссионное масло\nОснова: полусинтетическая\nВязкость SAE: 75W-90\nКласс API: GL-5\nНазначение: мосты, редукторы, высоконагруженные передачи\nИсточник: раздел трансмиссионных масел TOR на toroils.ru',
    image: '/images/products/tor-extra-transmission-75w90-gl5-20l.png',
    isFeatured: 0
  },
  {
    title: 'Масло трансмиссионно-гидравлическое TOR UTTO Extra п/с всесезонное 10W-30 205л.',
    category: 'Трансмиссионно-гидравлические масла',
    shortDescription: 'Полусинтетическое всесезонное масло TOR UTTO Extra 10W-30 для трансмиссий и гидросистем спецтехники.',
    fullDescription: 'TOR UTTO Extra 10W-30 применяется в строительной и сельскохозяйственной технике для ведущих передач, гидросистем, мокрых тормозов и сцеплений. Масло подходит для техники, где требуется универсальная трансмиссионно-гидравлическая жидкость UTTO.',
    packaging: '205 л',
    specifications: 'Тип: UTTO / трансмиссионно-гидравлическое масло\nОснова: полусинтетическая\nВязкость SAE: 10W-30\nСезонность: всесезонное\nНазначение: ведущие передачи, гидросистемы, мокрые тормоза, сцепления\nИсточник: карточка TOR Extra UTTO 10w-30 п/с на toroils.ru',
    image: '/images/products/tor-utto-extra-10w30-205l.png',
    isFeatured: 0
  }
];

const pages = [
  ['О компании', 'about', 'ООО «Примаслоторг» поставляет масла и технические жидкости для спецтехники по Приморскому краю. Компания ориентирована на B2B-клиентов: строительные, транспортные, сельскохозяйственные и производственные организации.'],
  ['Доставка', 'delivery', 'Организуем поставки по Приморскому краю. Условия, сроки и объем партии согласуются с менеджером после подбора продукции.'],
  ['Контакты', 'contacts', 'Контактная информация редактируется в разделе «Настройки сайта».'],
  ['Политика конфиденциальности', 'privacy', 'Сайт не принимает онлайн-оплату и не хранит заявки в базе данных.\nПри обращении через внешние каналы связи обработка персональных данных выполняется для ответа на запрос и подготовки коммерческого предложения.']
];

function ensureCategories() {
  const ids = {};

  for (const [title, description] of categories) {
    const existing = db.prepare('SELECT * FROM categories WHERE title = ?').get(title);
    if (existing) {
      ids[title] = existing.id;
      continue;
    }

    const result = db.prepare(`
      INSERT INTO categories (title, slug, description, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `).run(title, uniqueSlug(db, 'categories', title), description);
    ids[title] = result.lastInsertRowid;
  }

  return ids;
}

function ensureProducts(categoryIds) {
  const count = db.prepare('SELECT COUNT(*) AS count FROM products').get().count;
  if (count > 0) return;

  const insertProduct = db.prepare(`
    INSERT INTO products (
      title, slug, category_id, short_description, full_description, packaging, specifications, image, is_featured, updated_at
    ) VALUES (
      @title, @slug, @category_id, @short_description, @full_description, @packaging, @specifications, @image, @is_featured, CURRENT_TIMESTAMP
    )
  `);

  for (const product of products) {
    insertProduct.run({
      title: product.title,
      slug: uniqueSlug(db, 'products', product.title),
      category_id: categoryIds[product.category],
      short_description: product.shortDescription,
      full_description: product.fullDescription,
      packaging: product.packaging,
      specifications: product.specifications,
      image: product.image,
      is_featured: product.isFeatured
    });
  }
}

function ensurePages() {
  for (const [title, slug, content] of pages) {
    const existing = db.prepare('SELECT id FROM pages WHERE slug = ?').get(slug);
    if (existing) continue;

    db.prepare('INSERT INTO pages (title, slug, content, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)')
      .run(title, slug, content);
  }
}

function ensureAdmin() {
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(adminUsername);
  if (existing) return;

  db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)')
    .run(adminUsername, adminPasswordHash);
}

function initDatabase() {
  initializeDatabase();
  const categoryIds = ensureCategories();
  ensureProducts(categoryIds);
  ensurePages();
  ensureDefaultSettings();
  ensureAdmin();
}

if (require.main === module) {
  initDatabase();
  console.log('Database initialized safely.');
}

module.exports = { initDatabase };
