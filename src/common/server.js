/**
 * Created by lizude on 16/9/20.
 */
'use strict';

'use strict';

// 引用
require('./global');
let express = require('express');
let router = require('./router');
let ejs = require('ejs');
let path = require('path');
let session = require('express-session');

// express配置
let app = express();

//设置ejs引擎以及页面渲染目录
app.set('views', __dirname + '/../views');
app.set('view engine', 'html');
app.engine('html', ejs.renderFile);

app.use(require('connect-timeout')(config.timeout * 1000, {respond: false}));
app.use(express.static(path.join(__dirname, '../views/static'), {maxAge: 0}));
app.use(require('body-parser').urlencoded({extended: false}));
app.use(require('body-parser').json());
app.use(require('cookie-parser')());

app.set('trust proxy', 1);
app.use(session({
  secret: 'tfsec_licence_server',
  cookie: { maxAge: config.session.expired },
  resave: false,
  saveUninitialized: true
}));

app.use(function(req, res, next) {
  // 超时处理
  req.on('timeout', function () {
    res.send({
      code: 10002,
      msg: errors[10002]
    });
    process.nextTick(function () {
      res.send = res.end = function () {
      };
    });
  });

  next();
});

// 路由
router(app);

// 监听
app.listen(config.port, function(){
  console.log('tfsec licence system server started at:', config.port);
});

// 错误
process.on('uncaughtException', function (err) {
  console.error('Global:');
  console.error(err);
  process.exit(1);
});