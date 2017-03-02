var MongoClient = require("mongodb").MongoClient;

var dbHandle = null;
var policies = null;

module.exports = {
    init: init,

    create: create,
    update: update,
    read: read,
    del: del
};

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
    });
};

function read(id) {
    return new Promise(function(resolve, reject) {
        policies.findOne({_id: id}, { fields: { pO: 1} }, function(err, policy) {
            if(err) {
                reject(err);
                console.log(err);
            } else {
                if(!policy) 
                    resolve(null);
                else {
                    if(policy.pO)
                        resolve(policy.pO);
                    else
                        reject("ERROR: Entry for entity '"+id+"' has invalid format.");
                }
            }
        });
    });
};

function create(id, policy) {
    return new Promise(function(resolve, reject) {
        policies.insertOne({ _id: id, pO : policy}, function(err, result) {
            if(err)
                reject(err);
            else {
                if(result.insertedCount != 1)
                    reject("ERROR: Unable to set policy for entity with id '"+id+"'");
                else
                    resolve(policy);
            }
        });
    });
};

function update(id, policy) {
    return new Promise(function(resolve, reject) {
        policies.findAndModify({ _id: id }, [[ "_id", 1 ]], { pO: policy }, { upsert: true }, function(err, result) {
            if(err) {
                reject(err);
            } else {
                resolve(policy);
            }
        });
    });
};

function del(id) {
    return new Promise(function(resolve, reject) {
        policies.deleteOne({ _id: id }, function(err, result) {
            if(err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
};
