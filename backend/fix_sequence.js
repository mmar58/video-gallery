const knex = require('knex');
const knexfile = require('./knexfile');

const db = knex(knexfile.development);

async function fix() {
  try {
    await db.raw(`SELECT setval('knex_migrations_id_seq', (SELECT MAX(id) FROM knex_migrations));`);
    console.log('Sequence fixed');
  } catch(e) {
    console.error(e);
  } finally {
    db.destroy();
  }
}

fix();
