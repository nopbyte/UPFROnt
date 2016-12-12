var pdp = require('../pdp');
var Policy = require('../ulocks/Policy');

// TODO: it should not happen that a less restrictive policy inside a subobject
// reveals the possible confidential structure of the object containing this subobject

function declassify(object, objPolicyRecord, target, targetPolicy, effPolicy) {  
    if(objPolicyRecord === undefined || objPolicyRecord === null)
        return Promise.resolve(new Error("Invalid object policy record during call to PEP declassify"));

    try {
        if(!(targetPolicy instanceof Policy))
            targetPolicy = new Policy(targetPolicy);
    } catch(e) {
        return Promise.reject(e);
    }
        
    
    var objInfo = {
        type : object.type.slice(1),
        data : object
    };

    return declassifyRec(objInfo, object, objPolicyRecord, target, targetPolicy, effPolicy);
};

function declassifyRec(objInfo, object, objectPolicy, target, targetPolicy, effPolicy) {
    return new Promise(function(resolve, reject) {
        var promises = [];
        var filtered = object instanceof Array ? [] : {};
        var curOPol = objectPolicy;

        if(objectPolicy.self !== null || effPolicy === undefined)
            effPolicy = objectPolicy.self;
        
        for(var p in object) {
            if(object.hasOwnProperty(p)) {
                
                if(!curOPol.properties.hasOwnProperty(p) && effPolicy === null)
                    continue;
                    
                if(typeof object[p] === "object") {
                    curOPol = curOPol.properties[p];

                    var createCallback = function(p) {
                        return function(o) {
                            filtered[p] = o;
                            return Promise.resolve();
                        };
                    };
                    
                    promises.push(declassifyRec(objInfo, object[p], curOPol, target, targetPolicy, effPolicy).then(createCallback(p)));
                } else {
                    var filter = false;

                    var createCallback = function(p) {
                        return function(decision) {
                            if(decision.result)
                                filtered[p] = object[p];
                        };
                    };
                    
                    if(!curOPol.properties.hasOwnProperty(p)) {
                        promises.push(pdp.checkRead(target, targetPolicy, objInfo, effPolicy).then(createCallback(p)));
                    } else {
                        promises.push(pdp.checkRead(target, targetPolicy, objInfo, curOPol.properties[p].self).then(createCallback(p)));
                    }
                }
            }
        }

        Promise.all(promises).then(resolve(filtered)).catch(function(reason) { console.log(reason) });
    });
};

module.exports = {
    declassify : declassify
};
