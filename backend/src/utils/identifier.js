function emailHandle(email) {
  if (!email) return null;
  const local = String(email).split('@')[0] || '';
  const clean = local.toLowerCase().replace(/[^a-z0-9]/g, '');
  return clean.slice(0, 63) || null;
}

const IDENTIFIER_SQL = `
  LOWER(username) = LOWER($1)
  OR LOWER(REGEXP_REPLACE(SPLIT_PART(email, '@', 1), '[^a-zA-Z0-9]', '', 'g')) = LOWER($1)
`;

const IDENTIFIER_ORDER = `
  ORDER BY (LOWER(username) = LOWER($1)) DESC, id ASC
  LIMIT 1
`;

module.exports = { emailHandle, IDENTIFIER_SQL, IDENTIFIER_ORDER };
