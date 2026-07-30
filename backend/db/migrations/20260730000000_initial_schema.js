/**
 * @param {import('knex').Knex} knex
 */
exports.up = async function (knex) {
  // videos table
  await knex.schema.createTable('videos', (table) => {
    table.increments('id').primary();
    table.string('filename', 255).notNullable().unique();
    table.integer('likes').notNullable().defaultTo(0);
    table.timestamps(true, true);
  });

  // tags table
  await knex.schema.createTable('tags', (table) => {
    table.increments('id').primary();
    table.string('name', 255).notNullable().unique();
    table.timestamps(true, true);
  });

  // video_tags junction table
  await knex.schema.createTable('video_tags', (table) => {
    table.increments('id').primary();
    table.integer('video_id').unsigned().notNullable().references('id').inTable('videos').onDelete('CASCADE');
    table.integer('tag_id').unsigned().notNullable().references('id').inTable('tags').onDelete('CASCADE');
    table.unique(['video_id', 'tag_id']);
  });

  // settings table
  await knex.schema.createTable('settings', (table) => {
    table.string('key', 255).primary();
    table.jsonb('value').notNullable();
  });
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('settings');
  await knex.schema.dropTableIfExists('video_tags');
  await knex.schema.dropTableIfExists('tags');
  await knex.schema.dropTableIfExists('videos');
};
