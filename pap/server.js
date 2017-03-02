var express = require('express');

function Server(settings) {
    this.settings = settings;
    this.useCluster = false;
    this.cluster = null;
    this.server = null;

    this.app = null;
};

Server.prototype.init = function() {
    this.app = express();

    if(this.settings && this.settings.cluster && this.settings.cluster > 1) {
        this.cluster = require('cluster');
        this.useCluster = true;
    }

    if (this.useCluster && this.cluster.isMaster) {
        // Count the machine's CPUs
        var cpuCount = require('os').cpus().length;
        if(this.settings.cluster < cpuCount)
            cpuCount = this.settings.cluster;

        // Create a worker for each CPU
        for (var i = 0; i < cpuCount; i += 1) {
            this.cluster.fork();
        }
    } else {
        var self = this;
        this.server = this.app.listen(
            this.settings.port,
            this.settings.host,
            function () {
                process.tite = "UPFront PAP";
                console.log('UPFront PAP now running at '+getListenPath(self.settings));
            }
        );
    }

    return Promise.resolve(this.cluster.isMaster);
};

function getListenPath(settings) {
    var listenPath = 'http' + (settings.tls ? 's' : '') + '://'+
        (settings.host == '0.0.0.0' ? '127.0.0.1' : settings.host)+
        ':'+settings.port + "/";
    return listenPath;
};


module.exports = Server;
