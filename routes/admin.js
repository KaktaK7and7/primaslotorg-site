const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db/database');
const { requireAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { makeSlug, uniqueSlug } = require('../utils/slug');

const router = express.Router();

function productFormData(body, file, existing = {}) {
  return {
    title: body.title?.trim(),
    slug: body.slug?.trim() || makeSlug(body.title),
    category_id: Number(body.category_id),
    short_description: body.short_description?.trim() || '',
    full_description: body.full_description?.trim() || '',
    packaging: body.packaging?.trim() || '',
    specifications: body.specifications?.trim() || '',
    image: file ? `/uploads/${file.filename}` : existing.image || null,
    is_featured: body.is_featured ? 1 : 0
  };
}

function validateProduct(data) {
  const errors = [];
  if (!data.title) errors.push('Укажите название товара.');
  if (!data.slug) errors.push('Укажите slug.');
  if (!data.category_id) errors.push('Выберите категорию.');
  return errors;
}

router.get('/login', (req, res) => {
  res.render('admin/login', { title: 'Вход в админку', error: null });
});

router.post('/login', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(req.body.username);
  if (!user || !bcrypt.compareSync(req.body.password || '', user.password_hash)) {
    return res.status(401).render('admin/login', { title: 'Вход в админку', error: 'Неверный логин или пароль' });
  }
  req.session.user = { id: user.id, username: user.username };
  res.redirect('/admin');
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/admin/login'));
});

router.use(requireAdmin);

router.get('/', (req, res) => {
  const counts = {
    products: db.prepare('SELECT COUNT(*) AS count FROM products').get().count,
    categories: db.prepare('SELECT COUNT(*) AS count FROM categories').get().count,
    pages: db.prepare('SELECT COUNT(*) AS count FROM pages').get().count
  };
  res.render('admin/dashboard', { title: 'Панель управления', counts });
});

router.get('/products', (req, res) => {
  const products = db.prepare(`
    SELECT products.*, categories.title AS category_title
    FROM products
    JOIN categories ON categories.id = products.category_id
    ORDER BY products.updated_at DESC
  `).all();
  res.render('admin/products', { title: 'Товары', products });
});

router.get('/products/new', (req, res) => {
  const categories = db.prepare('SELECT * FROM categories ORDER BY title').all();
  res.render('admin/product-form', { title: 'Новый товар', product: {}, categories, errors: [], action: '/admin/products/new' });
});

router.post('/products/new', upload.single('image'), (req, res) => {
  const data = productFormData(req.body, req.file);
  const errors = validateProduct(data);
  data.slug = uniqueSlug(db, 'products', data.slug);
  if (errors.length) {
    const categories = db.prepare('SELECT * FROM categories ORDER BY title').all();
    return res.status(422).render('admin/product-form', { title: 'Новый товар', product: data, categories, errors, action: '/admin/products/new' });
  }
  db.prepare(`
    INSERT INTO products (title, slug, category_id, short_description, full_description, packaging, specifications, image, is_featured, updated_at)
    VALUES (@title, @slug, @category_id, @short_description, @full_description, @packaging, @specifications, @image, @is_featured, CURRENT_TIMESTAMP)
  `).run(data);
  res.redirect('/admin/products');
});

router.get('/products/:id/edit', (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.redirect('/admin/products');
  const categories = db.prepare('SELECT * FROM categories ORDER BY title').all();
  res.render('admin/product-form', { title: 'Редактировать товар', product, categories, errors: [], action: `/admin/products/${product.id}/edit` });
});

router.post('/products/:id/edit', upload.single('image'), (req, res) => {
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!existing) return res.redirect('/admin/products');
  const data = productFormData(req.body, req.file, existing);
  const errors = validateProduct(data);
  data.slug = uniqueSlug(db, 'products', data.slug, existing.id);
  data.id = existing.id;
  if (errors.length) {
    const categories = db.prepare('SELECT * FROM categories ORDER BY title').all();
    return res.status(422).render('admin/product-form', { title: 'Редактировать товар', product: { ...data, id: existing.id }, categories, errors, action: `/admin/products/${existing.id}/edit` });
  }
  db.prepare(`
    UPDATE products SET
      title=@title, slug=@slug, category_id=@category_id, short_description=@short_description,
      full_description=@full_description, packaging=@packaging, specifications=@specifications,
      image=@image, is_featured=@is_featured, updated_at=CURRENT_TIMESTAMP
    WHERE id=@id
  `).run(data);
  res.redirect('/admin/products');
});

router.post('/products/:id/delete', (req, res) => {
  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  res.redirect('/admin/products');
});

router.get('/categories', (req, res) => {
  const categories = db.prepare('SELECT * FROM categories ORDER BY title').all();
  res.render('admin/categories', { title: 'Категории', categories, editCategory: null, errors: [] });
});

router.post('/categories', (req, res) => {
  const title = req.body.title?.trim();
  const description = req.body.description?.trim() || '';
  if (!title) return renderCategories(res, null, ['Укажите название категории.']);
  db.prepare('INSERT INTO categories (title, slug, description, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)')
    .run(title, uniqueSlug(db, 'categories', req.body.slug || title), description);
  res.redirect('/admin/categories');
});

router.get('/categories/:id/edit', (req, res) => {
  const editCategory = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
  renderCategories(res, editCategory, []);
});

router.post('/categories/:id/edit', (req, res) => {
  const title = req.body.title?.trim();
  if (!title) return renderCategories(res, { ...req.body, id: req.params.id }, ['Укажите название категории.']);
  const slug = uniqueSlug(db, 'categories', req.body.slug || title, req.params.id);
  db.prepare('UPDATE categories SET title = ?, slug = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(title, slug, req.body.description?.trim() || '', req.params.id);
  res.redirect('/admin/categories');
});

router.post('/categories/:id/delete', (req, res) => {
  const count = db.prepare('SELECT COUNT(*) AS count FROM products WHERE category_id = ?').get(req.params.id).count;
  if (count > 0) return renderCategories(res, null, ['Нельзя удалить категорию, в которой есть товары.']);
  db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
  res.redirect('/admin/categories');
});

function renderCategories(res, editCategory, errors) {
  const categories = db.prepare('SELECT * FROM categories ORDER BY title').all();
  res.status(errors.length ? 422 : 200).render('admin/categories', { title: 'Категории', categories, editCategory, errors });
}

router.get('/pages', (req, res) => {
  const pages = db.prepare('SELECT * FROM pages ORDER BY id').all();
  res.render('admin/pages', { title: 'Текстовые страницы', pages });
});

router.get('/pages/:id/edit', (req, res) => {
  const page = db.prepare('SELECT * FROM pages WHERE id = ?').get(req.params.id);
  if (!page) return res.redirect('/admin/pages');
  res.render('admin/page-form', { title: 'Редактировать страницу', page, errors: [] });
});

router.post('/pages/:id/edit', (req, res) => {
  const page = {
    id: req.params.id,
    title: req.body.title?.trim(),
    slug: req.body.slug?.trim(),
    content: req.body.content?.trim() || ''
  };
  const errors = [];
  if (!page.title) errors.push('Укажите заголовок страницы.');
  if (!page.slug) errors.push('Укажите slug.');
  if (errors.length) return res.status(422).render('admin/page-form', { title: 'Редактировать страницу', page, errors });
  page.slug = uniqueSlug(db, 'pages', page.slug, page.id);
  db.prepare('UPDATE pages SET title = ?, slug = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(page.title, page.slug, page.content, page.id);
  res.redirect('/admin/pages');
});

module.exports = router;
