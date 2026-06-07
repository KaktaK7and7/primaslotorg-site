const slugify = require('slugify');

function makeSlug(value) {
  return slugify(String(value || ''), {
    lower: true,
    strict: true,
    locale: 'ru'
  });
}

function uniqueSlug(db, table, baseSlug, exceptId = null) {
  let slug = makeSlug(baseSlug) || 'item';
  let candidate = slug;
  let index = 2;

  while (true) {
    const row = exceptId
      ? db.prepare(`SELECT id FROM ${table} WHERE slug = ? AND id != ?`).get(candidate, exceptId)
      : db.prepare(`SELECT id FROM ${table} WHERE slug = ?`).get(candidate);
    if (!row) return candidate;
    candidate = `${slug}-${index}`;
    index += 1;
  }
}

module.exports = { makeSlug, uniqueSlug };
