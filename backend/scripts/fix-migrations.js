const knex = require('knex')(require('../knexfile').development);

async function fix() {
  try {
    await knex.raw("SELECT setval('knex_migrations_id_seq', COALESCE((SELECT MAX(id)+1 FROM knex_migrations), 1), false)");
    console.log("Sequence fixed.");
  } catch (e) {
    console.error(e);
  } finally {
    knex.destroy();
  }
}

fix();
