var storage = null;

function init(settings, _storage) {
    storage = _storage;
}

Promise = require('bluebird');

module.exports = {
    init: init,
    get: get,
    set: set,
    del: del
}

function get(id, property) {
    if(!storage)
        return Promise.reject("ERROR: PAP API has not been initialized before use.");
    if(id === undefined)
        return Promise.reject("ERROR: PAP api.get(...): Missing valid identifier to call get.");

    if(property === undefined)
        return getEntity(id);
    else
        return getProperty(id, property);
};

function set(id, property, policy) {
    if(storage === null)
        return Promise.reject("ERROR: PAP API has not been initialized before use.");
    else if(id === undefined)
        return Promise.reject("ERROR: PAP api.set(...): Missing valid identifier to call set.");
    else if(property === undefined && policy === undefined || (typeof(property) === "string" && policy === undefined))
        return Promise.reject("ERROR: PAP api.set(...): Missing valid policy to call set.");
    else if(typeof(property) !== "string" && policy !== undefined)
        return Promise.reject("ERROR: PAP api.set(...): Property in set must be a string.");
        
    if(property !== undefined && policy === undefined)
        return setEntity(id, property);
    else
        return setProperty(id, property, policy);
};

function del(id, property) {
    if(storage === null)
        return Promise.reject("ERROR: PAP API has not been initialized before use.");
    else if(id === undefined)
        return Promise.reject("ERROR: Storage.del(...): Missing valid identifier to call del.");
    else {
        if(property === undefined)
            return delEntity(id)
        else
            return delProperty(id, property);
    }
};

function getProperty(id, property) {
    return new Promise(function(resolve, reject) {
        storage.get(id).then(function(pO) {
            resolve(_getProperty(pO, property));
        }, function(e) {
            reject(e);
        });
    });
};

function _getProperty(policyObject, _property) {
    if(policyObject) {
        if(_property === "") {
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
        storage.get(id).then(function(pO) {
            var p = _setProperty(pO, property, policy);
            storage.set(id, p).then(function() {
                resolve(p);
            }, function(e) {
                // Unable to update policy backend
                reject(e);
            });
        }, function(e) {
            // Unable to find policy Object for entity
            reject(e);
        });
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

    return pol;
};

function delProperty(id, property) {
    return new Promise(function(resolve, reject) {
        dbModule.get(id).then(function(pO) {
            if(pO) {
                var p = _delProperty(pO, property);
                storage.set(id, pObject).then(function() {
                    resolve(p);
                }, function(e) {
                    // Unable to update policy backend
                    reject(e);
                });
            } else {
                resolve(pO);
            }
        });
    });
};

function _delProperty(pObject, _property) {
    if(_property === "") {
        if(pObject.self !== null)
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
                return pObject;
        }
    
        if(curObj.self !== null)
            curObj.self = null;
    }
    
    return pObject;
};  

function getEntity(id) {
    return storage.get(id);
};

function setEntity(id, policy) {
    return new Promise(function (resolve, reject) {
        storage.get(id).then(function(pO) {
            if(pO === null)
                pO = clone(emptyEntry);
                
            _setEntity(id, pO, policy).then(function(p) {
                storage.set(id, p).then(function() {
                    resolve(p);
                }, function(e) {
                    reject(e);
                });
            }, function(e) {
                reject(e);
            });
        });
    });
};

// TODO: update with change of ulock system
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

        resolve(pO);
    });
};

function delEntity(id) {
    return storage.del(id);
};
