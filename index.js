var w = require('winston');
w.level = process.env.LOG_LEVEL;

var api = require('./api');
var server = require('./server');
var runsServer = false;

function init(settings) {
    if(settings.server !== undefined) {
        runsServer = true;
        return server.init(settings);
    } else
        return api.init(settings);
}

function stop() {
    if(runsServer)
        return server.stop().then(function() {
            return Promise.resolve();
        }, function(e) {
            return Promise.reject(e);
        });
    else
        return api.stop();
}

module.exports = {
    init: init,
    stop: stop,
    
    pep: api.pep,
    pdp: api.pdp,
    pap: api.pap
}
