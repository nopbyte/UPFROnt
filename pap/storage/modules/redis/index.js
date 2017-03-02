var redis = require("redis");

var cache = null;
var settings = null;

var pub = redis.createClient();
var sub = redis.createClient();

function init(_settings, handle) {
    settings = _settings;
    
    sub.on("message", function(channel, message) {
        var json = JSON.parse(message);
        if(json && json.msg && json.id !== process.pid) {
            console.log("update from " + json.id);
            handle(json.msg);
        }
    });

    sub.subscribe(settings.channel);

    return Promise.resolve();
}

function publish(message) {
    pub.publish(settings.channel, JSON.stringify({ id : process.pid, msg: message }));
}

module.exports = {
    init: init,
    publish: publish
}
