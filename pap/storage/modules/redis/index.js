var redis = require("redis");
var Mutex = require("redislock");
var w = require('winston');

w.level = process.env.LOG_LEVEL;

var Promise = require('bluebird');

var cache = null;
var settings = null;

var pub = null; 
var sub = null;
var redisClient = null;
var locks = {};

// TODO: check what publish and subscribe return if not promissified
// TODO: include redis settings (host, port, ...)

function init(_settings, handle) {
    return new Promise(function(resolve, reject) {
        settings = _settings;

        pub = redis.createClient();
        sub = redis.createClient();
        mutexClient = redis.createClient();
        
        pub.on('error', function(err) {
            w.error("Problem while connecting publisher to redis!");
            pub.end(true);
            reject(err);
        });

        sub.on('error', function(err) {
            w.error("Problem while connecting subscriber to redis!");
            sub.end(true);
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

function lock(id) {
    if(!locks.hasOwnProperty(id)) {
        // locks[id] = Mutex();
        locks[id] = Mutex.createLock(mutexClient, { timeOut: 50000, retries: -1, delay: 50 })
    }
    
    return locks[id].acquire(id).then(function() {
        console.log(process.pid + ": OHOH LOCK '"+id+"'");
        return Promise.resolve(function() { console.log(process.pid + ": OHOH UNLOCK LOCK '"+id+"'"); locks[id].release() } );
    }, function(e) {
        console.log(process.pid + ": OHOH: Unable to get lock for '"+id+"'. Error: "+e+". Try again.");
        return Promise.delay(100).then(function() {
            return lock(id);
        });
        // return Promise.resolve
        // reject();
    });
    
    // return locks[id];
}

function mark(message) {
    pub.publish(settings.channel, JSON.stringify({ id : process.pid, msg: message }));
}

module.exports = {
    init: init,
    mark: mark,
    lock: lock
};
