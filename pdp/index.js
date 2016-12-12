var Policy = require('../ulocks/Policy');
var Context = require('../ulocks/Context');

function checkRead(subjectInfo, subjectPolicy, objectInfo, objectPolicy) {
    try {
        if(!(subjectPolicy instanceof Policy))
            subjectPolicy = new Policy(subjectPolicy);

        if(!(objectPolicy instanceof Policy))
            objectPolicy = new Policy(objectPolicy);
    }
    catch(e) {
        return Promise.reject(e);
    }
    
    return new Promise(function (resolve, reject) {
        var context = new Context(subjectInfo, objectInfo);
        resolve(objectPolicy.checkRead(subjectPolicy, context));
    });
}

function checkWrite(subjectInfo, subjectPolicy, objectInfo, objectPolicy) {
    try {
        if(!(subjectPolicy instanceof Policy))
            subjectPolicy = new Policy(subjectPolicy);

        if(!(objectPolicy instanceof Policy))
            objectPolicy = new Policy(objectPolicy);
    }
    catch(e) {
        return Promise.reject(e);
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
