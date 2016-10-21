/**
 * Created by lizude on 16/9/20.
 */
'use strict';

// 引用
let crypto = require('crypto');
let constant = require('./constant');

// 提取字段
_.getFields = function (data, fields, notSetNull) {
  let obj = {};
  notSetNull = !(notSetNull === false);
  for (let i = 0; i < fields.length; i++) {
    if (data[fields[i]] !== undefined) {
      obj[fields[i]] = data[fields[i]];
    } else {
      obj[fields[i]] = notSetNull ? undefined : '';
    }
  }

  return obj;
};

// 随机生成字符串
_.randString = function (len) {
  len = len || 32;
  let dict = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let res = '';
  for (let i = 0; i < len; i++) {
    res += dict[parseInt(Math.random() * dict.length)];
  }
  return res;
};

// 生成MD5
_.md5 = function (s) {
  return crypto.createHash('md5').update(s).digest('hex');
};

// 将下划线命名转换为驼峰命名
_.toCamel = function (name) {
  let newName = '';
  let underline = false;
  for (let i = 0; i < name.length; i++) {
    if (name[i] === '_' || name[i] === '-') {
      underline = true;
    } else {
      newName += underline ? name[i].toUpperCase() : name[i];
      underline = false;
    }
  }
  ;
  return newName;
};

/**
 *
 * @param prefix {Array<String>} 属性前缀
 * @param source {Object} 源对象
 * @param target... {Array<Object>} 要合并属性的对象数组
 * @returns {*}
 */
_.combineModel = function () {
  if (arguments.length < 3) {
    return source;
  }
  var prefix = arguments[0];
  var source = arguments[1];
  var target = Array.prototype.slice.call(arguments, 2, arguments.length);
  var prefix = !_.isArray(prefix) ? [prefix] : prefix;
  for (var i = 0; i < target.length; i++) {
    for (var k in target[i]) {
      source[_.toCamel((prefix[i] ? prefix[i] + '_' : '') + k)] = target[i][k];
    }
  }
  return source;
};

/**
 * 将一维数组转换带有子节点的tree
 * @param arr 一维数组
 * @param idField 节点的ID属性名称
 * @param pidfield 父节点属性名称
 * @param parentId 指定从哪一级开始转换 默认：0(从根节点开始)
 * @returns {Array}
 */
_.transferArrayToTree = function (arr, idField, pidfield, parentId) {
  idField = idField || 'id';
  pidfield = pidfield || 'pid';
  parentId = parentId || null;
  var rows = [];
  for (var i = 0; i < arr.length; i++) {
    rows.push(arr[i]);
  }
  var roots = [];
  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    if (_.isNull(parentId)) {
      if (_.isEmpty(row[pidfield])) {
        roots.push(row);
        rows.splice(i, 1);
        i--;
      }
    } else {
      if (row[pidfield] == parentId) {
        roots.push(row);
        rows.splice(i, 1);
        i--;
      }
    }
  }
  var toDo = [];
  for (var i = 0; i < roots.length; i++) {
    toDo.push(roots[i]);
  }
  while (toDo.length) {
    var node = toDo.shift();
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      if (row[pidfield] == node[idField]) {
        if (node.children) {
          node.children.push(row);
        } else {
          node.children = [row];
        }
        toDo.push(row);
        rows.splice(i, 1);
        i--;
      }
    }
  }
  return roots;
};

// 获取IP地址
_.getIp = function(req) {
  var ip = req.headers['x-forwarded-for']
    || req.connection.remoteAddress
    || req.socket.remoteAddress;

  if (ip.match(/\d+\.\d+\.\d+\.\d+/)) {
    ip = ip.match(/\d+\.\d+\.\d+\.\d+/)[0];
  }
  else {
    ip = '0.0.0.0';
  }

  return ip;
}
/**
 * 对Date的扩展，将 Date 转化为指定格式的String * 月(M)、日(d)、12小时(h)、24小时(H)、分(m)、秒(s)、周(E)、季度(q)
 可以用 1-2 个占位符 * 年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字) * eg: * (new
 Date()).pattern("yyyy-MM-dd hh:mm:ss.S")==> 2006-07-02 08:09:04.423
 * (new Date()).pattern("yyyy-MM-dd E HH:mm:ss") ==> 2009-03-10 二 20:09:04
 * (new Date()).pattern("yyyy-MM-dd EE hh:mm:ss") ==> 2009-03-10 周二 08:09:04
 * (new Date()).pattern("yyyy-MM-dd EEE hh:mm:ss") ==> 2009-03-10 星期二 08:09:04
 * (new Date()).pattern("yyyy-M-d h:m:s.S") ==> 2006-7-2 8:9:4.18
 */
_.dateFormat = function(fmt,d) {
  var date = new Date(d);
  var o = {
    "M+" : date.getMonth()+1, //月份
    "d+" : date.getDate(), //日
    "h+" : date.getHours()%12 == 0 ? 12 : date.getHours()%12, //小时
    "H+" : date.getHours(), //小时
    "m+" : date.getMinutes(), //分
    "s+" : date.getSeconds(), //秒
    "q+" : Math.floor((date.getMonth()+3)/3), //季度
    "S" : date.getMilliseconds() //毫秒
  };
  var week = {
    "0" : "/u65e5",
    "1" : "/u4e00",
    "2" : "/u4e8c",
    "3" : "/u4e09",
    "4" : "/u56db",
    "5" : "/u4e94",
    "6" : "/u516d"
  };
  if(/(y+)/.test(fmt)){
    fmt=fmt.replace(RegExp.$1, (date.getFullYear()+"").substr(4 - RegExp.$1.length));
  }
  if(/(E+)/.test(fmt)){
    fmt=fmt.replace(RegExp.$1, ((RegExp.$1.length>1) ? (RegExp.$1.length>2 ? "/u661f/u671f" : "/u5468") : "")+week[date.getDay()+""]);
  }
  for(var k in o){
    if(new RegExp("("+ k +")").test(fmt)){
      fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));
    }
  }
  return fmt;
};

_.render = function(file, data) {
  return {
    type: constant.RENDER,
    file: file,
    data: data || {}
  };
};

_.JSON = function (data) {
  return {
    type: constant.JSON,
    data: data
  }
};

