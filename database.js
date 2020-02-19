var mysql = require('mysql2');
var url = require("url");
var SocksConnection = require('socksjs');

var remote_options = {
    host: process.env.DB_HOST,
    port: 3306
};

var proxy = url.parse("http://6xuqp3ru13jog2:87ygeo12iqw0m07ax12uox4rbwd@us-east-static-08.quotaguard.com:9293");
console.log(proxy)
var auth = proxy.auth;
var username = auth.split(":")[0]
var pass = auth.split(":")[1]

var sock_options = {
    host: proxy.hostname,
    port: proxy.port,
    user: username,
    pass: pass
}
var sockConn = new SocksConnection(remote_options, sock_options)

var connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    stream: sockConn
  })

connection.execute("SELECT * FROM items", function(err, results, fields) {
    if (err) throw err
    console.log(results)
})