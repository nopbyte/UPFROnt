var settings = require("../settings");
var pap = require("../../pap/");

pap.init(settings).then(function() {
    console.log("done");
    pap.get(2).then(function(p) {
        console.log("p for 2: ", p);
    }, function(e) {
        console.log(e);
    });
}, function(e) {
    console.log(e);
});
