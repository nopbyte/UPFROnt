var Policy = require('../ulocks/Policy');
var Context = require('../ulocks/Context');

function valid(o) {
    return ((o !== undefined) && (o !== null));
}

function checkRead(subject, subjectPolicy, object, objectPolicy) {
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
    
    return new Promise(function (resolve, reject) {
        var context = new Context(subjectInfo, objectInfo);
        resolve(objectPolicy.checkRead(subjectPolicy, context));
    });
}

function checkWrite(subject, subjectPolicy, object, objectPolicy) {
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
    
    return new Promise(function (resolve, reject) {
        var context = new Context(subjectInfo, objectInfo);
        resolve(objectPolicy.checkWrite(subjectPolicy, context));
    });
}

module.exports = {
    checkRead : checkRead,
    checkWrite : checkWrite
}
