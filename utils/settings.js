const db = require('../db/database');

const DEFAULT_SETTINGS = [
  { key: 'contacts.email', value: 'vvkoil@mail.ru', label: 'Email', group_name: 'contacts', type: 'input' },
  { key: 'contacts.phone_1', value: '+7 908 990 89 99', label: 'Телефон 1', group_name: 'contacts', type: 'input' },
  { key: 'contacts.phone_2', value: '+7 908 990 98 99', label: 'Телефон 2', group_name: 'contacts', type: 'input' },
  { key: 'contacts.address', value: 'Приморский край, г. Уссурийск, ул. Московская, 12', label: 'Адрес', group_name: 'contacts', type: 'textarea' },

  { key: 'supplier.brand_name', value: 'TOR Oils', label: 'Название бренда', group_name: 'supplier', type: 'input' },
  { key: 'supplier.company_name', value: 'TOR Oils', label: 'Компания поставщика', group_name: 'supplier', type: 'input' },
  { key: 'supplier.status_text', value: 'Официальная дистрибуция продукции TOR Oils', label: 'Статус', group_name: 'supplier', type: 'input' },
  { key: 'supplier.description', value: 'ООО «Примаслоторг» поставляет масла и технические жидкости для спецтехники по Приморскому краю.', label: 'Описание поставщика', group_name: 'supplier', type: 'textarea' },
  { key: 'supplier.quality_text', value: 'Продукция поставляется от проверенного производителя и подбирается под задачи клиента.', label: 'Текст о качестве', group_name: 'supplier', type: 'textarea' },

  { key: 'home.hero_title', value: 'Масла для спецтехники', label: 'Hero: заголовок', group_name: 'home', type: 'input' },
  { key: 'home.hero_subtitle', value: 'Поставка моторных, трансмиссионных, гидравлических масел и охлаждающих жидкостей для спецтехники по Приморскому краю.', label: 'Hero: подзаголовок', group_name: 'home', type: 'textarea' },
  { key: 'home.cta_primary_text', value: 'Смотреть каталог', label: 'Hero: кнопка каталога', group_name: 'home', type: 'input' },
  { key: 'home.cta_secondary_text', value: 'Связаться с менеджером', label: 'Hero: кнопка связи', group_name: 'home', type: 'input' },
  { key: 'home.about_title', value: 'О компании', label: 'О компании: заголовок', group_name: 'home', type: 'input' },
  { key: 'home.about_text', value: 'ООО «Примаслоторг» занимается поставкой масел и технических жидкостей для спецтехники, коммерческого транспорта и промышленного оборудования.', label: 'О компании: текст', group_name: 'home', type: 'textarea' },
  { key: 'home.supplier_title', value: 'Поставщик / бренд', label: 'Поставщик: заголовок', group_name: 'home', type: 'input' },
  { key: 'home.supplier_text', value: 'Каталог продукции поставщика для техники и производства.', label: 'Поставщик: текст', group_name: 'home', type: 'textarea' },
  { key: 'home.delivery_title', value: 'Доставка по Приморскому краю', label: 'Доставка: заголовок', group_name: 'home', type: 'input' },
  { key: 'home.delivery_text', value: 'Организуем поставку продукции по Приморскому краю. Условия доставки уточняйте у менеджера.', label: 'Доставка: текст', group_name: 'home', type: 'textarea' },
  { key: 'home.selection_title', value: 'Нужен подбор масла?', label: 'Подбор: заголовок', group_name: 'home', type: 'input' },
  { key: 'home.selection_text', value: 'Поможем подобрать масло или техническую жидкость под вашу технику, условия эксплуатации и требуемую фасовку.', label: 'Подбор: текст', group_name: 'home', type: 'textarea' },

  { key: 'site.footer_description', value: 'Масла и технические жидкости для спецтехники по Приморскому краю.', label: 'Описание в footer', group_name: 'site', type: 'textarea' }
];

const SETTING_GROUPS = [
  { key: 'contacts', title: 'Контакты' },
  { key: 'supplier', title: 'Поставщик / бренд' },
  { key: 'home', title: 'Главная страница' },
  { key: 'site', title: 'Footer / общие тексты' }
];

function ensureSettingsSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL UNIQUE,
      value TEXT,
      label TEXT,
      group_name TEXT,
      type TEXT NOT NULL DEFAULT 'input',
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const columns = db.prepare('PRAGMA table_info(settings)').all().map((column) => column.name);
  const migrations = [
    ['label', 'ALTER TABLE settings ADD COLUMN label TEXT'],
    ['group_name', 'ALTER TABLE settings ADD COLUMN group_name TEXT'],
    ['type', "ALTER TABLE settings ADD COLUMN type TEXT NOT NULL DEFAULT 'input'"],
    ['updated_at', 'ALTER TABLE settings ADD COLUMN updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP']
  ];

  for (const [column, sql] of migrations) {
    if (!columns.includes(column)) db.exec(sql);
  }

  db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_settings_key ON settings (key);');
}

function ensureDefaultSettings() {
  ensureSettingsSchema();

  const insert = db.prepare(`
    INSERT INTO settings (key, value, label, group_name, type, updated_at)
    VALUES (@key, @value, @label, @group_name, @type, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET
      label=excluded.label,
      group_name=excluded.group_name,
      type=excluded.type
  `);

  for (const setting of DEFAULT_SETTINGS) insert.run(setting);
}

function getSettingsRows() {
  ensureDefaultSettings();
  return db.prepare('SELECT * FROM settings ORDER BY id').all();
}

function getSettingsObject() {
  const settings = {};
  for (const row of getSettingsRows()) {
    const parts = row.key.split('.');
    let current = settings;
    parts.forEach((part, index) => {
      if (index === parts.length - 1) {
        current[part] = row.value || '';
      } else {
        current[part] = current[part] || {};
        current = current[part];
      }
    });
  }
  return settings;
}

function updateSettings(values) {
  ensureDefaultSettings();
  const update = db.prepare('UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?');
  const transaction = db.transaction(() => {
    for (const setting of DEFAULT_SETTINGS) {
      update.run(String(values[setting.key] || '').trim(), setting.key);
    }
  });
  transaction();
}

function phoneHref(phone) {
  return String(phone || '').replace(/[^\d+]/g, '');
}

module.exports = {
  DEFAULT_SETTINGS,
  SETTING_GROUPS,
  ensureDefaultSettings,
  getSettingsRows,
  getSettingsObject,
  updateSettings,
  phoneHref
};
