/**
 * Created by lizude on 16/9/21.
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

Ctrl.prototype.login = function *(req, res) {
  if(req.session.user) {
    if(req.session.user.type === constant.USER_TYPE.ADMIN) {
      return res.redirect('/user/add');
    } else {
      return res.redirect('/invoice/add');
    }
  }

  return _.render('index');
};

//处理用户登录
Ctrl.prototype.handleLogin = function *(req, res) {
  let name = req.body.name;
  let password = req.body.password;

  if (!name || !password) {
    throw new Exception(2);
  }

  let user = yield models.user.get({
    name: name
  });

  if (!user) {
    //用户不存在
    throw  new Exception(1000);
  }

  if (user.password !== _.md5(password)) {
    //密码错误
    throw new Exception(1001);
  }

  req.session.user = user;

  return _.JSON(user);
};

Ctrl.prototype.handleLogout = function* (req, res) {
  req.session.user = '';
  return _.JSON({});
};

Ctrl.prototype.setting = function* (req, res) {
  if(!req.session.user) {
    return res.redirect('/');
  }

  return _.render('setting', {
    selected: 3,
    userInfo: req.session.user
  });
};

Ctrl.prototype.modifyPassword = function* (req, res) {
  let oldPassword = req.body.oldPassword;
  let newPassword = req.body.newPassword;
  let userName = req.body.userName;

  let user = yield models.user.get({
    name: userName,
    password: _.md5(oldPassword)
  });

  if(!user) {
    throw new Exception(3001);
  }

  yield models.user.update({name: userName}, {password: _.md5(newPassword)});

  return _.JSON({});
};

Ctrl.prototype.add = function* (req, res) {
  if(!req.session.user || req.session.user.type !== constant.USER_TYPE.ADMIN) return res.redirect('/');

  return _.render('user_info', {
    selected: 1,
    userInfo: req.session.user,
    info: {}
  });
};

Ctrl.prototype.handleAdd = function* (req, res) {
  if(!req.session || req.session.user.type !== constant.USER_TYPE.ADMIN) throw new Exception(4001);
  let userInfo = {
    name: req.body.name,
    password: _.md5(req.body.password),
    type: req.body.userType
  };

  yield models.user.save(userInfo);

  return _.JSON({});
};

Ctrl.prototype.history = function* (req, res) {
  if(!req.session.user || req.session.user.type !== constant.USER_TYPE.ADMIN) return res.redirect('/');

  let totalNumber = yield models.user.count({type: constant.USER_TYPE.NORMAL});

  return _.render('user_history', {
    selected: 2,
    userInfo: req.session.user,
    totalNumber: totalNumber
  });
};

Ctrl.prototype.historyData = function* (req, res) {
  if(!req.session.user || req.session.user.type !== constant.USER_TYPE.ADMIN) {
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

  let users = yield models.user.find({type: constant.USER_TYPE.NORMAL}, options);

  let userIds = users.map(function(u) {
    return u.id;
  });

  let invoices = yield models.invoice.count({
    userId: {
      $in: userIds
    }
  }, {
    attributes: ['userId'],
    group: ['user_id']
  });

  let ret = users.map(function(item) {
    let i = 0;
    for(; i < invoices.length; i++) {
      if(invoices[i].userId == item.id) break;
    }
    return {
      id: item.id,
      name: item.name,
      count: invoices[i] ? invoices[i].count : 0
    };
  });

  return _.JSON(ret);

};

Ctrl.prototype.export = function* (req, res) {
  if(!req.session.user || req.session.user.type !== constant.USER_TYPE.ADMIN) {
    throw new Exception(2001);
  }

  let userId = req.params.userId;
  let user = yield models.user.getById(userId);
  let invoices = yield models.invoice.find({userId: userId}, {order: [['created_at', 'DESC']]});

  let dataArr = invoices.map(function(item) {
    return [
      item.company,
      item.name,
      item.phone,
      item.quantity,
      item.address,
      item.fullName,
      item.note,
      _.dateFormat('yyyy-MM-dd HH:mm:ss', new Date(item.createdAt))
    ];
  });

  dataArr = [['单位名称', '收件人姓名', '收件人手机', '数量', '详细地址', '汇款人全称', '备注']].concat(dataArr);


  //导出文件名
  let fileName = user.name + '_' + _.dateFormat('yyyyMMddHHmmss', new Date()) + '.xlsx';
  let contentDisposition = '';

  //设置Content-Disposition
  let userAgent = (req.headers['user-agent'] || '').toLowerCase();
  if (userAgent.indexOf('msie') >= 0 || userAgent.indexOf('chrome') >= 0) {
    contentDisposition = 'attachment; filename=' + encodeURIComponent(fileName);
  } else if (userAgent.indexOf('firefox') >= 0) {
    contentDisposition = 'attachment; filename*="utf8\'\'' + encodeURIComponent(fileName) + '"';
  } else {
    /* safari等其他非主流浏览器只能自求多福了 */
    contentDisposition = 'attachment; filename=' + new Buffer(fileName).toString('binary');
  }

  //设置导出头
  res.writeHead(200, {
    'Content-Type': "application/xlsx; charset=utf-8",
    'Content-Disposition': contentDisposition
  });

  //导出excel文件
  let data = [{
    name: '发票数据',
    data: dataArr
  }];

  let buffer = xlsx.build(data);

  res.end(buffer);
};
