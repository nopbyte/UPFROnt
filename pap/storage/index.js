var NodeCache = require('node-cache');
var clone = require('clone');

var Policy = require('ULocks').Policy

var policyCache = null;
var pubSubModule = null;
var dbModule = null;

var emptyEntry = {
    self : null,
    properties : {}
}

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

function get(id, property) {
    if(id === undefined)
        return Promise.reject("ERROR: Storage.get(...): Missing valid identifier to call get.");
    
    if(property === undefined)
        return getEntity(id);
    else
        return getProperty(id, property);
};

function set(id, property, policy) {
    return new Promise(function(resolve, reject) {
        if(id === undefined) {
            reject("ERROR: Storage.set(...): Missing valid identifier to call set.");
            return;
        }
        if(property === undefined && policy === undefined || (typeof(property) === "string" && policy === undefined)) {
            reject("ERROR: Storage.set(...): Missing valid policy to call set.");
            return;
        }
        if(typeof(property) !== "string" && policy !== undefined) {
            reject("ERROR: Storage.set(...): Property in set must be a string.");
            return;
        }
        
        if(property !== undefined && policy === undefined) {
            setEntity(id, property).then(function(p) {
                if(pubSubModule)
                    pubSubModule.publish(id);
                resolve(p);
            }, function(e) {
                reject(e);
            });
        } else {
            setProperty(id, property, policy).then(function(p) {
                if(pubSubModule)
                    pubSubModule.publish(id);
                resolve(p);
            }, function(e) {
                reject(e);
            });
        }
    });
};

function del(id, property) {
    return new Promise(function(resolve, reject) {
        if(id === undefined) {
            reject("ERROR: Storage.del(...): Missing valid identifier to call del.");
            return;
        }

        if(property === undefined) {
            delEntity(id).then(function() {
                if(pubSubModule)
                    pubSubModule.publish(id);
                resolve(p);
            }, function(e) {
                reject(e);
            });
        } else {
            delProperty(id, property).then(function() {
                if(pubSubModule)
                    pubSubModule.publish(id);
                resolve(p);
            }, function(e) {
                reject(e);
            });
        }
    });
};

function getProperty(id, property) {
    return new Promise(function(resolve, reject) {
        if(dbModule === null)
            reject("ERROR: PAP does not know how to lookup policies.");
        else if(id === undefined || property === undefined)
            reject("ERROR: Must specify id and property when calling getProperty");
        else {
            var policyObject = undefined;
            if(policyCache !== null) {
                policyObject = policyCache.get(id);
            }

            if(policyObject === undefined) {
                dbModule.read(id).then(function(pO) {
                    policyCache.set(id, pO);
                    resolve(_getProperty(pO));
                }, function(e) {
                    resolve(e);
                });
            } else {
                resolve(_getProperty(pO));
            }
        }
    });
};

function _getProperty(policyObject, _property) {
    if(policyObject) {
        if(property === "") {
            return policyObject.self;
        } else {
            var curObj = policyObject;
            var property = _property
                .replace(/\[/, ".")
                .replace(/\]./g, ".")
                .replace(/\]$/g, "");
            var attrNames = property.split(".");
            var effPolicy = curObj.self;
            while(attrNames.length) {
                var n = attrNames.shift();
                if(curObj.properties.hasOwnProperty(n)) {
                    curObj = curObj.properties[n];
                    effPolicy = curObj.self;
                } else
                    return effPolicy;
            }
            
            if(curObj.self === null)
                return effPolicy;
            else
                return curObj.self;
        }
    } else
        return null;
};

function setProperty(id, property, policy) {
    return new Promise(function(resolve, reject) {
        if(dbModule === null)
            reject("ERROR: PAP does not know how to lookup policies.");
        else if(id === undefined || property === undefined || policy === undefined)
            reject("ERROR: Must specify id, property and policy when calling setProperty");
        else {
            var policyObject = undefined;
            if(policyCache !== null) {
                policyObject = policyCache.get(id);
            }

            if(policyObject === undefined) {
                dbModule.read(id).then(function(pO) {
                    _setProperty(pO, property, policy).then(function(p) {
                        resolve(p);
                    }, function(e) {
                        reject(e);
                    });
                }, function(e) {
                    // Unable to find policy Object for entity
                    reject(e);
                });
            } else
                _setProperty(id, policyObject, property, policy).then(function(p) {
                    resolve(p);
                }, function(e) {
                    reject(e);
                });
        }
    });
};
    
