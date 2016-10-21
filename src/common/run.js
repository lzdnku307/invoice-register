/**
 * Created by lizude on 16/9/21.
 */
'use strict';

// 引用
var log = require('util').log;

// 运行
module.exports = function (func) {
  return function (req, res, next) {
    // 访问日志
    log(req.method + ' ' + req.url);

    // 执行
    co(function*() {
      let data = yield func(req, res);
      return data;

    }).then(function (data) {
      if(data.type === constant.RENDER) {
        res.render(data.file, data.data || {});
      } else {
        res.send({
          code: 0,
          data: data.data
        });
      }
    }, function (err) {
      console.log(err.stack);
      err.code = err.code || 1;
      res.send({
        code: err.code,
        msg: err.msg || '未知错误'
      });
    });
  };
};
