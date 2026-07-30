/**
 * @param {import('knex').Knex} knex
 */
exports.up = async function (knex) {
  // users table
  await knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.string('username', 255).notNullable().unique();
    table.string('password_hash', 255).notNullable();
    table.boolean('is_admin').notNullable().defaultTo(false);
    table.boolean('verified').notNullable().defaultTo(false);
    table.timestamps(true, true);
  });

  // root_directories table
  await knex.schema.createTable('root_directories', (table) => {
    table.increments('id').primary();
    table.string('name', 255).notNullable();
    table.string('path', 1024).notNullable().unique();
    table.timestamps(true, true);
  });

  // user_directory_permissions (for hiding directories)
  await knex.schema.createTable('user_directory_permissions', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('directory_id').unsigned().notNullable().references('id').inTable('root_directories').onDelete('CASCADE');
    table.boolean('is_hidden').notNullable().defaultTo(true); // "admin can hide" -> default to false, wait user said default to see all.
    table.unique(['user_id', 'directory_id']);
  });

  // Since user said "see all directory by default and admin can hide", 
  // we will just store explicit HIDES in user_directory_permissions, or we just store an explicit false for is_hidden.
  // Actually, we can just say "if a row exists with is_hidden=true, it's hidden. Else it's visible."

  // Alter videos table
  await knex.schema.alterTable('videos', (table) => {
    table.integer('directory_id').unsigned().references('id').inTable('root_directories').onDelete('CASCADE');
    // We would need to drop the unique constraint on filename, but sqlite/pg syntax varies. 
    // Knex dropUnique works.
    table.dropUnique(['filename']);
    table.unique(['directory_id', 'filename']);
  });
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function (knex) {
  await knex.schema.alterTable('videos', (table) => {
    table.dropUnique(['directory_id', 'filename']);
    table.unique(['filename']);
    table.dropColumn('directory_id');
  });

  await knex.schema.dropTableIfExists('user_directory_permissions');
  await knex.schema.dropTableIfExists('root_directories');
  await knex.schema.dropTableIfExists('users');
};
