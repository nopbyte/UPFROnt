var clone = require('clone');

var Policy = require('../ulocks/Policy');

var policyDB = null;

var emptyEntry = {
    self : null,
    properties : {}
}

function init(store) {
    policyDB = store;

    return Promise.resolve();
}

function get(id) {
    if(policyDB === null)
        return Promise.reject(new Error("PAP has not been initialized."));
    
    return new Promise(function (resolve, reject) {
        if(policyDB.hasOwnProperty(id))
            resolve(policyDB[id]);
        else
            reject(new Error("Entity '" + id + "' does not exist in PAP."));
    });
}

function getProp(id, property) {
    if(policyDB === null)
        return Promise.reject(new Error("PAP has not been initialized."));

    return new Promise(function (resolve, reject) {
        if(property === undefined || property === null)
            property = false;
        
        if(policyDB.hasOwnProperty(id)) {
            if(!property) {
                resolve(policyDB[id].self);
            } else {
                var curObj = policyDB[id];
                var effPolicy = curObj.self;
                var attrNames = property.split(".");
                while(attrNames.length) {
                    var n = attrNames.shift();
                    if(curObj.properties.hasOwnProperty(n)) {
                        curObj = curObj.properties[n];
                        effPolicy = curObj.self;
                    } else
                        resolve(effPolicy);
                }

                if(curObj.self === null)
                    resolve(effPolicy);
                else
                    resolve(curObj.self);
            }
        } else
            reject(new Error("Entity '" + id + "' does not exist in PAP."));
    });
}

function setProp(id, property, policy) {
    if(policyDB === null)
        return Promise.reject(new Error("PAP has not been initialized."));

    return new Promise(function (resolve, reject) {
        if(policy === undefined || policy === null) {
            policy = property;
            property = false;
        }

        if(!policyDB.hasOwnProperty(id)) {
            reject(new Error("Entity '"+id+"' does not exist in PAP. Create before specifying policies on its properties"));
        }

        if(!(policy instanceof Policy)) {
            policy = new Policy(policy);
        }
        
        var pol = policyDB[id];
        
        if(!property) {
            pol.self = policy;
        } else {
            var curObj = pol;
            property.replace("[", ".");
            property.replace("]", ".");
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

        resolve(true);
    });
}
                

function delProp(id, property) {
    if(policyDB === null)
        return Promise.reject(new Error("PAP has not been initialized."));

    return new Promise(function (resolve, reject) {
        if(property === undefined || property === null)
            property = false;
        
        if(policyDB.hasOwnProperty(id)) {
            if(!property) {
                if(policyDB[id].self !== null) {
                    policyDB[id].self = null;
                    resolve(true);
                } else
                    resolve(false);
            } else {
                var curObj = policyDB[id];
                var attrNames = property.split(".");
                while(attrNames.length) {
                    var n = attrNames.shift();
                    if(curObj.properties.hasOwnProperty(n))
                        curObj = curObj.properties[n];
                    else
                        resolve(false);
                }

                if(curObj.self !== null) {
                    curObj.self = null;
                    resolve(true);
                }
            }
        } else 
            reject(new Error("Entity '" + id + "' does not exist in PAP."));
    });
}

function getEntity(id) {
    if(policyDB === null)
        return Promise.reject(new Error("PAP has not been initialized."));

    return new Promise(function (resolve, reject) {
        if(policyDB.hasOwnProperty(id))
            resolve(policyDB[id].entity);
        else
            reject(new Error("Entity '" + id + "' does not exist in PAP."));
    });
}

function createEntity(id, policy) {
    if(policyDB === null)
        return Promise.reject(new Error("PAP has not been initialized."));

    return new Promise(function (resolve, reject) {
        if(!(policy instanceof Policy)) {
            policy = new Policy(policy);
        }
        
        if(policyDB.hasOwnProperty(id)) {
            policyDB[id].entity = policy;
        } else {
            policyDB[id] = clone(emptyEntry);
            policyDB[id].entity = policy;
        }

        resolve(true);
    });
}

function delEntity(id) {
    if(policyDB === null)
        return Promise.reject(new Error("PAP has not been initialized."));

    return new Promise(function (resolve, reject) {
        if(policyDB.hasOwnProperty(id)) {
            delete policyDB[id];
            resolve(true);
        } else {
            resolve(false);
        }
    });
}

module.exports = {
    init         : init,
    createEntity : createEntity,
    getEntity    : getEntity,
    delEntity    : delEntity,
    getProp      : getProp,
    get          : get,
    setProp      : setProp,
    delProp      : delProp
}
