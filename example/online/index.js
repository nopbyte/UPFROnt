var request = require('request');
var bunyan = require('bunyan');
var ulocks = require('ulocks');
var Policy = ulocks.Policy;

var log = bunyan.createLogger({name: "online", level: "debug"});

if(process.env.LOG_LEVEL)
    log.level(process.env.LOG_LEVEL)
else
    log.level(bunyan.FATAL + 1);

var settings = require('./settings.js');
var upfront = require('./../../index.js');

var pap = upfront.pap;
var pdp = upfront.pdp;
var pep = upfront.pep;

var sample = require('./sample');

var papDB = {};
var setting = [];
var retrieve = [];
var deletions = [];

function chainError(e) {
    return Promise.reject(e);
}

function checkRead(sub, subPolicy, obj, objPolicy) {
    var server = settings.server.host+":"+settings.server.port;
    var protocol = settings.server.tls ? "https" : "http";
    var url = server + "/pdp/read";
    url = url.replace(/\/\//g, "/");
    url = protocol + "://" + url;
    
    return new Promise(function(resolve, reject) {
        request({
            method: "POST",
            uri: url,
            json: { sub: sub, subPolicy: subPolicy, obj: obj, objPolicy: objPolicy }
        }, function(error, response, body) {
            if(error === null) {
                if(response.statusCode === 200) {
                    log.debug("checkRead was successful.");
                    resolve(body);
                } else {
                    log.debug("checkRead failed. Unexpected response code!");
                    reject(new Error("checkRead failed."));
                }
            } else {
                log.error("checkRead error: ", error);
                reject(error);
            }
        });
    });
}

function checkWrite(sub, subPolicy, obj, objPolicy) {
    var server = settings.server.host+":"+settings.server.port;
    var protocol = settings.server.tls ? "https" : "http";
    var url = server + "/pdp/write";
    url = url.replace(/\/\//g, "/");
    url = protocol + "://" + url;
    
    return new Promise(function(resolve, reject) {
        request({
            method: "POST",
            uri: url,
            json: { sub: sub, subPolicy: subPolicy, obj: obj, objPolicy: objPolicy }
        }, function(error, response, body) {
            if(error === null) {
                if(response.statusCode === 200) {
                    log.debug("checkWrite was successful.");
                    resolve(body);
                } else {
                    log.debug("checkWrite failed. Unexpected response code!");
                    reject(new Error("checkWrite failed."));
                }
            } else {
                log.error("checkWrite error: ", error);
                reject(error);
            }
        });
    });
}

function declassify(obj, trg) {
    var server = settings.server.host+":"+settings.server.port;
    var protocol = settings.server.tls ? "https" : "http";
    var url = server + "/pep/declassify";
    url = url.replace(/\/\//g, "/");
    url = protocol + "://" + url;
    
    return new Promise(function(resolve, reject) {

        request({
            method: "POST",
            uri: url,
            json: { obj: obj, trg: trg }
        }, function(error, response, body) {
            if(error === null) {
                if(response.statusCode === 200) {
                    log.debug("Declassification of object '"+obj.id+"' was successful.");
                    resolve(body);
                } else {
                    log.debug("Declassification of object '"+obj.id+"' failed. Unexpected response code!");
                    reject(new Error("Declassification of object '"+obj.id+"' failed."));
                }
            } else {
                log.error("error: ", error);
                reject(error);
            }
        });
    });
}

function setEntity(id, policy) {
    var server = settings.server.host+":"+settings.server.port;
    var protocol = settings.server.tls ? "https" : "http";
    var url = server + "/" + settings.server.path+"/"+id;
    url = url.replace(/\/\//g, "/");
    url = protocol + "://" + url;
    
    return new Promise(function(resolve, reject) {

        request({
            method: "PUT",
            uri: url,
            json: policy
        }, function(error, response, body) {
            if(error === null) {
                if(response.statusCode === 200) {
                    log.debug("Policy for entity '"+id+"' was set");
                    resolve();
                } else {
                    log.debug("Policy for entity '"+id+"' was not set. Invalid response code.");
                    reject(new Error("Unable to set policy for entity '"+id+"'."));
                }
            } else {
                log.error("error: ", error);
                reject(error);
            }
        });
    });
}

function getEntity(id) {
    var server = settings.server.host+":"+settings.server.port;
    var protocol = settings.server.tls ? "https" : "http";
    var url = server + "/" + settings.server.path+"/"+id;
    url = url.replace(/\/\//g, "/");
    url = protocol + "://" + url;
    
    return new Promise(function(resolve, reject) {

        request({
            method: "GET",
            uri: url
        }, function(error, response, body) {
            if(error === null) {
                if(response.statusCode === 200) {
                    log.debug("Retrieved policy for entity '"+id+"'.");
                    var json = JSON.parse(body);
                    if(json === null)
                        resolve(null)
                    else
                        resolve(new Policy(json));
                } else {
                    log.debug("Unable to retrieve policy for entity '"+id+"'. Invalid response code.");
                    reject(new Error("Unable to retrieve policy for entity '"+id+"'."));
                }
            } else {
                log.error(error);
                reject(error);
            }
        });
    });
}

function delEntity(id) {
    var server = settings.server.host+":"+settings.server.port;
    var protocol = settings.server.tls ? "https" : "http";
    var url = server + "/" + settings.server.path+"/"+id;
    url = url.replace(/\/\//g, "/");
    url = protocol + "://" + url;
    
    return new Promise(function(resolve, reject) {

        request({
            method: "DELETE",
            uri: url
        }, function(error, response, body) {
            if(error === null) {
                if(response.statusCode === 200) {
                    log.debug("Deleted policy for entity '"+id+"'.");
                    var r = JSON.parse(body);
                    resolve(r);
                } else {
                    log.debug("Unable to delete policy for entity '"+id+"'. Invalid response code.");
                    reject(new Error("Unable to delete policy for entity '"+id+"'."));
                }
            } else {
                log.error(error);
                reject(error);
            }
        });
    });
}

function getFullRecord(id) {
    var server = settings.server.host+":"+settings.server.port;
    var protocol = settings.server.tls ? "https" : "http";
    var url = server + "/" + settings.server.path+"/"+id+"/full";
    url = url.replace(/\/\//g, "/");
    url = protocol + "://" + url;
    
    return new Promise(function(resolve, reject) {

        request({
            method: "GET",
            uri: url
        }, function(error, response, body) {
            if(error === null) {
                if(response.statusCode === 200) {
                    log.debug("Retrieved full record for entity '"+id+"'.");
                    resolve(JSON.parse(body));
                } else {
                    log.debug("Unable to retrieve full record for entity '"+id+"'. Invalid response code.");
                    reject(new Error("Unable to retrieve full record for entity '"+id+"'."));
                }
            } else {
                log.error(error);
                reject(error);
            }
        });
    });
}

function getProperty(id, prop) {
    var server = settings.server.host+":"+settings.server.port;
    var protocol = settings.server.tls ? "https" : "http";
    var url = server + "/" + settings.server.path+"/"+id+"/prop/"+prop;
    url = url.replace(/\/\//g, "/");
    url = protocol + "://" + url;
    
    return new Promise(function(resolve, reject) {

        request({
            method: "GET",
            uri: url
        }, function(error, response, body) {
            if(error === null) {
                if(response.statusCode === 200) {
                    var json = JSON.parse(body)
                    if(json === null)
                        resolve(null);
                    else
                        resolve(new Policy(json));
                } else {
                    log.debug("Unable to retrieve policy for property '"+prop+"' of entity '"+id+"'. Invalid response code.");
                    reject(new Error("Unable to retrieve policy for property '"+prop+"' of entity '"+id+"'."));
                }
            } else {
                log.error(error);
                reject(error);
            }
        });
    });
}

function delProperty(id, prop) {
    var server = settings.server.host+":"+settings.server.port;
    var protocol = settings.server.tls ? "https" : "http";
    var url = server + "/" + settings.server.path+"/"+id+"/prop/"+prop;
    url = url.replace(/\/\//g, "/");
    url = protocol + "://" + url;
    
    return new Promise(function(resolve, reject) {

        request({
            method: "DELETE",
            uri: url
        }, function(error, response, body) {
            if(error === null) {
                if(response.statusCode === 200) {
                    log.debug("Deleted policy for entity '"+id+"'.");
                    var r = JSON.parse(body);
                    resolve(r);
                } else {
                    log.debug("Unable to delete policy for property '"+prop+"' of entity '"+id+"'. Invalid response code.");
                    reject(new Error("Unable to delete policy for property '"+prop+"' of entity '"+id+"'."));
                }
            } else {
                log.error(error);
                reject(error);
            }
        });
    });
}

function setProperty(id, prop, policy) {
    var server = settings.server.host+":"+settings.server.port;
    var protocol = settings.server.tls ? "https" : "http";
    var url = server + "/" + settings.server.path+"/"+id+"/prop/"+prop;
    url = url.replace(/\/\//g, "/");
    url = protocol + "://" + url;
    
    return new Promise(function(resolve, reject) {

        request({
            method: "PUT",
            uri: url,
            json: policy
        }, function(error, response, body) {
            if(error === null) {
                if(response.statusCode === 200) {
                    log.debug("Policy for entity '"+id+"' was set");
                    resolve();
                } else {
                    log.debug("Policy for property '"+prop+"' of entity '"+id+"' was not set. Invalid response code.");
                    reject(new Error("Unable to set policy for property '"+prop+"' of entity '"+id+"'."));
                }
            } else {
                log.error("error: ", error);
                reject(error);
            }
        });
    });
};
        
upfront.init(settings)
    .then(ulocks.init(settings.ulocks))
    .then(function() {
        var creation = [];
        creation.push(setEntity(sample.entities.user.id, sample.policies.defaultActor));
        creation.push(setEntity(sample.entities.admin.id, sample.policies.defaultActor));
        creation.push(setEntity(sample.entities.sensor.id, sample.policies.defaultActor));
        creation.push(setEntity(sample.entities.sensor2.id, sample.policies.defaultActor));
        creation.push(setEntity(sample.entities.client.id, sample.policies.defaultActor));

        return Promise.all(creation);
    }, chainError).then(function() {      
        var retrieve = [];

        retrieve.push(getEntity(sample.entities.user.id));
        retrieve.push(getEntity(sample.entities.admin.id));
        retrieve.push(getEntity(sample.entities.sensor.id));
        retrieve.push(getEntity(sample.entities.sensor2.id));
        retrieve.push(getEntity(sample.entities.client.id));

        return Promise.all(retrieve);
    }, chainError).then(function(v) {
        /* for(var i = 0; i < 5; i++)
            console.log("values["+i+"]: " + v[i]);*/
        
        if(!v[0] || !v[0].eq(sample.policies.defaultActor) ||
           !v[1] || !v[1].eq(sample.policies.defaultActor) ||
           !v[2] || !v[2].eq(sample.policies.defaultActor) ||
           !v[3] || !v[3].eq(sample.policies.defaultActor) ||
           !v[4] || !v[4].eq(sample.policies.defaultActor))
            return Promise.reject(new Error("Actor policy mismatches!"));

        var setting = [];
        // set the default policy for all properties, i.e. everyone may read only the owner may write
        // WARNING: In production this should first be set more restrictive, otherwise, the password
        // can be read during creation (use policy such as sample.policies.adminOnly)
        setting.push(setProperty(sample.entities.user.id, "", sample.policies.defaultEntity));
        setting.push(setProperty(sample.entities.admin.id, "", sample.policies.defaultEntity));
        setting.push(setProperty(sample.entities.sensor.id, "", sample.policies.defaultEntity));
        setting.push(setProperty(sample.entities.client.id, "", sample.policies.defaultEntity));

        // set the policies for the properties
        setting.push(setProperty(sample.entities.user.id, "password", sample.policies.defaultPasswd));
        setting.push(setProperty(sample.entities.admin.id, "password", sample.policies.defaultPasswd));

        setting.push(setProperty(sample.entities.user.id, "role", sample.policies.defaultRole));
        setting.push(setProperty(sample.entities.admin.id, "role", sample.policies.defaultRole));

        setting.push(setProperty(sample.entities.sensor.id, "credentials", sample.policies.defaultPasswd));
        setting.push(setProperty(sample.entities.client.id, "credentials", sample.policies.defaultPasswd));

        // TODO what if one element is declassified in an array ... it should still be in the correct position
        // but it also reveals that there was another declassified element
        setting.push(setProperty(sample.entities.sensor.id, "credentials[1].system", sample.policies.defaultRole));
        setting.push(setProperty(sample.entities.sensor.id, "credentials[2].system", sample.policies.defaultRole));
        
        setting.push(setProperty(sample.entities.sensor.id, "secret", sample.policies.defaultPasswd));
        setting.push(setProperty(sample.entities.sensor.id, "secret2", sample.policies.defaultSecret2));

        return Promise.all(setting);
    }, chainError).then(function(v) {
        // for(var i = 0; i < 12; i++)
        // console.log("values["+i+"]: ", v[i]);
        
        var retrieve = [];
        retrieve.push(getProperty(sample.entities.user.id, ""));
        retrieve.push(getProperty(sample.entities.admin.id, ""));
        retrieve.push(getProperty(sample.entities.sensor.id, ""));
        retrieve.push(getProperty(sample.entities.client.id, ""));
        
        // set the policies for the properties
        retrieve.push(getProperty(sample.entities.user.id, "password"));
        retrieve.push(getProperty(sample.entities.admin.id, "password"));
        
        retrieve.push(getProperty(sample.entities.user.id, "role"));
        retrieve.push(getProperty(sample.entities.admin.id, "role"));
        
        retrieve.push(getProperty(sample.entities.sensor.id, "credentials"));
        retrieve.push(getProperty(sample.entities.client.id, "credentials"));
        
        retrieve.push(getProperty(sample.entities.sensor.id, "credentials[1].system"));
        retrieve.push(getProperty(sample.entities.sensor.id, "credentials[2].system"));
        
        return Promise.all(retrieve);
    }, chainError).then(function(values) {
        for(var i = 0; i < 12; i++)
            console.log("values["+i+"]: ", values[i]);
            
        if(!values[0].eq(sample.policies.defaultEntity) ||
           !values[1].eq(sample.policies.defaultEntity) ||
           !values[2].eq(sample.policies.defaultEntity) ||
           !values[3].eq(sample.policies.defaultEntity))
            return Promise.reject(new Error("default entity policies modified during creation or retrieval"));
        
        
        if(!values[4].eq(sample.policies.defaultPasswd) ||
           !values[5].eq(sample.policies.defaultPasswd))
            return Promise.reject(new Error("default password policies modified during creation or retrieval"));
        
        if(!values[6].eq(sample.policies.defaultRole) ||
           !values[7].eq(sample.policies.defaultRole))
            return Promise.reject(new Error("default role policy modified during creation or retrieval"));
                    
        if(!values[8].eq(sample.policies.defaultPasswd) ||
           !values[9].eq(sample.policies.defaultPasswd))
            return Promise.reject(new Error("default credentials policy modified during creation or retrieval"));
                    
        if(!values[10].eq(sample.policies.defaultRole) ||
           !values[11].eq(sample.policies.defaultRole))
            return Promise.reject(new Error("default entity policy modified during creation or retrieval"));

        // console.log("storing and retrieval works, testing policy decisions now");
        
        return Promise.resolve();
    }, chainError).then(function() {
        // *******************************************************
        // storing and retrieval works, lets test policy decisions
        // *******************************************************
        
        // USER WRITES TO ADMIN PASSWORD
        var p = checkWrite(sample.entities.user, sample.policies.defaultActor, sample.entities.admin, sample.policies.defaultPasswd);
        return p;
    }, chainError).then(function(decision) {
        // console.log("decision: ", decision);
        
        if(decision.grant !== false)
            return Promise.reject(new Error("ERROR: Write from user to admin password should be forbidden but is allowed: ",decision));
        else
            console.log("Success: Write from user to admin not granted");

        // USER READS ADMIN PASSWORD
        return checkRead(sample.entities.user, sample.policies.defaultActor, sample.entities.admin, sample.policies.defaultPasswd);
    }, chainError).then(function(decision) {
        if(decision.grant !== false)
            return Promise.reject(new Error("ERROR: Read from user of admin password should be forbidden but is allowed: ",decision));
        else
            console.log("Success: Read from user to admin password not granted");

        // ADMIN WRITES ITS PASSWORD
        return checkWrite(sample.entities.admin, sample.policies.defaultActor, sample.entities.admin, sample.policies.defaultPasswd);
    }, chainError).then(function(decision) {
        if(decision.grant !== true)
            return Promise.reject(new Error("ERROR: Write from admin to admin password should be allowed but is forbidden: ",decision));
        else
            console.log("Success: Write from admin to admin password granted");

        // ADMIN READS ITS PASSWORD
        return checkRead(sample.entities.admin, sample.policies.defaultActor, sample.entities.admin, sample.policies.defaultPasswd);
    }, chainError).then(function(decision) {
        if(decision.grant !== true) {
            return Promise.reject(new Error("ERROR: Read from admin of admin password should be allowed but is forbidden: ", decision));
        } else
            console.log("Success: Read from admin to admin password granted");

        // ADMIN SETS PASSWORD OF USER
        return checkWrite(sample.entities.admin, sample.policies.defaultActor, sample.entities.user, sample.policies.defaultPasswd);
    }, chainError).then(function(decision) {
        if(decision.grant !== true)
            return Promise.reject(new Error("ERROR: Write from admin to user password should be allowed but is forbidden: " + JSON.stringify(decision)));
        else
            console.log("Success: Write from admin to user password granted");

        // ADMIN SETS ROLE OF USER
        return checkWrite(sample.entities.admin, sample.policies.defaultActor, sample.entities.user, sample.policies.defaultRole);
    }, chainError).then(function(decision) {
        if(decision.grant !== true)
            return Promise.reject(new Error("ERROR: Write from admin to user role should be allowed but is forbidden: " + JSON.stringify(decision)));
        else
            console.log("Success: Write from admin to user role granted");

        // USER SETS ROLE OF USER
        return checkWrite(sample.entities.user, sample.policies.defaultActor, sample.entities.user, sample.policies.defaultRole);
    }, chainError).then(function(decision) {
        if(decision.grant !== false)
            return Promise.reject(new Error("ERROR: Write from user to user role should be forbidden but is allowed: ",decision));
        else
            console.log("Success: Write from user to user role not granted");

        // USER SETS NAME OF SENSOR HE DOES NOT OWN
        return checkWrite(sample.entities.user, sample.policies.defaultActor, sample.entities.sensor, sample.policies.defaultEntity);
    }, chainError).then(function(decision) {
        if(decision.grant !== false)
            return Promise.reject(new Error("ERROR: Write from user to sensor name should be forbidden but is allowed: ",decision));
        else
            console.log("Success: Write from user to sensor name not granted");

        // ADMIN SETS NAME OF SENSOR HE OWNS
        return checkWrite(sample.entities.admin, sample.policies.defaultActor, sample.entities.sensor, sample.policies.defaultEntity);
    }, chainError).then(function(decision) {
        if(decision.grant !== true)
            return Promise.reject(new Error("ERROR: Write from admin to sensor name should be allowed but is forbidden: " + JSON.stringify(decision)));
        else
            console.log("Success: Write from admin to sensor name granted");
        
        return declassify(sample.entities.sensor, sample.entities.admin);
    }, chainError).then(function(filteredObject) {
        if(filteredObject.credentials.length != 4 || !filteredObject.hasOwnProperty("secret"))
            return Promise.reject(new Error("ERROR: Object was filtered incorrectly: " + JSON.stringify(filteredObject, null, 2)));
        else
            console.log("Success: Credentials were not filtered.");

        // DECLASSIFY SENSOR RECORD SENT TO USER
        return declassify(sample.entities.sensor, sample.entities.user);
    }, chainError).then(function(filteredObject) {
        if(!filteredObject.hasOwnProperty("secret2") || filteredObject.secret2 !== "CLASSIFIED")
            return Promise.reject(new Error("ERROR: secret2 was filtered incorrectly: " + JSON.stringify(filteredObject, null, 2)));
        else
            console.log("Success: Secret2 was declassified successfully.");

        // DECLASSIFY SENSOR RECORD SENT TO USER
        return declassify(sample.entities.sensor, sample.entities.user);
    }, chainError).then(function(filteredObject) {
        if(filteredObject.credentials.length != 3 &&
           (filteredObject.credentials[0] !== null || filteredObject.credentials[3] !== null) ||
           filteredObject.hasOwnProperty("secret"))
                return Promise.reject(new Error("ERROR: Object was filtered incorrectly: " + JSON.stringify(filteredObject, null, 2)));
        else
            console.log("Success: Credentials and secret were declassified.");

        return Promise.resolve();
    }, chainError).then(function() {
        // USER SETS NAME OF CLIENT HE DOES NOT OWN
        return checkWrite(sample.entities.user, sample.policies.defaultActor, sample.entities.client, sample.policies.defaultEntity);
    }, chainError).then(function(decision) {
        if(decision.grant !== false)
            return Promise.reject(new Error("ERROR: Write from user to client name should be forbidden but is allowed: ", decision));
        else
            console.log("Success: Write from user to client name not granted");

        // ADMIN SETS NAME OF CLIENT HE OWNS
        return checkWrite(sample.entities.admin, sample.policies.defaultActor, sample.entities.client, sample.policies.defaultEntity);
    }, chainError).then(function(decision) {
        if(decision.grant !== true)
            return Promise.reject(new Error("ERROR: Write from admin to client name should be allowed but is forbidden: ", decision));
        else
            console.log("Success: Write from admin to client name granted");

        return Promise.resolve();
    }, chainError).then(function() {
        values = [];
        return delProperty(sample.entities.sensor.id, "");
    }, chainError).then(function(r) {
        values.push(r);
        return delProperty(sample.entities.sensor.id, "credentials");
    }, chainError).then(function(r) {
        values.push(r);
        for(var d in values)
            if(!values[d])
                return Promise.reject(new Error("ERROR: Property policy deletion was not successful: "+JSON.stringify(values[d])));
        
        return getFullRecord(sample.entities.sensor.id);
    }, chainError).then(function(r) {
        if(r.self === undefined || r.self === undefined || r.self !== null ||
           r.properties === undefined || r.properties.credentials === undefined ||
           r.properties.credentials.self === undefined || r.properties.credentials.self !== null)
            return Promise.reject(new Error("ERROR: Deletion did not reset policies or destroyed PAP structure"));
        else
            console.log("Success: Properties deleted successfully");
        
           return delEntity(sample.entities.sensor.id);
    }, chainError).then(function(del) {
        if(del === null)
            return Promise.reject(new Error("Entity policy deletion was not successful."));
        else
            console.log("Success: Entity policy deletion was triggered.");
        
        return getFullRecord(sample.entities.sensor.id);
    }, chainError).then(function(r) {
        if(r !== null)
            return Promise.reject(new Error("ERROR: Entity policy deletion was not successful as the sensor still has a policy"));
        else
            console.log("Success: Sensor does not have policy after deletion.");

        return delEntity(sample.entities.sensor.id);
    }, chainError).then(function(del) {
        if(del !== null)
            return Promise.reject(new Error("ERROR: It should not be possible to delete an entity policy a second time!"));
        else
            console.log("Success: Entity can only be deleted once.");

        return upfront.stop();
    }, chainError).then(function() {
        console.log("Test finished");
    }).catch(function(reason) {
        if(reason && reason.stack !== undefined)
            console.log(reason.stack);
        else
            console.log("ERROR: "+reason);

        upfront.stop();
    });
