
// This application uses express as its web server
// for more info, see: http://expressjs.com
var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var mysql = require('mysql');
var querystring = require('querystring');

// cfenv provides access to your Cloud Foundry environment
// for more info, see: https: //www.npmjs.com/package/cfenv
var cfenv = require('cfenv');

// create a new express server
let app = express();
app.set("view engine", "pug");
app.use(express.static(__dirname + '/public'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

//create mysql pool connection
var pool = mysql.createPool({
  connectionLimit: 50,
  host: "localhost",
  user: "root",
  password: "",
  database: "urls"
});


app.get('/', function(req, res){
  res.render('index');
})


app.get('/s', function(req, res){
  var url = req.originalUrl;
  var shortID = url.split("?");
  pool.getConnection(function(err, conn) {
    if (!!err) {
      console.log('connection failed')
      conn.release();
      throw err;
    }
    else{
      conn.query("SELECT url FROM urlshort WHERE short = '" + querystring.escape(shortID[1]) + "'", function (err, result) {
        if (!!err) {
          conn.release();
          throw err;
        }else{
          var longurl = result[0].url;
          if(longurl.includes("http")){
            res.redirect(longurl);
          }
          else{
            res.redirect('http://'+longurl);
          }
        }
      });
    }
    conn.release();
  });
});

app.post('/', function(req, res){
  var url = req.body.url;
  var short = makeid();
  newID = appEnv.url+"/s?"+short;

  var sql = "INSERT INTO urlshort (url, short) VALUES ('" + url + "', '" + short + "')";
  pool.getConnection(function(err, conn) {
    if (err) throw err;
    conn.query(sql, function (err, result) {
      if (err) throw err;
      res.render('index',{
        shortID: false, result: newID
      });
    });
    conn.release();
  });
});

//fuction to create short url
function makeid() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (var i = 0; i < 5; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  return text;
}


var appEnv = cfenv.getAppEnv();
// start server on the specified port and binding host
app.listen(appEnv.port, '0.0.0.0', function() {
  // print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
});
