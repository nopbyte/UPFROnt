// TODO: Check promises!!!
var w = require('winston');
w.level = process.env.LOG_LEVEL;

var Promise = require('bluebird');

var ULocks = require('ULocks');
var Policy = require('ULocks').Policy;
var Context = require('ULocks').Context;

var pap = null;

function init(settings, PAP) {
    pap = PAP;
    return ULocks.init(settings.ulocks);
}

function finish() {
    return Promise.resolve();
}

function valid(o) {
    return ((o !== undefined) && (o !== null));
}

function checkArgs(subject, subjectPolicy, object, objectPolicy, method) {
    var args = {
        withPo: true,
        subject: subject,
        subjectPolicy: subjectPolicy,
        object: object,
        objectPolicy: objectPolicy,
        property: ""
    };
    
    if(object === undefined && objectPolicy === undefined) {
        args.withPo = false;
        args.object = args.subjectPolicy;
    } else if(object && objectPolicy === undefined) {
        args.withPo = false;
        args.object = args.subjectPolicy;
        args.property = object;
    } else if(objectPolicy === undefined || subjectPolicy === undefined)
        return Promise.reject("ERROR: PDP.api."+method+": Subject policy and/or object policy are invalid");
    
    if(!args.subject || args.subject.id === undefined)
        return Promise.reject("ERROR: PDP.api."+method+": Subject does not specify identifier!");
    if(!args.object || args.object.id === undefined)
        return Promise.reject("ERROR: PDP.api."+method+": Object does not specify identifier!");

    return Promise.resolve(args);
};

function checkRead(subject, subjectPolicy, object, objectPolicy) {
    w.debug("PDP.api.checkRead");
    return new Promise(function(resolve, reject) {
        if(pap === null)
            reject("ERROR: PDP.api.checkRead: PAP is not available. Init PDP before using it.");
        else {
            checkArgs(subject, subjectPolicy, object, objectPolicy, "checkRead").then(function(args) {
                if(!args.withPo)
                    checkReadWoPo(args.subject, args.object, args.property).then(function(r) {
                        resolve(r);
                    }, function(e) {
                        reject(e);
                    });
                else
                    checkReadWithPo(args.subject, args.subjectPolicy, args.object, args.objectPolicy).then(function(r) {
                        resolve(r);
                    }, function(e) {
                        reject(e);
                    });
            }, function(e) {
                reject(e);
            });
        }
    });
};

function checkWrite(subject, subjectPolicy, object, objectPolicy) {
    if(pap === null)
        return Promise.reject("ERROR: PDP.api.checkWrite: PAP is not available. Init PDP before using it.");
    else {
        return new Promise(function(resolve, reject) {
            checkArgs(subject, subjectPolicy, object, objectPolicy, "checkWrite").then(function(args) {
                if(!args.withPo) {
                    checkWriteWoPo(args.subject, args.object, args.property).then(resolve);
                }
                else {
                    checkWriteWithPo(args.subject, args.subjectPolicy, args.object, args.objectPolicy).then(resolve);
                }
            }, function(e) {
                reject(e);
            });
        });
    }
};

function checkReadWoPo(subject, object, property) {
    console.log("PDP: checkReadWoPo("+JSON.stringify(subject)+", "+JSON.stringify(object)+", "+JSON.stringify(property)+")");
    return new Promise(function(resolve, reject) {
        // fetch policyobjects for subject and object
        pap.get(subject.id).then(function(sp) {
            pap.get(object.id, property).then(function(op) {
                if(sp && op) {
                    checkReadWithPo(subject, sp, object, op).then(function(r) {
                        resolve(r);
                    }, function(e) {
                        reject(e);
                    });
                } else {
                    resolve(false);
                }
            }, function(e) {
                reject("ERROR: PDP.api.checkRead: Unable to retrieve policy for object entity");
            })
        }, function(e) {
            reject("ERROR: PDP.api.checkRead: Unable to retrieve policy for subject entity: "+e);
        });
    });
};

function checkWriteWoPo(subject, object, property) {
    console.log("PDP: checkWriteWoPo("+JSON.stringify(subject)+", "+JSON.stringify(object)+", "+JSON.stringify(property)+")");
    return new Promise(function(resolve, reject) {
        // fetch policyobjects for subject and object
        pap.get(subject.id).then(function(sp) {
            pap.get(object.id, property).then(function(op) {
                if(sp && op) {
                    checkWriteWithPo(subject, sp, object, op).then(function(r) {
                        resolve(r);
                    }, function(e) {
                        reject(e);
                    });
                } else {
                    resolve(false);
                }
            }, function(e) {
                reject("ERROR: PDP.api.checkRead: Unable to retrieve policy for object entity");
            })
        }, function(e) {
            reject("ERROR: PDP.api.checkRead: Unable to retrieve policy for subject entity: "+e);
        });
    });
};

function checkReadWithPo(subject, subjectPolicy, object, objectPolicy) {
    try {
        if(!(subjectPolicy instanceof Policy))
            subjectPolicy = new Policy(subjectPolicy);

        if(!(objectPolicy instanceof Policy))
            objectPolicy = new Policy(objectPolicy);
    }
    catch(e) {
        return Promise.reject(e);
    }

    // TODO: check whether this type exists in Entity
    if(!valid(subject) || !valid(subject.type))
        return Promise.reject(new Error("PDP ERROR: Subject must specify a valid Entity type."));
    
    if(!valid(object) || !valid(object.type))
        return Promise.reject(new Error("PDP ERROR: Object must specify a valid Entity type."));
    
    var subjectInfo = {
        type : subject.type,
        data : subject
    }

    var objectInfo = {
        type : object.type,
        data : object
    }
    
    var context = new Context(subjectInfo, objectInfo);

    return objectPolicy.checkRead(subjectPolicy, context);
}

function checkWriteWithPo(subject, subjectPolicy, object, objectPolicy) {
    try {
        if(!(subjectPolicy instanceof Policy))
            subjectPolicy = new Policy(subjectPolicy);

        if(!(objectPolicy instanceof Policy))
            objectPolicy = new Policy(objectPolicy);
    }
    catch(e) {
        return Promise.reject(e);
    }

    // TODO: check whether this type exists in Entity
    if(!valid(subject) || !valid(subject.type))
        return Promise.reject(new Error("PDP ERROR: Subject must specify a valid Entity type."));
    
    if(!valid(object) || !valid(object.type))
        return Promise.reject(new Error("PDP ERROR: Object must specify a valid Entity type."));
    
    var subjectInfo = {
        type : subject.type,
        data : subject
    }

    var objectInfo = {
        type : object.type,
        data : object
    }
    
    var context = new Context(subjectInfo, objectInfo);
    return objectPolicy.checkWrite(subjectPolicy, context);
}

module.exports = {
    init: init,
    finish: finish,
    checkRead: checkRead,
    checkWrite: checkWrite
}
