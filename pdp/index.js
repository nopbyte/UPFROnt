var api = require('./api');
var pap = require('../pap');

var Promise = require("bluebird");

var initialized = false;

function init(settings, _pap) {
    if(initialized) {
        // console.log(process.pid + ": PDP has already been initialized. Skip");
        return Promise.resolve(this);
    } else {
        // console.log(process.pid + ": Init PDP.");
        initialized = true;
    }

    if(_pap === undefined) {
        // console.log("PDP init WO PAP");
        return pap.init(settings).
            then(api.init.bind(null, settings, pap));
    } else {
        // console.log("PDP init WITH PAP");
        api.init(settings, _pap)
        return Promise.resolve(this);
    }
}

function finish() {
    return new Promise(function(resolve, reject) {
        api.finish().then(function() {
            pap.finish().then(function(r) {
                resolve(r);
            }, function(e) {
                reject(e);
            });
        }, function(e) {
            reject(e);
        });
    });
}

module.exports = {
    init: init,
    finish: finish,
    checkRead: api.checkRead,
    checkWrite: api.checkWrite,
    checkAccess: api.checkAccess,
    pap: pap
}
