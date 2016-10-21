/**
 * Created by lizude on 16/9/21.
 */
'use strict';

// 引用
var fs = require('fs');
var path = require('path');

// 加载所有模型
var exports = {};
var dir = fs.readdirSync(__dirname + '/../controllers');
for (var i = 0; i < dir.length; i++) {
  if (path.extname(dir[i]) !== '.js') continue;
  exports[_.toCamel(path.basename(dir[i], '.js'))] = require(__dirname + '/../controllers/' + dir[i]);
}

// 导出
module.exports = exports;
