var url = require('url');
var path = require('path');
var fs = require('fs');
var https = require('https');
var http = require('http');
var socks = require('socksv5')



requester = https.request;

http.createServer(function serverFile(req, res) {
  return proxy(req, res);
}).listen(8080, function() {
  // console.log('proxy /api requests to etcd on ' + etcdHost + ':' + etcdPort);
  // console.log('etc-browser listening on port ' + serverPort);
});


function proxy(client_req, client_res) {
  var config = require('./config.json')
  var url = client_req.url
  var conf = config.mapping[url]

  console.log(conf)
  var opts = {
    hostname: conf.server_host,
    port: conf.server_port,
    path: config.common.path,
    method: conf.method || 'GET'
  };
  opts.key = fs.readFileSync(config.common.key_pem);
  opts.ca = fs.readFileSync(config.common.ca);
  opts.cert = fs.readFileSync(config.common.cert_pem);

  var socksConfig = {
    proxyHost: conf.proxy_host,
    proxyPort: conf.proxy_port,
    auths: [ socks.auth.None() ]
  };
  opts.agent = new socks.HttpsAgent(socksConfig)
  client_req.pipe(requester(opts, function(res) {
    if (res.statusCode === 307) {
        opts.hostname = url.parse(res.headers['location']).hostname;
        client_req.pipe(requester(opts, function(res) {
            console.log('Got response: ' + res.statusCode);
            res.pipe(client_res, {end: true});
        }, {end: true}));
    } else {
        res.pipe(client_res, {end: true});
    }
  }, {end: true}));
}
