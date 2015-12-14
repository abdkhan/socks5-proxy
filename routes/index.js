var express = require('express');
var router = express.Router();
var hosts = require('../config.json');
var https = require('https');
var fs = require('fs');
var socks = require('socksv5');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

for (var i = 0;i < hosts.length;i ++){
  var host = hosts[i]
  router.get(hosts[i].key,function(req,res,next){
    var socksConfig = {
      proxyHost:host.proxy_host,
      proxyPort:host.proxy_port,
      auths:[socks.auth.None()]
    }
    var options = {
      hostname:host.server_host,
      port:host.server_port,
      method:host.method||'GET',
      rejectUnauthorized: false, 
      key:fs.readFileSync(host.key_pem),
      cert:fs.readFileSync(host.cert_pem),
      agent:new socks.HttpsAgent(socksConfig)
    };

    console.log(options)

    https.request(options,function(response){
        res.send(response.data)
    })
  })
}


module.exports = router;
