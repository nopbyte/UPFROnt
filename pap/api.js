var clone = require('clone');
var Promise = require('bluebird');
var w = require("winston");
w.level = process.env.LOG_LEVEL;

var ulocks = require('ulocks');
var Policy = ulocks.Policy;

var PolicyObject = require("./pObject.js");

var mutex = require("./mutex");

var storage = null;
var locks = {}

function init(settings, _storage) {
    storage = _storage;
    return mutex.init(settings);
}

function stop() {
    return Promise.resolve();
}

function create(id) {
    return set(id);
};

function get(id, property, meta) {
    if(storage === null)
        return Promise.reject(new Error("PAP API has not been initialized before use."));
    if(id === undefined)
        return Promise.reject(new Error("PAP api.get(...): Missing valid identifier to call get."));

    if(property === undefined)
        return getEntity(id, meta);
    else
        return getProperty(id, property, meta);
};

function set(id, property, policy, meta) {    
    if(storage === null)
        return Promise.reject(new Error("PAP API has not been initialized before use."));
    else if(id === undefined)
        return Promise.reject(new Error("PAP api.set(...): Missing valid identifier to call set."));
    else if(property === undefined && policy === undefined || (typeof(property) === "string" && policy === undefined))
        return Promise.reject(new Error("PAP api.set(...): Missing valid policy to call set."));
    else if(typeof(property) !== "string" && policy !== undefined)
        return Promise.reject(new Error("PAP api.set(...): Property in set must be a string."));

    if(property !== undefined && policy === undefined)
        return setEntity(id, property, meta);
    else
        return setProperty(id, property, policy, meta);
};

function del(id, property, meta) {
    if(storage === null)
        return Promise.reject(new Error("PAP API has not been initialized before use."));
    else if(id === undefined)
        return Promise.reject(new Error("Storage.del(...): Missing valid identifier to call del."));
    else {
        if(property === undefined)
            return delEntity(id, meta)
        else
            return delProperty(id, property, meta);
    }
};

// TODO: Check for errors during policy creation
function getProperty(id, property, meta) {
    w.debug("pap.api.getProperty("+id+", '" + property+"')");
    
    return new Promise(function(resolve, reject) {
        storage.get(id).then(function(entry) {
            if(entry) {
                w.info("PAP: Retrieved policy object for id '"+id+"': ", entry);
                var pO = new PolicyObject(entry.pO);
                var propPolicy = pO.getProperty(property, meta);
                w.info("PAP: Retrieved policy for property '"+property+"': ", propPolicy);
                if(propPolicy !== null) {
                    resolve(new Policy(propPolicy));
                } else
                    resolve(null);
            } else
                resolve(null);
        }, function(e) {
            w.debug("PAP.api.getProperty: Entity with id '"+id+"' does not exist.");
            reject(e);
        });
    });
};

function getAllProperties(id) {
    return new Promise(function(resolve, reject) {
        storage.get(id).then(function(entry) {
            if(entry) {
                w.info("PAP: Retrieved policy object for id '"+id+"': ", entry);
                var pO = new PolicyObject(entry.pO);
                var map = pO.getPPMap();
                for(var property in map) {
                    var policy = map[property];
                    if(policy !== null) {
                        var polInstance = new Policy(policy);
                        var actions = polInstance.getActions();
                        map[property] = { flows: polInstance.getSimpleFlows() }
                        if(Object.keys(actions).length > 0)
                            map[property].actions = actions;
                    }
                }
                resolve(map);
            }
        });
    });
};

function setProperty(id, property, policy, meta) {
    return new Promise(function(resolve, reject) {
        mutex.lock(id).then(function() {
            storage.get(id).then(function(entry) {
                if(entry) {
                    var pO = new PolicyObject(entry.pO);
                    pO.setProperty(property, policy, meta);
                    storage.set(id, pO).then(function() {
                        resolve(pO);
                        mutex.unlock(id);
                    }, function(e) {
                        // Unable to update policy backend
                        reject(e);
                        mutex.unlock(id);
                    });
                } else {
                    resolve(null);
                    mutex.unlock(id);
                }
            }, function(e) {
                // Unable to find policy Object for entity
                reject(e);
                mutex.unlock(id);
            });
        });
    });
};

