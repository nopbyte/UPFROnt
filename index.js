var pdp = require('./pdp');
var w = require('winston');
w.level = process.env.LOG_SERVER ? process.env.LOG_SERVER : "info";

// TODO: Check for correct settings in pdp etc...
function init(settings) {
    return new Promise(function(resolve, reject) {
        pdp.init(settings).then(function(fresh) {
            if(!fresh)
                w.warn("UPFROnt had already been initialized. Additional initialization has been skipped.");
            else
                w.info("UPFROnt initialized successfully.");

            resolve();
        }, function(e) {
            reject(e);
        });
    });
}

function finish() {
    return new Promise(function(resolve, reject) {
        pdp.finish().then(function() {
            resolve();
        }, function(e) {
            reject(e);
        });
    });
}

module.exports = {
    init: init,
    finish: finish,
    pep: require("./pep"),
    pdp: pdp,
    pap: pdp.pap
}
