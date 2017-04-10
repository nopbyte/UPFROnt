var settings = require("../settings");
var pap = require("../../pap/");

pap.init(settings).then(function() {
    console.log("PAP running");
}, function(e) {
    console.log(e);
});
