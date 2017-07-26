var bodyParser = require('body-parser');
var express = require('express');
var path = require('path');

var api = require("./api");

var Promise = require("bluebird");

var papApp = require("./pap/app.js");
var pdpApp = require("./pdp/app.js");
var pepApp = require("./pep/app.js");

var morgan = require("morgan");

var server = null;
var workers = null;
var app = null;

function init(settings) {
    var cluster = false;

    return new Promise(function(resolve, reject) {
        if(settings && settings.server && settings.server.cluster && settings.server.cluster > 1)
            cluster = require('cluster');

        if (cluster && cluster.isMaster) {
            console.log("Use a cluster. This is the master");
            
            // Count the machine's CPUs
            var cpuCount = require('os').cpus().length;
            //if(settings.server.cluster < cpuCount)
                cpuCount = settings.server.cluster;
            
            console.log("Launching "+cpuCount+" cluster workers");
            var promises = [];
            workers = [];
            // Create a worker for each CPU
            for (var i = 0; i < cpuCount; i += 1) {
                promises.push(new Promise(function(resolve, reject) {
                    var worker = cluster.fork().on('online', function() {
                        worker.on('message', function(msg) {
                            if(msg.killme) {
                                worker.kill();
                            } else if(msg.msg) {
                                console.log(msg.msg);
                                resolve();
                            } else if(msg.error) {
                                reject(new Error(JSON.stringify(msg.error)));
                                worker.kill();
                            } else {
                                reject(new Error("Unspecified error in worker."));
                            }
                        });
                    });
                    workers.push(worker);
                }));
            }
            
            Promise.all(promises).then(resolve, reject);
        } else {
            api.init(settings).then(function() {
                app = express();
                app.use(bodyParser.json());
                app.use(bodyParser.urlencoded({extended: true}));

                app.use(function(req, res, next) {
                    res.setHeader('Connection', 'close');
                    next();
                });
                
                app.use(morgan('dev'));
                
                if(settings.pap !== undefined) {
                    if(settings.pap.path === undefined)
                        settings.pap.path = "/pap/";
                    app.use(settings.pap.path, papApp.init());
                }
                if(settings.pdp !== undefined) {
                    if(settings.pdp.path === undefined)
                        settings.pdp.path = "/pdp/";
                    app.use(settings.pdp.path, pdpApp.init());
                }
                if(settings.pep !== undefined) {
                    if(settings.pep.path === undefined)
                        settings.pep.path = "/pep/";
                    app.use(settings.pep.path, pepApp.init());
                }
                
                server = app.listen(
                    settings.server.port,
                    settings.server.host,
                    function () {
                        var msg = "UPFront instance ("+process.pid+") is now running at "+getListenPath(settings.server);
                        process.tite = "UPFront Server";
                        if(cluster) 
                            process.send({msg: msg});
                        else {
                            resolve(msg);
                        }
                    });

                server.on("error", function(error) {
                    if(cluster)
                        process.send({error: error});
                    else
                        reject(error);
                });

                process.on("message", function(msg) {
                    if(msg.kill) {
                        console.log(msg.kill + " " + process.pid + " is going down.");
                        api.stop().then(function() {
                            server.close(function() {
                                process.send({killme: "Server is down"});
                            });
                        }, Promise.reject);
                    }
                });
            });
        }
    });
};

// TODO: improve by using connection and close events of sockets
// and destroy all connections at some point, e.g. https://stackoverflow.com/questions/14626636/how-do-i-shutdown-a-node-js-https-server-immediately
function stop() {
    return new Promise(function(resolve, reject) {
        if(server !== null) {
            api.stop().then(function() {
                server.close(function() {
                    resolve();
                });
            }, Promise.reject);
        } else
            if(workers !== null && workers.length > 0) {
                workers.forEach(function(w) {
                    w.send({kill: "Shutdown UPFROnt PAP instance." });
                });
                resolve();
            }
        
    });
};

function getListenPath(settings) {
    var listenPath = 'http' + (settings.tls ? 's' : '') + '://'+
        (settings.host == '0.0.0.0' ? '127.0.0.1' : settings.host)+
        ':'+settings.port + "/";
    
    if(settings.path !== undefined && settings.path !== null) {
        if(settings.path.startsWith("/"))
            listenPath += settings.path.substring(1);
        else
            listenPath += settings.path;
        
        if(!listenPath.endsWith("/"))
            listenPath += "/";
    }
        
    return listenPath;
};

module.exports = {
    init: init,
    stop: stop
};
