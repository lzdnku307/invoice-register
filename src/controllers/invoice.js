/**
 * Created by lizude on 16/10/20.
 */
'use strict';
let constant = require('../common/constant');
let config = require('../common/config');
let fs = require('fs');
let path = require('path');
let xlsx = require('node-xlsx');
let util = require('util');

let Ctrl = function () {
};
let that = new Ctrl();
module.exports = that;

//录入发票界面
Ctrl.prototype.add = function* (req, res) {
  if(!req.session.user || req.session.user.type !== constant.USER_TYPE.NORMAL) {
    return res.redirect('/');
  }

  return _.render('invoice_info', {
    selected: 1,
    userInfo: req.session.user,
    pageType: 'add',
    info: {}
  });
};

//处理发票录入
Ctrl.prototype.handleAdd = function* (req, res) {
  if(!req.session.user || req.session.user.type !== constant.USER_TYPE.NORMAL) {
    throw new Exception(4001);
  }

  let values = {
    userId: req.session.user.id,
    name: req.body.name,
    company: req.body.company,
    quantity: parseInt(req.body.quantity, 10),
    fullName: req.body.fullName,
    address: req.body.address,
    phone: req.body.phone,
    note: req.body.note
  };

  for(let k in values) {
    if(k === 'note') continue;
    if(!values[k]) throw new Exception(2);
  }

  yield models.invoice.save(values);

  return _.JSON({});
};

Ctrl.prototype.history = function* (req, res) {
  if(!req.session.user) return res.redirect('/');

  let count = yield models.invoice.count({userId: req.session.user.id});

  return _.render('invoice_history', {
    userInfo: req.session.user,
    selected: 2,
    totalNumber: count
  });
};

Ctrl.prototype.historyData = function* (req, res) {
  if(!req.session.user) {
    return _.JSON([]);
  }
  let pageSize = parseInt(req.query.pageSize, 10) || 10;
  let pageNumber = parseInt(req.query.pageNumber, 10) || 1;

  let options = {
    limit: pageSize,
    offset: (pageNumber - 1) * pageSize,
    order: [
      ['created_at', 'desc']
    ]
  };

  let data = yield models.invoice.find({userId: req.session.user.id}, options);

  let ret = data.map(function(item) {
    return {
      id: item.id,
      company: item.company,
      name: item.name,
      fullName: item.fullName,
      address: item.address,
      quantity: item.quantity,
      note: item.note,
      phone: item.phone,
      date: _.dateFormat('yyyy-MM-dd hh:mm:ss', item.createdAt)
    };
  });

  return _.JSON(ret);

};

Ctrl.prototype.detail = function* (req, res) {
  if(!req.session.user) return res.redirect('/');

  let invoice = yield models.invoice.getById(req.params.id);

  return _.render('invoice_info', {
    selected: 1,
    pageType: 'detail',
    userInfo: req.session.user,
    info: invoice
  });
};

Ctrl.prototype.modify = function* (req, res) {
  if(!req.session.user) throw new Exception(4001);

  let values = req.body;

  yield models.invoice.update({id: req.params.id}, values);

  return _.JSON({});
};

Ctrl.prototype.delete = function* (req, res) {
  if(!req.session.user) throw new Exception(4001);

  let values = req.body;

  yield models.invoice.delete(req.params.id);

  return _.JSON({});
};