// TODO be more error friendly: address missing, e.g. property=system[0].key but entity with id does not have this property
function _setProperty(id, pol, property, policy) {        
    if(property === "") {
        pol.self = policy;
    } else {
        var curObj = pol;
        property = property
            .replace(/\[/, ".")
            .replace(/\]./g, ".")
            .replace(/\]$/g, "");
        var attrNames = property.split(".");
        while(attrNames.length) {
            var n = attrNames.shift();
            if(curObj.properties.hasOwnProperty(n)) {
                curObj = curObj.properties[n];
            } else {
                curObj.properties[n] = clone(emptyEntry);
                curObj = curObj.properties[n];
            }
        }
        curObj.self = policy;
    }

    dbModule.update(id, pol).then(function() {
        policyCache.set(id, pol);
        return Promise.resolve(pol);
    }, function(e) {
        // Unable to update policy backend
        return Promise.reject(e);
    });
};

function delProperty(id, property) {
    return new Promise(function(resolve, reject) {
        if(dbModule === null)
            reject("ERROR: PAP does not know how to lookup policies.");
        else if(id === undefined || property === undefined)
            reject("ERROR: Must specify id and property when calling delProperty");
        else {
            var policyObject = undefined;
            if(policyCache !== null) {
                policyObject = policyCache.get(id);
            }

            if(policyObject === undefined) {
                dbModule.read(id).then(function(pO) {
                    _delProperty(pO, property).then(function(p) {
                        resolve(p);
                    }, function(e) {
                        reject(e);
                    });
                }, function(e) {
                    // Unable to find policy Object for entity
                    reject(e);
                });
            } else
                _delProperty(pO, property).then(function(p) {
                    resolve(p);
                }, function(e) {
                    reject(e);
                });
        }                           
    });
};

function _delProperty(pObject, _property) {
    if(property === "") {
        if(curObj.self !== null)
            pObject.self = null;
    } else {
        var curObj = pObject;
        var property = _property
            .replace(/\[/, ".")
            .replace(/\]./g, ".")
            .replace(/\]$/g, "");
        
        var attrNames = property.split(".");
        while(attrNames.length) {
            var n = attrNames.shift();
            if(curObj.properties.hasOwnProperty(n))
                curObj = curObj.properties[n];
            else
                return Promise.resolve(pObject);
        }
    
        if(curObj.self !== null)
            curObj.self = null;
    }

    dbModule.update(id, pObject).then(function() {
        policyCache.set(id, pObject);
        Promise.resolve(pObject);
    }, function(e) {
        // Unable to update policy backend
        Promise.reject(e);
    });
};  

function getEntity(id) {
    return new Promise(function (resolve, reject) {
        if(dbModule === null)
            reject("ERROR: PAP does not know how to lookup policies.");
        else if(id === undefined)
            reject("ERROR: Must specify id when calling getEntity");

        var policyObject = undefined;
        if(policyCache !== null) {
            policyObject = policyCache.get(id);
        }

        if(policyObject === undefined) {
            dbModule.read(id).then(function(pO) {
                policyObject = policyCache.set(id, pO);
                resolve(pO);
            }, function(e) {
                reject(e);
            });
        } else
            resolve(policyObject);
    });
};

function setEntity(id, policy) {
    return new Promise(function (resolve, reject) {
        if(dbModule === null)
            reject("ERROR: PAP does not know how to lookup policies.");
        else if(id === undefined || policy === undefined)
            reject("ERROR: Must specify id, policy when calling setEntity");
        
        var policyObject = undefined;
        if(policyCache !== null)
            policyObject = policyCache.get(id);

        if(policyObject === undefined) {
            dbModule.read(id).then(function(pO) {
                if(pO === null)
                    pO = clone(emptyEntry);
                
                _setEntity(id, pO, policy).then(function(p) {
                    resolve(p);
                }, function(e) {
                    reject(e);
                });
            }, function(e) {
                reject(e);
            });
        } else
            return _setEntity(id, policyObject, policy).then(function(p) {
                resolve(p);
            }, function(e) {
                reject(e);
            });
    });
};

function _setEntity(id, pO, policy) {
    return new Promise(function(resolve, reject) {
        if(false && !(policy instanceof Policy))
            try {
                policy = new Policy(policy);
            } catch(e) {
                reject(e);
                return;
            }
        
        pO.entity = policy;
        
        dbModule.update(id, pO).then(function() {
            policyCache.set(id, pO);
            resolve(pO);
        }, function(e) {
            reject(e);
        });
    });
};

function delEntity(id) {
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
