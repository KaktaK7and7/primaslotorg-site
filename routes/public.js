const express = require('express');
const db = require('../db/database');
const { getSettingsObject } = require('../utils/settings');

const router = express.Router();

function textToHtml(text) {
  return String(text || '')
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => `<p>${line}</p>`)
    .join('');
}

router.get('/', (req, res) => {
  const categories = db.prepare('SELECT * FROM categories ORDER BY id').all();
  const featuredProducts = db
    .prepare(`
      SELECT products.*, categories.title AS category_title
      FROM products
      JOIN categories ON categories.id = products.category_id
      WHERE is_featured = 1
      ORDER BY products.created_at DESC
      LIMIT 6
    `)
    .all();
  res.render('public/home', { title: 'Масла для спецтехники', categories, featuredProducts });
});

router.get('/catalog', (req, res) => {
  const categories = db.prepare('SELECT * FROM categories ORDER BY title').all();
  const products = db
    .prepare(`
      SELECT products.*, categories.title AS category_title, categories.slug AS category_slug
      FROM products
      JOIN categories ON categories.id = products.category_id
      ORDER BY products.title
    `)
    .all();
  res.render('public/catalog', { title: 'Каталог', categories, products, currentCategory: null });
});

router.get('/catalog/:categorySlug', (req, res) => {
  const currentCategory = db.prepare('SELECT * FROM categories WHERE slug = ?').get(req.params.categorySlug);
  if (!currentCategory) return res.status(404).render('public/404', { title: 'Категория не найдена' });

  const categories = db.prepare('SELECT * FROM categories ORDER BY title').all();
  const products = db
    .prepare(`
      SELECT products.*, categories.title AS category_title, categories.slug AS category_slug
      FROM products
      JOIN categories ON categories.id = products.category_id
      WHERE categories.slug = ?
      ORDER BY products.title
    `)
    .all(req.params.categorySlug);
  res.render('public/catalog', { title: currentCategory.title, categories, products, currentCategory });
});

router.get('/product/:slug', (req, res) => {
  const product = db
    .prepare(`
      SELECT products.*, categories.title AS category_title, categories.slug AS category_slug
      FROM products
      JOIN categories ON categories.id = products.category_id
      WHERE products.slug = ?
    `)
    .get(req.params.slug);
  if (!product) return res.status(404).render('public/404', { title: 'Товар не найден' });

  const settings = getSettingsObject();
  const message = `Здравствуйте! Интересует товар: ${product.title}. Подскажите наличие и условия поставки.`;
  res.render('public/product', {
    title: product.title,
    product,
    emailLink: `mailto:${settings.contacts.email}?subject=${encodeURIComponent(product.title)}&body=${encodeURIComponent(message)}`
  });
});

router.get('/about', (req, res) => renderPage(req, res, 'about'));
router.get('/delivery', (req, res) => renderPage(req, res, 'delivery'));
router.get('/contacts', (req, res) => renderPage(req, res, 'contacts'));
router.get('/privacy', (req, res) => renderPage(req, res, 'privacy'));

function renderPage(req, res, slug) {
  const page = db.prepare('SELECT * FROM pages WHERE slug = ?').get(slug);
  if (!page) return res.status(404).render('public/404', { title: 'Страница не найдена' });
  res.render('public/page', { title: page.title, page, html: textToHtml(page.content) });
}

module.exports = router;
