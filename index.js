var pdp = require('./pdp');

function init(settings) {
    return new Promise(function(resolve, reject) {
        pdp.init(settings).then(function() {
            resolve();
        }, function(e) {
            reject(e);
        });
    });
}

module.exports = {
    init : init,
    pep : require("./pep"),
    pdp : pdp,
    pap : pdp.pap
}
