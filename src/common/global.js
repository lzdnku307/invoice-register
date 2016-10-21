/**
 * Created by lizude on 16/9/21.
 */
'use strict';
//引用
let path = require('path');
let fs = require('fs');

// 全局变量
global.constant = require('./constant');
global.config = require('./config');
global._ = require('lodash');
global.co = require('co');
global.thunkify = require('thunkify-wrap');
global.Sequelize = require('sequelize');
require('./func');

//数据库
global.db = require('./db');

// 全局错误
global.errors = require('./errors');
global.Exception = function(code, msg) {
  this.code = code;
  this.msg = msg || errors[code];
  this.stack = new Error(this.code + ': ' + this.msg).stack;
};

// 控制器
global.ctrls = require('./ctrls');
// 模型
global.models = require('./models');

//缓存
global.cache = {};
global.cacheSave = function (key, value, expired) {
  let now = new Date().getTime();
  cache[key] = {
    value: value,
    expired: now + expired
  };

  //检验并移除过期数据
  let expiredKeys = [];
  for(let k in cache) {
    cache[k].expired < now;
    expiredKeys.push(k);
  }
  expiredKeys.map(function (k) {
    delete cache[k];
  });
};

global.cacheRemove = function(k) {
  delete cache[k];
};

global.cacheGet = function(k) {
  return cache[k] || null;
};