var settings = require("./settings.js");

if(settings.server) {
    require("./index.js").init(settings);
}
