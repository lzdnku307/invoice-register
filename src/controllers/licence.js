/**
 * Created by lizude on 16/9/22.
 */
'use strict';
let constant = require('../common/constant');
let config = require('../common/config');
let childProcess = require('child_process');
let fs = require('fs');
let path = require('path');
let xlsx = require('node-xlsx');
let util = require('util');

let Ctrl = function () {
};
let that = new Ctrl();
module.exports = that;

//授权码生成页
Ctrl.prototype.get = function* (req, res) {
  if(!req.session.user) {
    return res.redirect('/');
  }

  return _.render('licence', {
    userInfo: req.session.user,
    selected: 1
  });
};

//授权码历史数据
Ctrl.prototype.history = function* (req, res) {
  if(!req.session.user) {
    return res.redirect('/');
  }

  let totalNumber = yield models.licence.count();

  return _.render('history', {
    pageType: 'history',
    userInfo: req.session.user,
    totalNumber: totalNumber
  });
};

//生成授权码
Ctrl.prototype.generate = function* (req, res) {
  if(!req.session.user) {
    throw new Exception(2001);
  }

  let values = {
    applicant: req.body.applicant || '',
    serviceId: req.body.serviceId || '',
    description: req.body.description || '',
    permissionType: parseInt(req.body.permissionType, 10),
    version: parseInt(req.body.version, 10),
    expired: parseInt(req.body.expired, 10),
    physicalCpu: parseInt(req.body.physicalCpu, 10),
    virtualCpu: parseInt(req.body.virtualCpu, 10),
    concurrentNumber: parseInt(req.body.concurrentNumber, 10),
    virtualMachineNumber: parseInt(req.body.virtualMachineNumber, 10)
  };

  //参数校验
  for(let k in values) {
    if(!values[k]) {
      throw new Exception(2);
    }
  }

  //项目描述不能少于50个字
  if(values.description.length < 50) {
    throw new Exception(2);
  }

  //授权类型
  if(values.permissionType !== constant.TEMPORARY && values.permissionType !== constant.PERMANENT) {
    throw new Exception(2);
  }

  //版本
  if(values.version !== constant.STANDARD && values.version !== constant.ENTERPRISE) {
    throw new Exception(2);
  }

  if(!(values.expired > 0 && values.virtualCpu > 0
    && values.physicalCpu > 0 && values.concurrentNumber > 0 && values.virtualMachineNumber > 0)) {
    throw new Exception(2);
  }

  if(values.permissionType === constant.TEMPORARY && values.expired > 180) {
    throw new Exception(2);
  }

  //组装生成授权码命令
  let cmdString = config.licenceTool + ' genkey -i ' + values.serviceId + ' -d '
    + values.expired + ' -p ' + values.physicalCpu + ' -s ' + (values.version === constant.ENTERPRISE ? 'enp' : 'std')
    + ' -v ' + values.virtualCpu + ' -n ' + values.concurrentNumber + ' -m ' + values.virtualMachineNumber;
  if(values.permissionType === constant.TEMPORARY) {
    cmdString += ' -t';
  }
  //将结果输出到当前目录的result.txt文件中
  let resultFile = path.join(__dirname, 'result.txt');
  let errorFile = path.join(__dirname, 'error.txt');
  cmdString += ' 1>' + resultFile + ' 2>' + errorFile;
  console.log('cmdString:', cmdString);
  let ok = false;
  let licenceCode = '';

  //生成授权码
  try {
    childProcess.execSync(cmdString);

    //解析结果文件
    let content = fs.readFileSync(resultFile, {encoding: 'utf8'});
    let contentArr = content.split('\n');
    licenceCode = contentArr[2] || '';
    if(!licenceCode || licenceCode.indexOf('Licence:') !== 0) {
      throw '未生成授权码或生成授权码格式不对!';
    }
    licenceCode = licenceCode.slice('Licence:'.length);
    if(!licenceCode) {
      throw '生成空的授权码';
    }

    //将信息存数数据库中
    yield models.licence.save(_.assign({}, values, {userId: req.session.user.id, code: licenceCode}));
    ok = true;
  } catch (e) {
    console.log(e);
  }
  finally {
    try {
      fs.unlinkSync(resultFile);
    } catch (e) {

    }
    try {
      fs.unlinkSync(errorFile);
    } catch (e) {

    }
  }

  if(!ok) {
    throw new Exception(2002);
  }

  return _.JSON({licenceCode: licenceCode});
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

  let data = yield models.licence.find({}, options);
  let userIds = data.map(function (item) {
    return item.userId;
  });
  let users = yield models.user.find({
    id: {
      $in: userIds
    }
  });

  let userHash = {};
  users.forEach(function(user) {
    userHash[user.id] = user.name;
  });

  let ret = data.map(function(item) {
    return {
      id: item.id,
      applicant: item.applicant,
      serviceId: item.serviceId,
      code: item.code,
      permissionType: item.permissionType === constant.TEMPORARY ? '临时授权' : '永久授权',
      version: item.version === constant.ENTERPRISE ? '企业版' : '测试版',
      operator: userHash[item.userId],
      date: _.dateFormat('yyyy-MM-dd hh:mm:ss', item.createdAt)
    };
  });

  return _.JSON(ret);
};

Ctrl.prototype.export = function* (req, res) {
  if(!req.session.user) {
    throw new Exception(2001);
  }

  let ret = '';

  let licenceData = yield models.licence.find({}, {
    order: [
      ['created_at', 'desc']
    ]
  });
  let userIds = licenceData.map(function(item) {
    return item.userId;
  });

  let users = yield models.user.find({
    id: {
      $in: userIds
    }
  });

  let userHash = {};
  users.forEach(function(user) {
    userHash[user.id] = user.name;
  });
  let licenceArr = licenceData.map(function (item) {
    return [
      item.applicant,
      item.serviceId,
      item.code,
      item.permissionType === constant.TEMPORARY ? '临时授权' : '永久授权',
      item.version === constant.ENTERPRISE ? '企业版' : '测试版',
      userHash[item.userId],
      item.description,
      item.physicalCpu,
      item.virtualCpu,
      item.virtualMachineNumber,
      item.concurrentNumber,
      item.expired,
      _.dateFormat('yyyy-MM-dd hh:mm:ss', item.createdAt)
    ];
  });

  licenceArr = [['申请人', '服务id', '授权码', '授权类型', '版本', '操作员', '有效时间（天）', '项目描述',
    '物理CPU数量', '虚拟CPU数量', '虚拟主机数量', '并发用户数量']].concat(licenceArr);

  //导出文件名
  let fileName = _.dateFormat('yyyyMMddHHmmss', new Date()) + '.xlsx';
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
    name: '授权历史记录',
    data: licenceArr
  }];

  let buffer = xlsx.build(data);

  res.end(buffer);
};

Ctrl.prototype.detail = function* (req, res) {
  if(!req.session.user) {
    return res.redirect('/');
  }

  let licence = yield models.licence.getById(req.params.licenceId);

  if(!licence) {
    return _.render('error', {msg: '该授权不存在!'});
  }

  return _.render('detail', _.assign({userInfo: req.session.user, pageType: 'history'}, licence));
};