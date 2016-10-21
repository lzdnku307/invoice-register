<pre>
项目环境:
nodejs(4.0以上) + npm + mysql
项目部署:
1.创建数据库,并将src/bin目录下的db.sql倒入数据库.
2.安装项目依赖包: npm i
3.配置: cp src/common/config.example.js src/common/config.js  配置config.js中的数据库等信息.
4.同步表结构: node index sync
5.启动服务: node index
</pre>