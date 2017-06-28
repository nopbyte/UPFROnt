var api = require('./api');
var pap = require('../pap');

// TODO: Check how to share app with PAP
function init(settings) {
    return new Promise(function(resolve, reject) {
        pap.init(settings.pap).then(function() {
            api.init(settings.pdp, pap).then(function(fresh) {
                resolve(fresh);
            }, function(e) {
                reject(e);
            });
        }, function(e) {
            reject(e);
        });
    });
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
    checkRead : api.checkRead,
    checkWrite : api.checkWrite,
    pap: pap
}
