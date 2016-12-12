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
            reject(new Error("PAP does not contain policy for entity '" + id + "'."));
    });
}

// TODO: store last policy valid for each subobject during looking for the property
function getProp(id, property) {
    if(policyDB === null)
        return Promise.reject(new Error("PAP has not been initialized."));

    return new Promise(function (resolve, reject) {
        if(property === undefined || property === null)
            property = false;
        
        if(policyDB.hasOwnProperty(id)) {
            if(!property) {
                if(policyDB[id].self !== null)
                    resolve(policyDB[id].self);
                else
                    reject(new Error("PAP does not specify policy for properties in object '" + id + "'"));
            } else {
                var curObj = policyDB[id];
                var effPolicy = curObj.self;
                var attrNames = property.split(".");
                while(attrNames.length) {
                    var n = attrNames.shift();
                    if(curObj.properties.hasOwnProperty(n)) {
                        curObj = curObj.properties[n];
                        effPolicy = curObj.self;
                    } else {
                        if(effPolicy === null)
                            reject(new Error("PAP does not specify policy for property '" + property + "' of entity '" + id + "'."));
                        else
                            resolve(effPolicy);
                    }
                }

                if(curObj.self === null) {
                    if(effPolicy === null)
                        reject(new Error("PAP does not specify policy for property '" + property + "' of entity '" + id + "'."));
                    else // this case should never happen but we try to also cover implementation errors
                        resolve(effPolicy);
                } else
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

        resolve();
    });
}
                

function delProp(id, property) {
    if(policyDB === null)
        return Promise.reject(new Error("PAP has not been initialized."));

    return new Promise(function (resolve, reject) {
        if(property === undefined || property === null)
            property = false;
        
        if(policyDB.hasOwnProperty(id)) {
            if(!property)
                resolve(policyDB[id].self);
            else {
                var curObj = policyDB[id];
                var attrNames = property.split(".");
                while(attrNames.length) {
                    var n = attrNames.shift();
                    if(curObj.properties.hasOwnProperty(n)) {
                        curObj = curObj.properties[n];
                    } else {
                        reject(new Error("PAP does not specify policy for property '" + property + "' of entity '" + id + "'."));
                    }
                }

                // TODO: Remember last policy and indicate that
                if(curObj.self == null)
                    reject(new Error("PAP does not specify policy for property '" + property + "' of entity '" + id + "'."));
                else
                    resolve(curObj.self);
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
            reject(new Error("Entity '"+id+"' does not exist in PAP."));
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
            resolve();
        } else {
            policyDB[id] = clone(emptyEntry);
            policyDB[id].entity = policy;
            resolve();
        }
    });
}

function delEntity(id) {
    if(policyDB === null)
        return Promise.reject(new Error("PAP has not been initialized."));

    return new Promise(function (resolve, reject) {
        if(policyDB.hasOwnProperty(id)) {
            delete policyDB[id];
            resolve();
        } else {
            reject(new Error("Entity '" + id + "' does not exist in PAP"));
        }
    });
}

module.exports = {
    init         : init,
    getEntity    : getEntity,
    createEntity : createEntity,
    delEntity    : delEntity,
    getProp      : getProp,
    get          : get,
    setProp      : setProp,
    delProp      : delProp
}
