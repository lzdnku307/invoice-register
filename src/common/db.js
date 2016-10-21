/**
 * Created by lizude on 16/9/20.
 */
'use strict';

let config = require('./config');
let Sequelize = require('sequelize');

//建立数据库连接,并返回数据库对象
module.exports = new Sequelize(config.db.dbname, config.db.username, config.db.password, {
  dialect: 'mysql',
  host: config.db.host,
  port: config.db.port,
  timezone: '+08:00',
  logging: undefined,
  pool: {
    maxConnections: config.db.pool
  }
});