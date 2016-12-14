var ULocks = require("./ulocks");

function init(settings) {
    return ULocks.init(settings.ulocks);
}

module.exports = {
    init : init,
    pap : require("./pap"),
    pep : require("./pep"),
    pdp : require("./pdp")
}
