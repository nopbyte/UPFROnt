var MongoClient = require("mongodb").MongoClient;

var dbHandle = null;
var policies = null;

var Promise = require('bluebird');

/**
 * Initializes the database
 *
 * @param settings the settings for the mongodb database.
 */
function init(settings) {
    var dbURL = "mongodb://";
    
    if(settings.user && settings.user.length)
        dbURL += settings.user +":" + settings.password+"@";
    dbURL += settings.host + ":"+settings.port+"/" + settings.dbName;

    return new Promise(function(resolve, reject) {
        try {
            MongoClient.connect(dbURL, function(error, db) {
                if(error) {
                    reject(error);
                } else {
                    dbHandle = db;
                    collection = db.collection(settings.collection, function(error, collection) {
                        if(error) {
                            reject(error);
                        } else {
                            policies = collection;
                            resolve(policies);
                        }
                    });
                }
            });
        } catch(e) {
            reject(e);
        }
    });
};

function finish() {
    return new Promise(function(resolve, reject) {
        dbHandle.close(function(error, result) {
            if(error !== null)
                reject(error);
            else
                resolve(result);
        });
    });
};

function read(id) {
    return new Promise(function(resolve, reject) {
        policies.findOne({_id: id}, { fields: { pO: 1 } }, function(err, policy) {
            if(err) {
                reject(err);
                console.log(err);
            } else {
                if(!policy) 
                    resolve(null);
                else {
                    if(policy.pO)
                        resolve(policy);
                    else
                        reject(new Error("ERROR: Entry for entity '"+id+"' has invalid format."));
                }
            }
        });
    });
};

function create(id, policy) {
    return new Promise(function(resolve, reject) {
        // TODO: check whether timestamp can be left out
        policies.insertOne({ _id: id, pO : policy}, function(err, result) {
            if(err)
                reject(err);
            else {
                if(result.insertedCount != 1)
                    reject(new Error("ERROR: Unable to set policy for entity with id '"+id+"'"));
                else
                    resolve(result.value);
            }
        });
    });
};

function update(id, policy) {
    return new Promise(function(resolve, reject) {
        policies.findAndModify({ _id: id }, [[ "_id", 1 ]], { pO: policy }, { upsert: true, new: true }, function(err, result) {
            if(err) {
                reject(err);
            } else {
                resolve(result.value);
            }
        });
    });
};

function del(id) {
    return new Promise(function(resolve, reject) {
        policies.findOneAndDelete({ _id: id }, function(err, result) {
            if(err) {
                reject(err);
            } else {
                if(result)
                    resolve(result.value);
                else
                    resolve(result);
            }
        });
    });
};

module.exports = {
    init: init,
    finish: finish,

    create: create,
    update: update,
    read: read,
    del: del
};

