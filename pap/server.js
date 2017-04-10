var bodyParser = require('body-parser');
var express = require('express');
var path = require('path');

function Server(settings) {
    this.settings = settings;
    this.useCluster = false;
    this.cluster = null;
    this.server = null;

    this.app = null;
};

Server.prototype.init = function(initFunction) {
    this.app = express();

    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({extended: true}));

    if(this.settings && this.settings.cluster && this.settings.cluster > 1) {
        this.cluster = require('cluster');
        this.useCluster = true;
    } else
        this.useCluster = false;

    if (this.useCluster && this.cluster.isMaster) {
        // Count the machine's CPUs
        var cpuCount = require('os').cpus().length;
        if(this.settings.cluster < cpuCount)
            cpuCount = this.settings.cluster;

        var self = this;
        var promises = [];
        // Create a worker for each CPU
        for (var i = 0; i < cpuCount; i += 1) {
            promises.push(new Promise(function(resolve, reject) {
                var worker = self.cluster.fork().on('online', function() {
                    worker.on('message', function(msg) {
                        if(msg.msg) {
                            console.log(msg.msg);
                            resolve();
                        } else {
                            reject(new Error(e))
                        };
                    });
                });
            }));
        }

        return Promise.all(promises);
    } else {
        var self = this;
        var f = function(resolve, reject) {
            self.server = self.app.listen(
                self.settings.port,
                self.settings.host,
                function () {
                    initFunction().then(function() {
                        var msg = "UPFront PAP instance ("+process.pid+") is now running at "+getListenPath(self.settings);
                        process.tite = "UPFront PAP";
                        if(self.useCluster) 
                            process.send({msg: msg});
                        else {
                            resolve(msg);
                        }
                    }, function(e) {
                        if(self.useCluster) 
                            process.send({msg: e});
                        else
                            reject(e);
                    })
                }
            );
        };

        if(this.useCluster) {
            f(console.log, console.log);
            return Promise.resolve(false);
        } else
            return new Promise(function(resolve, reject) {
                f(resolve, reject);
            });
    }
};

function getListenPath(settings) {
    var listenPath = 'http' + (settings.tls ? 's' : '') + '://'+
        (settings.host == '0.0.0.0' ? '127.0.0.1' : settings.host)+
        ':'+settings.port + "/";

    if(settings.path.startsWith("/"))
        listenPath += settings.path.substring(1);
    else
        listenPath += settings.path;

    if(!listenPath.endsWith("/"))
        listenPath += "/";

    return listenPath;
};


module.exports = Server;
