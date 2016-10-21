/**
 * Created by lizude on 16/9/21.
 */
'use strict';

// 引用
var run = require('./run');

// 路由
module.exports = function(app) {
  //首页
  app.get('/', run(ctrls.user.login));

  //登陆
  app.post('/login', run(ctrls.user.handleLogin));

  //退出
  app.post('/logout', run(ctrls.user.handleLogout));

  app.get('/invoice/add', run(ctrls.invoice.add));

  app.post('/invoice/add', run(ctrls.invoice.handleAdd));

  app.get('/invoice/history', run(ctrls.invoice.history));

  app.get('/invoice/history/data', run(ctrls.invoice.historyData));

  app.get('/invoice/:id/detail', run(ctrls.invoice.detail));

  app.post('/invoice/:id/modify', run(ctrls.invoice.modify));

  app.post('/invoice/:id/delete', run(ctrls.invoice.delete));

  app.get('/user/add', run(ctrls.user.add));

  app.post('/user/add', run(ctrls.user.handleAdd));

  app.get('/user/history', run(ctrls.user.history));

  app.get('/user/history/data', run(ctrls.user.historyData));

  app.get('/user/:userId/export', run(ctrls.user.export));

  app.get('/user/setting', run(ctrls.user.setting));

  app.post('/setting/password', run(ctrls.user.modifyPassword));

  // 404
  app.all('*', function(req, res) {
    res.render('error', {msg: '您访问的网页不存在!'});
  });
};
