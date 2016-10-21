/**
 * Created by lizude on 16/9/20.
 */
'use strict';

module.exports = {
  // 监听端口
  port: 5345,

  // 请求超时时间
  timeout: 60,

  //数据库
  db: {
    dbname: 'tfsec_licence',
    username: 'root',
    password: 'Admin123',
    host: 'localhost',
    port: 3306,
    pool: 10
  },

  //session
  session: {
    expired: 1 * 60 * 60 * 1000 //超时设置(毫秒)
  }
};



