var redis = require("redis");

var Promise = require('bluebird');

var cache = null;
var settings = null;

var pub = null; 
var sub = null;

// TODO: check what publish and subscribe return if not promissified

function init(_settings, handle) {
    return new Promise(function(resolve, reject) {
        settings = _settings;
        
        pub = redis.createClient();
        sub = redis.createClient();

        pub.on('error', function(err) {
            reject(err);
        });

        pub.on('ready', function() {          
            if(sub !== null) {
                sub.on("message", function(channel, message) {
                    var json = JSON.parse(message);
                    if(json && json.msg && json.id !== process.pid) {
                        console.log("update from " + json.id);
                        handle(json.msg);
                    }
                });
                
                sub.subscribe(settings.channel);
            }

            resolve();
        });
    });
}

function publish(message) {
    pub.publish(settings.channel, JSON.stringify({ id : process.pid, msg: message }));
}

module.exports = {
    init: init,
    publish: publish
}
