var clone = require('clone');
var express = require('express');
var w = require('winston');
w.level = process.env.LOG_LEVEL;

var Storage = require('./storage');

var api = require('./api');
var app = require('./app.js');

var settings = {};
var server = null;

var defaultSettings = {
    storage: {
        type: "mongodb",
        host: "localhost",
        port: 27017,
        password: "",
        user: "",
        dbName: "pap-database",
        collection: "policies",

        // specifies whether the module should check
        // the cache to fetch a policy, of course,
        // this may induce additional lookups but on
        // average using the cache is recommended
        cache: {
            enabled: false,
            TTL: 600,
            pubsub: {
                type: "redis",
                channel: "policyUpdates"
            }
        }
    }
}

function getServerInit(userSettings, server) {
    return function() {
        return new Promise(function(resolve, reject) {
            Storage.init(userSettings.storage, userSettings.server.cluster).then(function(fresh) {
                api.init(userSettings, Storage);
                resolve(fresh);
            }, function(e) {
                w.error("Unable to initialize storage module");
                reject(e);
            });
        });
    };
}

function finish() {
    return new Promise(function(resolve, reject) {
        api.finish().then(function() {
            Storage.finish().then(function(r) {
                if(server !== null)
                    server.finish().then(function(r) {
                        resolve(r);
                    }, function(e) {
                        reject(e);
                    })
                else
                    resolve(r);
            }, function(e) {
                reject(e);
            });
        }, function(e) {
            reject(e);
        });
    });
}

function init(userSettings) {
    if(!userSettings)
        userSettings = defaultSettings;
    return new Promise(function(resolve, reject) {
        if(!userSettings.server) {
            Storage.init(userSettings.storage, false).then(function(fresh) {
                api.init(userSettings, Storage);
                resolve(fresh);
            }, function(e) {
                reject(new Error("Unable to communicate to policy store. "+e));
            });
        } else {
            var Server = require('./server');
            
            server = new Server(userSettings.server);
            server.init(getServerInit(userSettings, server)).then(function(workers) {
                if(workers) {
                    w.info("PAP Cluster is ready to receive requests.");
                    resolve();
                }
            }, function(e) {
                reject(e);
            });
        }
    });
};

// TODO: disable get, set, del if PAP runs as server

module.exports = {
    init: init,
    finish: finish,
    get: api.get,
    set: api.set,
    del: api.del,

    getFullRecord: api.getFullRecord,

    get app() { if(server) return server.app; else return app.init(); }
};
