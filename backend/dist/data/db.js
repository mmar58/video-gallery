"use strict";
const knex = require('knex');
// @ts-ignore
const knexfile = require(require('path').join(__dirname, '../../knexfile.js'));
const db = knex(knexfile.development);
module.exports = db;
