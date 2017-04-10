var PDP = require('../../pdp');
var PAP = require('../../pap');

var settings = require('./settings');

var Promise = require('bluebird');

PDP.init(settings).then(function() {
    PDP.checkRead({ id: "3"}, { id: "3" }).then(function(result) {
        console.log("result: ", result);
    }, function(e) {
        console.log("Error: "+e);
    });
}, function(e) {
    console.log("ERROR: Unable to init PDP.", e);
});
