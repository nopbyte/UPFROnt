var NodeCache = require('node-cache');
var clone = require('clone');
var Promise = require('bluebird');
var w = require('winston');
w.level = process.env.LOG_PAP;

var policyCache = null;
var syncModule = require("./modules/nosync");;
var dbModule = null;

// TODO: Ensure that we get infos from storage module when it updates
// TODO: Cache is not needed if we run in cluster mode and some pub sub module is avaiable

function init(settings, cluster) {
    return new Promise(function(resolve, reject) {
        if(dbModule !== null) {
            w.warn("PAP storage module has already been initialized before. Skip this initialization");
            resolve(false);
            return;
        }

        if(!settings)
            reject(new Error("PAP: Missing or invalid settings file."));

        if(!settings.type)
            reject(new Error("PAP: Missing 'type' in PAP storage settings."));
        else
            if(settings.type === "remote") {
                // TODO: connect to another PAP
                reject(new Error("Remote storage type has not been implemented yet!"));
            } else {
                try {
                    if(settings.type ==="external" && settings.module_name){
                       dbModule = require(settings.module_name);
                    }
                    else{
                      dbModule = require("./modules/"+settings.type);
                    }
                } catch(e) {
                    w.error("Unable to load database module '"+settings.type+"'. " + e);
                    reject("Unable to load database module '"+settings.type+"'. " + e);
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

                        if(!settings.cache.sync && cluster > 1) {
                            reject("ERROR: PAP is misconfigured. Configuration specifies cache without a sync module for cache synchronisation!");
                            return;
                        }

                        if(cluster > 1) {
                            w.info("PAP storage connects to synchronisation server");
                            try {
                                // TODO: change such that it can also be loaded from an arbitrary directory
                                syncModule = require("./modules/"+settings.cache.sync.type);
                            } catch(e) {
                                reject(new Error("PAP is unable to load synchronization module for cache synching in cluster!"));
                                w.error("PAP is unable to load synchronization module for cache synching in cluster!");
                                return;
                            }

                            syncModule.init(settings.cache.sync, function(id) {
                                var p = policyCache.get(id);
                                if(p) {
                                    policyCache.del(id);
                                    dbModule.read(id).then(function(pO) {
                                        policyCache.set(id, pO);
                                    });
                                }
                            }).then(function() {
                                w.info("Storage successfully started synchronization module.");
                                resolve(true);
                            }, function(e) {
                                w.error("Storage module is unable to instantiate synchronization module.");
                                reject(e);
                            });
                        } else {
                            resolve(true);
                        }
                    } else {
                        resolve(true);
                    }
                }, function(e) {
                    reject(e);
                });
            }
    });
};

function finish() {
    if(dbModule === null)
        return Promise.reject(new ERROR("Cannot close connection of storage module which has not been initialized."));
    
    return dbModule.finish();
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
                if(policyCache !== null)
                    policyCache.set(id, pO);
                w.log('debug', "Cache miss! Retrieved object '"+id+"' from db.");
                resolve(pO);
            }, function(e) {
                reject(e);
            });
        } else {
            w.log('debug', "Retrieved object '"+id+"' from cache.");
            resolve(policyObject);
        }
    });
};

// TODO: requries some locking here in sync medium
function set(id, policyObject, uid) {
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

        syncModule.lock(id).then(function(unlock) {
            dbModule.update(id, policyObject, uid).then(function(r) {
                if(policyCache !== null)
                    policyCache.set(id, r);
                
                if(syncModule)
                    syncModule.mark(id);

                resolve(r.pO);
                unlock();
            }, function(e) {
                reject(e);
                unlock();
            });
        });
    });
};

/** returns the deleted object or null if the object did not exist in the database before deletion */
// TODO: requries some locking here in sync medium
function del(id) {
    return new Promise(function (resolve, reject) {
        if(dbModule === null)
            reject("ERROR: PAP does not know how to lookup policies.");
        else if(id === undefined)
            reject("ERROR: Must specify id when calling delEntity");

        syncModule.lock(id).then(function(unlock) {
            dbModule.del(id).then(function(entity) {
                if(policyCache !== null)
                    policyCache.del(id);
                resolve(entity);
                unlock();
            }, function(e) {
                reject(e);
                unlock();
            });
        });
    });
};

module.exports = {
    init : init,
    finish: finish,
    get  : get,
    set  : set,
    del  : del
}
