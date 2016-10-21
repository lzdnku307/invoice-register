/**
 * Created by lizude on 16/9/21.
 */
'use strict';

// 引用
var util = require('util');
var Base = require('./base');

// 用户
var Model = function() {
  this.orm = require('../schemas/user');
};
util.inherits(Model, Base);
let that = module.exports = new Model();

/*
 * 创建用户
 * @params   data    {object}    用户对象(name, password)
 * @params   t         {object}    事务
 * @return   {object}
 */
Model.prototype.save = function* (data, t) {
  let values = _.getFields(data, ['name', 'password', 'type']);
  values.createdAt =  _.dateFormat('yyyy-MM-dd HH:mm:ss', new Date());

  let options = {
    raw: true,
    transaction: t || undefined
  };

  let ret = yield that.orm.create(values, options);
  return ret;

};


/*
 * 更新用户信息
 * @params   data    {object}    要更新的数据对象
 * @params   where   {object}    更新的条件
 * @params   t       {object}    事务
 * @return   {int}   受影响行数
 */
Model.prototype.update = function*(where, data, t) {
  let values = _.getFields(data, ['name', 'password', 'type']);

  let options = {
    where: where,
    transaction: t || undefined
  };
  if (t) {
    options.transaction = t;
  }
  let ret = yield that.orm.update(values, options);

  return ret[0];
};