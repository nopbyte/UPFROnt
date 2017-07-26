var clone = require('clone');
var express = require('express');
var w = require('winston');
w.level = process.env.LOG_LEVEL;

var Promise = require("bluebird");

var Storage = require('./storage');

var api = require('./api');
var app = require('./app.js');

var initialized = false;

// TODO: Fix this with default settings file
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

function stop() {
    return new Promise(function(resolve, reject) {
        api.stop().then(function() {
            Storage.stop().then(function(r) {
                resolve(r);
            }, function(e) {
                reject(e);
            });
        }, function(e) {
            reject(e);
        });
    });
}

function init(settings) {
    if(initialized) {
        // console.log(process.pid + ": PAP has already been initialized. Skip");
        return Promise.resolve(this);
    } else {
        // console.log(process.pid + ": Init PAP.");
        initialized = true;
    }

    var cluster = 1;
    if(settings && settings.server && settings.server.cluster > 1)
        cluster = settings.server.cluster;

    return new Promise(function(resolve, reject) {
        Storage.init(settings.pap.storage, cluster).then(function(fresh) {
            api.init(settings, Storage).then(function() {
                resolve(this);
            }, function(e) {
                reject(e);
            });
        }, function(e) {
            reject(new Error("Unable to communicate to policy store. "+e));
        });
    });
};

module.exports = {
    init: init,
    stop: stop,
    
    get: api.get,
    set: api.set,
    del: api.del,

    getFullRecord: api.getFullRecord
};
