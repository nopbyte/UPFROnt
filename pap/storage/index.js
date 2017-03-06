var NodeCache = require('node-cache');
var clone = require('clone');

var Policy = require('ULocks').Policy

var policyCache = null;
var pubSubModule = null;
var dbModule = null;

// TODO: Ensure that we get infos from storage module when it updates
// TODO: Cache is not needed if we run in cluster mode and some pub sub module is avaiable

function init(settings, cluster) {
    return new Promise(function(resolve, reject) {
        if(settings.type === "remote") {
            // TODO: connect to another PAP
        } else {
            try {
                dbModule = require("./modules/"+settings.type);
            } catch(e) {
                reject("ERROR: Unable to load database module '"+settings.type+"'. " + e);
                return;
            };
            
            dbModule.init(settings).then(function() {
                if(settings.cache && settings.cache.enabled) {
                    policyCache = new NodeCache({
                        stdTTL: settings.cache.TTL || 600,
                        checkPeriod: (settings.cache.TTL || 600)/2,
                        useClones: true,
                        errorOnMissing: false
                    });

                    if(!settings.cache.pubsub && cluster > 1) {
                        reject("ERROR: PAP is misconfigured. Configuration specifies cache without a pubsub module for cache synchronisation!");
                        return;
                    }

                    if(cluster > 1) {
                        console.log("PAP storage connects to pubsub server");
                        try {
                            pubSubModule = require("./modules/"+settings.cache.pubsub.type);
                        } catch(e) {
                            reject("ERROR: PAP is unable to load pubsub module for cache synching!");
                        }
                        
                        pubSubModule.init(settings.cache.pubsub, function(id) {
                            var p = policyCache.get(id);
                            if(p) {
                                policyCache.del(id);
                                dbModule.read(id).then(function(pO) {
                                    policyCache.set(id, pO);
                                });
                            }
                        }).then(function() {
                            resolve();
                        }, function(e) {
                            reject(e);
                        });
                    } else {
                        resolve();
                    }
                }
            }, function(e) {
                reject(e);
            });
        }                               
    });
};

module.exports = {
    init : init,
    get  : get,
    set  : set,
    del  : del
}

function get(id) {
    return new Promise(function (resolve, reject) {
        if(id === undefined) {
            reject("ERROR: Storage.get(...): Missing valid identifier to call get.");
            return;
        }
        
        if(dbModule === null)
            reject("ERROR: PAP does not know how to lookup policies.");
        else if(id === undefined)
            reject("ERROR: Must specify id when calling getEntity");

        var policyObject = undefined;
        if(policyCache !== null)
            policyObject = policyCache.get(id);

        if(policyObject === undefined) {
            dbModule.read(id).then(function(pO) {
                policyCache.set(id, pO);
                resolve(pO);
            }, function(e) {
                reject(e);
            });
        } else
            resolve(policyObject);
    });
};

function set(id, policyObject) {
    return new Promise(function (resolve, reject) {
        if(id === undefined) {
            reject("ERROR: Storage.set(...): Missing valid identifier to call set.");
            return;
        }
        if(policyObject === undefined) {
            reject("ERROR: Storage.set(...): Missing policyObject to call set.");
            return;
        }
        
        if(dbModule === null)
            reject("ERROR: PAP does not know how to lookup policies.");
        else if(id === undefined)
            reject("ERROR: Must specify id, policy when calling setEntity");
        
        dbModule.update(id, policyObject).then(function() {
            if(policyCache !== null)
                policyCache.set(id, policyObject);

            if(pubSubModule)
                pubSubModule.publish(id);
            
            resolve(policyObject);
        }, function(e) {
            reject(e);
        });
    });
};

function del(id) {
    return new Promise(function (resolve, reject) {
        if(dbModule === null)
            reject("ERROR: PAP does not know how to lookup policies.");
        else if(id === undefined)
            reject("ERROR: Must specify id when calling delEntity");

        var policyObject = undefined;
        if(policyObject === undefined) {
            dbModule.del(id).then(function() {
                if(policyCache !== null)
                    policyObject = policyCache.del(id);
                resolve();
            }, function(e) {
                reject(e);
            });
        }
    });
};
