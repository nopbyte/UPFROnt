var express = require('express');
var bodyParser = require('body-parser');

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
        this.server = this.app.listen(
            this.settings.port,
            this.settings.host,
            function () {
                initFunction().then(function() {
                    var msg = "UPFront PAP instance ("+process.pid+") is now running at "+getListenPath(self.settings);
                    process.tite = "UPFront PAP";
                    if(self.useCluster) 
                        process.send({msg: msg});
                    else
                        console.log(msg);
                }, function(e) {
                    if(self.useCluster) 
                        process.send({msg: e});
                    else
                        console.log(e);
                })
            }
        );
    }

    return Promise.resolve(false);
};

function getListenPath(settings) {
    var listenPath = 'http' + (settings.tls ? 's' : '') + '://'+
        (settings.host == '0.0.0.0' ? '127.0.0.1' : settings.host)+
        ':'+settings.port + "/";
    return listenPath;
};


module.exports = Server;
