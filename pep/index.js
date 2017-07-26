/** 
 * Policy Enforcement Point
 * @module pep
 * @author Daniel Schreckling
 */

var pepApp = require("./app");

var pap = require('../pap');
var pdp = require('../pdp');

var api = require('./api');

var initialized = false;

function init(settings, _pdp) {
    if(initialized) {
        // console.log(process.pid + ": PEP has already been initialized. Skip");
        return Promise.resolve(this);
    } else {
        // console.log(process.pid + ": Init PEP.");
        initialized = true;
    }
    
    if(_pdp === undefined) {
        console.log("INIT PEP WO PDP");
        return pap.init(settings)
            .then(pdp.init.bind(null, settings))
            .then(pep.init.bind(null, settings))
            .then(function() {
                api.init(settings);
                pepApp.init();
                return this;
        });
    } else {
        // console.log("INIT PEP WITH PDP");
        pepApp.init();
        api.init(settings);
        return Promise.resolve(this);
    }
};

module.exports = {
    init: init,

    declassify: api.declassify
};
