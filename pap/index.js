var clone = require('clone');

// var Promise = require("bluebird");

var Storage = require('./storage');

var api = require('./api');

var settings = {};

try {
    var settings = require('./settings');
} catch(e) {
    console.log("PAP: Warning! PAP settings were not found or are invalid: " + e);
    console.log("PAP: Uses default settings!");
    settings.server = {
        host: "localhost",
        port: 1234,
        path: "/",
        cluster: 1,
        tls: false
    };
    settings.storage = {
        type: "mongodb",
        host: "localhost",
        port: 27017,
        cache: false
    };
}

function getServerInit(userSettings, server, Rest) {
    return function() {
        return new Promise(function(resolve, reject) {
            Storage.init(userSettings.storage, userSettings.server.cluster).then(function(db) {
                api.init(userSettings, Storage);

                Rest.init(userSettings.server, server.app).then(function() {
                    resolve();
                }, function() {
                    reject("ERROR: Unable to initialize REST interface");
                })
            }, function(e) {
                reject(e);
            });
        });
    };
}

function init(userSettings) {
    return new Promise(function(resolve, reject) {
        if(!userSettings.server) {
            Storage.init(userSettings.storage, userSettings.server.cluster).then(function(db) {
                api.init(userSettings, db);
                
                // we are done - PAP is running locally without
                // any REST interface
                resolve();
            }, function(e) {
                reject("ERROR: Unable to communicate to policy store. "+e);
            });
        } else {
            var Server = require('./server');
            var Rest = require('./rest');
            
            var server = new Server(userSettings.server);
            server.init(getServerInit(userSettings, server, Rest)).then(function(workers) {
                if(workers) {
                    console.log("PAP Cluster is ready to receive requests.");
                }
            }, function(e) {
                console.log(e);
            });
        }
    });
};

function get(id, property) {
    return Storage.get(id, property);
}

function set(id, property) {
    return Storage.set(id,property);
}

function del(id, property) {
    return Storage.del(id, property);
}

module.exports = {
    init: init,
    get: get,
    set: set,
    del: del
};
