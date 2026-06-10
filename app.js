const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const site = require('./config/site');
const { initDatabase } = require('./scripts/init-db');
const publicRoutes = require('./routes/public');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'primmaslotorg-dev-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 8
    }
  })
);

app.use((req, res, next) => {
  res.locals.site = site;
  res.locals.currentPath = req.path;
  res.locals.adminUser = req.session.user || null;
  next();
});

app.use('/', publicRoutes);
app.use('/admin', adminRoutes);

app.use((req, res) => {
  res.status(404).render('public/404', { title: 'Страница не найдена' });
});

async function start() {
  initDatabase();
  fs.mkdirSync(path.join(__dirname, 'public', 'uploads'), { recursive: true });

  app.listen(PORT, () => {
    console.log(`PrimMasloTorg site started on port ${PORT}`);
  });
}

start().catch((error) => {
  console.error('Failed to start app:', error);
  process.exit(1);
});
