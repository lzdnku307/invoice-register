/**
 * Created by lizude on 16/9/20.
 */
/**
 * Created by xubensheng on 15/9/06.
 */
'use strict';

// 引用
let fs = require('fs');
let path = require('path');
let co = require('co');
let config = require('./config');
let db = require('./db');
global._ = {};
require('./func');


// 删除旧文件
let schemasDir = path.join(__dirname, '../schemas');
try {
  let schemasFiles = fs.readdirSync(schemasDir);
  for(let i = 0, len = schemasFiles.length; i < len; i++) {
    fs.unlinkSync(path.join(schemasDir, schemasFiles[i]));
  }
} catch(e) {
  //如果没有该目录,则创建该目录
  fs.mkdirSync(schemasDir);
}

co(function* () {
  //查询数据库表
  let tables = yield db.query('show tables', {raw: true, nest: true});
  tables = tables.map(function(table) {
    return table['Tables_in_' + config.db.dbname];
  });

  //根据数据库表结构,自动生成表文件
  for (let i = 0; i < tables.length; i++) {
    var describeQuery = 'DESCRIBE ' + tables[i];
    var cols = yield db.query(describeQuery, {raw: true, nest: true});
    var last = '';
    var data = {};
    data.name = tables[i];
    data.attributes = {};
    for (var j = 0; j < cols.length; j++) {
      var keyValue = 'Field';
      var typeValue = 'Type';
      data.attributes[_.toCamel(cols[j][keyValue])] = {
        type: cols[j][typeValue],
        field: cols[j][keyValue]
      };

      last = cols[j][keyValue];
    }

    var schema = '';
    schema += '\'use strict\';\n\n';
    schema += 'var schema = db.define(\'' + _.toCamel(data.name) + '\', {\n';
    for (var j in data.attributes) {
      if (j === 'id') {
        continue;
      }
      schema += '  ' + _.toCamel(data.attributes[j].field) + ': {\n';
      schema += '    type: \'' + data.attributes[j].type + '\',\n';
      schema += '    field: \'' + data.attributes[j].field + '\'\n';
      schema += '  }';
      if (data.attributes[j].field !== last) {
        schema += ',';
      }
      schema += '\n';
    }
    schema += '}, {\n';
    schema += '  tableName: \'' + data.name + '\',\n';
    schema += '  createdAt: false,\n';
    schema += '  updatedAt: false\n';
    schema += '});\n\n'
    schema += 'module.exports = schema;\n';

    fs.writeFileSync(__dirname + '/../schemas/' + data.name + '.js', schema);
  }

}).then(function () {
  console.log('sync database success!');
  process.exit(0);
}, function (err) {
  console.log(err.stack);
  process.exit(1);
});
