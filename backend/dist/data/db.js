"use strict";
const knex = require('knex');
// @ts-ignore
const knexfile = require('../../knexfile');
const db = knex(knexfile.development);
module.exports = db;