function delProperty(id, property, meta) {
    return new Promise(function(resolve, reject) {
        mutex.lock(id).then(function() {
            storage.get(id).then(function(entry) {
                if(entry) {
                    var pO = new PolicyObject(entry.pO);
                    pO.delProperty(property, meta);
                    storage.set(id, pO).then(function(r) {
                        resolve(r);
                        mutex.unlock(id);
                    }, function(e) {
                        w.error("PAP.api.delProperty is unable to delete property in entity with id '"+id+"'");
                        // Unable to update policy backend
                        reject(e);
                        mutex.unlock(id);
                    });
                } else {
                    resolve(null);
                    mutex.unlock(id);
                }
            });
        });
    });
};

// TODO: check for errors during policy creation
function getEntity(id) {
    return new Promise(function(resolve, reject) {
        storage.get(id).then(function(entry) {
            if(entry) {
                var pO = new PolicyObject(entry.pO);
                var p = pO.getEntity();
                if(p !== null)
                    resolve(new Policy(p));
                else
                    resolve(null);;
            } else
                resolve(null);
        }, function(e) {
            reject(e);
        });
    });
};

// TODO: Entity semantics is somehow screwed ... need specific way to create and destroy an entry
// (in particular destory) a policy entry completely
function setEntity(id, policy) {
    return new Promise(function (resolve, reject) {
        mutex.lock(id).then(function() {
            storage.get(id).then(function(entry) {
                var pO = null;
                if(entry === null) {
                    pO = new PolicyObject();
                } else {
                    if(entry.pO)
                        pO = new PolicyObject(entry.pO);
                    else {
                        pO = new PolicyObject();
                    }
                }

                pO.setEntity(policy);
                storage.set(id, pO).then(function() {
                    resolve(pO);
                    mutex.unlock(id);
                }, function(e) {
                    reject(e);
                    mutex.unlock(id);
                });
            });
        });
    });
};

function delEntity(id) {
    return new Promise(function(resolve, reject) {
        mutex.lock(id).then(function() {
            storage.get(id).then(function(entry) {
                if(entry) {
                    var pO = new PolicyObject(entry.pO);
                    pO.delEntity();
                    storage.set(id, pO).then(function(r) {
                        resolve(r);
                        mutex.unlock(id);
                    }, function(e) {
                        w.error("PAP.api.delProperty is unable to delete property in entity with id '"+id+"'");
                        // Unable to update policy backend
                        reject(e);
                        mutex.unlock(id);
                    });
                } else {
                    resolve(null);
                    mutex.unlock(id);
                }
            }, function(e) {
                reject(e);
                mutex.unlock(id);
            });
        });
    });
};

function remove(id) {
    if(!storage)
        return Promise.reject(new Error("pap.api has not been initialized before use."));
    if(id === undefined)
        return Promise.reject(new Error("pap.api.remove(...): Missing valid identifier to call remove."));
    
    return new Promise(function(resolve, reject) {
        mutex.lock(id).then(function() {
            storage.del(id).then(function(entry) {
                if(entry) {
                    resolve(entry.pO);
                    mutex.unlock(id);
                } else {
                    resolve(null);
                    mutex.unlock(id);
                }
            }, function(e) {
                reject(e);
                mutex.unlock(id);
            });
        });
    });
};

function getRecord(id) {
    if(!storage)
        return Promise.reject("ERROR: PAP API has not been initialized before use.");
    if(id === undefined)
        return Promise.reject("ERROR: PAP api.getFullRecord(...): Missing valid identifier to call getFullRecord.");

    return new Promise(function(resolve, reject) {
        storage.get(id).then(function(entry) {
            if(entry) {
                var pO = new PolicyObject(entry.pO);
                resolve(pO);
            } else
                resolve(null);
        }, function(e) {
            reject(e);
        });
    });
};

module.exports = {
    init: init,
    stop: stop,
    get: get,
    set: set,
    del: del,
    create: create,
    remove: remove,

    getFullRecord: getRecord,
    getRecord: getRecord,

    getAllProperties: getAllProperties
}
