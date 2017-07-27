var Promise = require('bluebird');

var mutexes = {}

var createMutex = null;
var lockMutex = null;
var releaseMutex = null;

function init(settings) {
    return new Promise(function(resolve, reject) {
        try {
            if(settings.server && settings.server.cluster > 1) {
                if(settings.server.sync) {
                    // replace regular promises to allow for Promise.delay
                    var redis = require("redis");
                    var Mutex = require("redislock");
                    var redisClient = redis.createClient();
                    
                    redisClient.on('ready', function() {
                        createMutex = function() {
                            return Mutex.createLock(
                                redisClient,
                                { timeOut: 50000, retries: -1, delay: 25 }
                            );
                        };
                        
                        lockMutex = function(mutex, id) {
                            return mutex.acquire(id).then(function() {
                                return Promise.resolve();
                            }, function(e) {
                                return Promise.delay(100).then(function() {
                                    return lockMutex(mutex, id);
                                });
                            });
                        };
                        
                        releaseMutex = function(mutex, id) {
                            mutex.release();
                        };
                        
                        resolve();
                    });
                    
                    redisClient.on('error', function(err) {
                        redisClient.end(true);
                        reject(err);
                    });
                } else
                    return Promise.reject(new Error("Missing specification for synchronisation module in server specification."));
            } else {
                var Locks = require('locks');
                createMutex = function () { return Locks.createMutex(); };
                lockMutex = function(mutex) {
                    return new Promise(function(resolve, reject) {
                        mutex.lock(resolve);
                    });               
                };
                releaseMutex = function(mutex) {
                    mutex.unlock()
                };
                
                resolve();
            }
        } catch(e) {
            throw new Error("Unable to load and init synchronisation module. "+e);
        }
    });
}

function lock(id) {
    if(!mutexes.hasOwnProperty(id))
        mutexes[id] = createMutex();
    
    return lockMutex(mutexes[id], id);
}

function unlock(id) {
    if(!mutexes.hasOwnProperty(id))
        throw new Error("Cannot unlock unknown mutex");

    releaseMutex(mutexes[id], id);
}

module.exports = {
    init: init,
    lock: lock,
    unlock: unlock
};
