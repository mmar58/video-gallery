/**
 * @param {import('knex').Knex} knex
 */
exports.up = async function (knex) {
  await knex.schema.alterTable('videos', (table) => {
    table.bigInteger('size').defaultTo(0);
    table.datetime('file_created_at');
    table.datetime('file_updated_at');
    table.bigInteger('hide_until');
  });
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function (knex) {
  await knex.schema.alterTable('videos', (table) => {
    table.dropColumn('size');
    table.dropColumn('file_created_at');
    table.dropColumn('file_updated_at');
    table.dropColumn('hide_until');
  });
};
