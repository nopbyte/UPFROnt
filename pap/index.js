var clone = require('clone');

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

function init(userSettings) {
    return new Promise(function(resolve, reject) {
        if(!userSettings.server) {
            Storage.init(userSettings.storage, settings.server.cluster).then(function(db) {
                policyDB = db;
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
            server.init().then(function(isMaster) {
                if(isMaster)
                    resolve();
                else {
                    Storage.init(userSettings.storage, settings.server.cluster).then(function(db) {
                        policyDB = db;
                        api.init(userSettings, db);
                        
                        var s = Storage;
                        s.set("3", [
                            { target: { type: "user" } },
                            { source: { type: "user" } } ]).then(function() {
                                s.get(3).then(function(p) {
                                    console.log("p for 5: " + JSON.stringify(p, null, 2));
                                    s.get(3).then(function(p) {
                                        console.log("p for 5: " + JSON.stringify(p, null, 2));
                                    }, function(e) {
                                        console.log("ERROR: ", e);
                                    });
                                }, function(e) {
                                    console.log("ERROR: ", e);
                                });
                            }, function(e) {
                                console.log("ERROR: ", e);
                            });
                        
                        Rest.init(userSettings.server, server.app).then(function() {
                            resolve();
                        }, function() {
                            reject("ERROR: Unable to initialize REST interface");
                        })
                    }, function(e) {
                        reject("ERROR: Unable to communicate to policy store. "+e);
                    });
                }
            }, function(e) {
                reject("ERROR: Unable to start server");
            });
        }
    });
};

init(settings);
