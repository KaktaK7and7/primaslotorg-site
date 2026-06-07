const bcrypt = require('bcrypt');
const db = require('../db/database');
const { initializeDatabase } = require('../db/init');
const { uniqueSlug } = require('../utils/slug');

initializeDatabase();

const categories = [
  ['Моторные масла', 'Масла для дизельных двигателей спецтехники и коммерческого транспорта.'],
  ['Трансмиссионные масла', 'Решения для коробок передач, мостов и редукторов.'],
  ['Гидравлические масла', 'Гидравлические жидкости для тяжелых режимов работы.'],
  ['Охлаждающие жидкости', 'Антифризы и охлаждающие жидкости для техники.'],
  ['Другие технические жидкости', 'Смазочные и сервисные жидкости для производственных задач.']
];

const categoryIds = {};
for (const [title, description] of categories) {
  const existing = db.prepare('SELECT * FROM categories WHERE title = ?').get(title);
  if (existing) {
    db.prepare('UPDATE categories SET description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(description, existing.id);
    categoryIds[title] = existing.id;
  } else {
    const slug = uniqueSlug(db, 'categories', title);
    const result = db.prepare(`
      INSERT INTO categories (title, slug, description, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `).run(title, slug, description);
    categoryIds[title] = result.lastInsertRowid;
  }
}

const products = [
  ['TOR Engine Oil 10W-40', 'Моторные масла', 'Полусинтетическое моторное масло для дизельной спецтехники.', '20 л / 205 л'],
  ['TOR Hydraulic HVLP 46', 'Гидравлические масла', 'Всесезонное гидравлическое масло для нагруженных систем.', '20 л / 205 л'],
  ['TOR Transmission Oil 80W-90', 'Трансмиссионные масла', 'Масло для механических трансмиссий, мостов и редукторов.', '20 л / 205 л'],
  ['TOR Coolant G12', 'Охлаждающие жидкости', 'Охлаждающая жидкость для современных систем охлаждения.', '10 л / 20 л / 205 л'],
  ['TOR Gear Oil 75W-90', 'Трансмиссионные масла', 'Синтетическое трансмиссионное масло для тяжелых условий.', '20 л / 205 л'],
  ['TOR Hydraulic HLP 32', 'Гидравлические масла', 'Гидравлическое масло для промышленного оборудования и техники.', '20 л / 205 л'],
  ['TOR Diesel Engine Oil 15W-40', 'Моторные масла', 'Минеральное моторное масло для дизельных двигателей.', '20 л / 205 л'],
  ['TOR Antifreeze Arctic', 'Охлаждающие жидкости', 'Антифриз для работы техники при низких температурах.', '10 л / 20 л / 205 л'],
  ['TOR Universal Tractor Oil', 'Другие технические жидкости', 'Универсальное масло для тракторов и сельхозтехники.', '20 л / 205 л'],
  ['TOR Compressor Oil', 'Другие технические жидкости', 'Компрессорное масло для стабильной работы оборудования.', '20 л / 205 л']
];

for (const [index, product] of products.entries()) {
  const [title, category, shortDescription, packaging] = product;
  const data = {
    title,
    slug: uniqueSlug(db, 'products', title),
    category_id: categoryIds[category],
    short_description: shortDescription,
    full_description: `${shortDescription} Подходит для эксплуатации спецтехники в строительстве, добыче, сельском хозяйстве и логистике. Рекомендации по применению уточняйте у менеджера.`,
    packaging,
    specifications: 'Класс вязкости и допуски уточняются по техническому листу. Подбор выполняется по модели техники, узлу и условиям эксплуатации.',
    image: null,
    is_featured: index < 4 ? 1 : 0
  };
  const existing = db.prepare('SELECT id FROM products WHERE title = ?').get(title);
  if (existing) {
    db.prepare(`
      UPDATE products SET
        category_id=@category_id, short_description=@short_description, full_description=@full_description,
        packaging=@packaging, specifications=@specifications, is_featured=@is_featured, updated_at=CURRENT_TIMESTAMP
      WHERE id=@id
    `).run({ ...data, id: existing.id });
  } else {
    db.prepare(`
      INSERT INTO products (
        title, slug, category_id, short_description, full_description, packaging, specifications, image, is_featured, updated_at
      ) VALUES (
        @title, @slug, @category_id, @short_description, @full_description, @packaging, @specifications, @image, @is_featured, CURRENT_TIMESTAMP
      )
    `).run(data);
  }
}

const pages = [
  ['О компании', 'about', 'ООО «Примаслоторг» поставляет масла и технические жидкости для спецтехники по Приморскому краю. Компания ориентирована на B2B-клиентов: строительные, транспортные, сельскохозяйственные и производственные организации.'],
  ['Доставка', 'delivery', 'Организуем поставки по Приморскому краю. Условия, сроки и объем партии согласуются с менеджером после подбора продукции.'],
  ['Контакты', 'contacts', 'Свяжитесь с менеджером по телефону, email, WhatsApp или MAX. Контактные данные на сайте пока указаны как заглушки и легко меняются в конфиге проекта.']
];

for (const [title, slug, content] of pages) {
  const existing = db.prepare('SELECT id FROM pages WHERE slug = ?').get(slug);
  if (existing) {
    db.prepare('UPDATE pages SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(title, content, existing.id);
  } else {
    db.prepare('INSERT INTO pages (title, slug, content, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)').run(title, slug, content);
  }
}

const passwordHash = bcrypt.hashSync('admin123', 10);
db.prepare('INSERT OR IGNORE INTO users (username, password_hash) VALUES (?, ?)').run('admin', passwordHash);

console.log('Seed completed. Admin: admin / admin123');
