var clone = require('clone');

var Storage = require('./storage');

var api = require('./api');

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
            enabled: true,
            TTL: 600,
            pubsub: {
                type: "redis",
                channel: "policyUpdates"
            }
        }
    }
}

function getServerInit(userSettings, server, Rest) {
    return function() {
        return new Promise(function(resolve, reject) {
            Storage.init(userSettings.storage, userSettings.server.cluster).then(function() {
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
    if(!userSettings)
        userSettings = defaultSettings;
    return new Promise(function(resolve, reject) {
        if(!userSettings.server) {
            Storage.init(userSettings.storage, false).then(function() {
                api.init(userSettings, Storage);
                
                // we are done - PAP is running locally without
                // any REST interface
                resolve();
            }, function(e) {
                reject("ERROR: Unable to communicate to policy store. "+e);
            });
        } else {
            var Server = require('./server');
            var Rest = require('./rest');
            
            server = new Server(userSettings.server);
            server.init(getServerInit(userSettings, server, Rest)).then(function(workers) {
                if(workers) {
                    console.log("PAP Cluster is ready to receive requests.");
                    resolve();
                }
            }, function(e) {
                reject(e);
            });
        }
    });
};

module.exports = {
    init: init,
    get: api.get,
    set: api.set,
    del: api.del,

    getFullRecord: api.getFullRecord,

    get app() { if(server) return server.app; else return null; }
};
