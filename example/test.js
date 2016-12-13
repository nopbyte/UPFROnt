var upfront = require('./../index.js');

var pap = upfront.pap;
var pdp = upfront.pdp;
var pep = upfront.pep;

var sample = require('./sample');

var papDB = {};
var setting = [];
var retrieve = [];
var deletions = [];

pap.init(papDB)
    .then( function () {
        // first create entries for all entities in the PAP using the default policy which
        // may restrict the activities of an entity
        var creation = [];
        creation.push(pap.createEntity(sample.entities.user.id, sample.policies.defaultActor));
        creation.push(pap.createEntity(sample.entities.admin.id, sample.policies.defaultActor));
        creation.push(pap.createEntity(sample.entities.sensor.id, sample.policies.defaultActor));
        creation.push(pap.createEntity(sample.entities.client.id, sample.policies.defaultActor));
        
        return Promise.all(creation);
    })
    .then( function () {
        retrieve.push(pap.getEntity(sample.entities.user.id));
        retrieve.push(pap.getEntity(sample.entities.admin.id));
        retrieve.push(pap.getEntity(sample.entities.sensor.id));
        retrieve.push(pap.getEntity(sample.entities.client.id));

        return Promise.all(retrieve);
    })
    .then( function(values) {
        if(!values[0].eq(sample.policies.defaultActor) ||
           !values[1].eq(sample.policies.defaultActor) ||
           !values[2].eq(sample.policies.defaultActor) ||
           !values[3].eq(sample.policies.defaultActor))
            return Promise.reject(new Error("Actor policy mismatches!"));

        retrieve = [];
        return Promise.resolve();
    })
    .then( function () {
        // set the default policy for all properties, i.e. everyone may read only the owner may write
        // WARNING: In production this should first be set more restrictive, otherwise, the password
        // can be read during creation (use policy such as sample.policies.adminOnly)
        setting.push(pap.setProp(sample.entities.user.id, sample.policies.defaultEntity));
        setting.push(pap.setProp(sample.entities.admin.id, sample.policies.defaultEntity));
        setting.push(pap.setProp(sample.entities.sensor.id, sample.policies.defaultEntity));
        setting.push(pap.setProp(sample.entities.client.id, sample.policies.defaultEntity));
        
        // set the policies for the properties
        setting.push(pap.setProp(sample.entities.user.id, "password", sample.policies.defaultPasswd));
        setting.push(pap.setProp(sample.entities.admin.id, "password", sample.policies.defaultPasswd));
        
        setting.push(pap.setProp(sample.entities.user.id, "role", sample.policies.defaultRole));
        setting.push(pap.setProp(sample.entities.admin.id, "role", sample.policies.defaultRole));

        setting.push(pap.setProp(sample.entities.sensor.id, "credentials", sample.policies.defaultPasswd));
        setting.push(pap.setProp(sample.entities.client.id, "credentials", sample.policies.defaultPasswd));

        return Promise.all(setting);
    })
    .then( function () {     
        retrieve.push(pap.getProp(sample.entities.user.id));
        retrieve.push(pap.getProp(sample.entities.admin.id));
        retrieve.push(pap.getProp(sample.entities.sensor.id));
        retrieve.push(pap.getProp(sample.entities.client.id));
        
        // set the policies for the properties
        retrieve.push(pap.getProp(sample.entities.user.id, "password"));
        retrieve.push(pap.getProp(sample.entities.admin.id, "password"));
        
        retrieve.push(pap.getProp(sample.entities.user.id, "role"));
        retrieve.push(pap.getProp(sample.entities.admin.id, "role"));

        retrieve.push(pap.getProp(sample.entities.sensor.id, "credentials"));
        retrieve.push(pap.getProp(sample.entities.client.id, "credentials"));

        retrieve.push(pap.getProp(sample.entities.sensor.id, "name"));

        return Promise.all(retrieve);
    })
    .then( function(values) {
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

        if(!values[10].eq(sample.policies.defaultEntity))
            return Promise.reject(new Error("default entity policy modified during creation or retrieval"));
    })
    .catch( function(reason) {
        if(reason && reason.stack !== undefined)
            console.log(reason.stack);
        else
            console.log("Something went wrong: "+reason);
    });

// storing and retrieval works, lets test policy decisions

var userInfo = {
    type : "user",
    data : sample.entities.user
};

var adminInfo = {
    type : "user",
    data : sample.entities.admin
};

var sensorInfo = {
    type : "sensor",
    data : sample.entities.sensor
};

var clientInfo = {
    type : "client",
    data : sample.entities.client
};

// USER WRITES TO ADMIN PASSWORD
pdp.checkWrite(userInfo, sample.policies.defaultEntity, adminInfo, sample.policies.defaultPasswd)
    .then(function(decision) {
        if(decision.result !== false)
            return Promise.reject(new Error("ERROR: Write from user to admin password should be forbidden but is allowed: ",decision));
        else
            console.log("Success: Write from user to admin not granted");

        // USER READS ADMIN PASSWORD
        return pdp.checkRead(userInfo, sample.policies.defaultEntity, adminInfo, sample.policies.defaultPasswd);
    })
    .then(function(decision) {
        if(decision.result !== false)
            return Promise.reject(new Error("ERROR: Read from user of admin password should be forbidden but is allowed: ",decision));
        else
            console.log("Success: Read from user to admin password not granted");

        // ADMIN WRITES ITS PASSWORD
        return pdp.checkWrite(adminInfo, sample.policies.defaultEntity, adminInfo, sample.policies.defaultPasswd);
    })
    .then(function(decision) {
        if(decision.result !== true)
            return Promise.reject(new Error("ERROR: Write from admin to admin password should be allowed but is forbidden: ",decision));
        else
            console.log("Success: Write from admin to admin password granted");

        // ADMIN READS ITS PASSWORD
        return pdp.checkRead(adminInfo, sample.policies.defaultEntity, adminInfo, sample.policies.defaultPasswd);
    })
    .then(function(decision) {
        if(decision.result !== true)
            return Promise.reject(new Error("ERROR: Read from admin of admin password should be allowed but is forbidden: ",decision));
        else
            console.log("Success: Read from admin to admin password granted");

        // ADMIN SETS PASSWORD OF USER
        return pdp.checkWrite(adminInfo, sample.policies.defaultEntity, userInfo, sample.policies.defaultPasswd);
    })
    .then(function(decision) {
        if(decision.result !== true)
            return Promise.reject(new Error("ERROR: Write from admin to user password should be allowed but is forbidden: ",decision));
        else
            console.log("Success: Write from admin to user password granted");

        // ADMIN SETS ROLE OF USER
        return pdp.checkWrite(adminInfo, sample.policies.defaultEntity, userInfo, sample.policies.defaultRole);
    })
    .then(function(decision) {
        if(decision.result !== true)
            return Promise.reject(new Error("ERROR: Write from admin to user role should be allowed but is forbidden: ",decision));
        else
            console.log("Success: Write from admin to user role granted");

        // USER SETS ROLE OF USER
        return pdp.checkWrite(userInfo, sample.policies.defaultEntity, userInfo, sample.policies.defaultRole);
    })
    .then(function(decision) {
        if(decision.result !== false)
            return Promise.reject(new Error("ERROR: Write from user to user role should be forbidden but is allowed: ",decision));
        else
            console.log("Success: Write from user to user role not granted");

        // USER SETS NAME OF SENSOR HE DOES NOT OWN
        return pdp.checkWrite(userInfo, sample.policies.defaultEntity, sensorInfo, sample.policies.defaultEntity);
    })
    .then(function(decision) {
        if(decision.result !== false)
            return Promise.reject(new Error("ERROR: Write from user to sensor name should be forbidden but is allowed: ",decision));
        else
            console.log("Success: Write from user to sensor name not granted");

        // ADMIN SETS NAME OF SENSOR HE OWNS
        return pdp.checkWrite(adminInfo, sample.policies.defaultEntity, sensorInfo, sample.policies.defaultEntity);
    })
    .then(function(decision) {
        if(decision.result !== true)
            return Promise.reject(new Error("ERROR: Write from admin to sensor name should be allowed but is forbidden: ",decision));
        else
            console.log("Success: Write from admin to sensor name granted");

        // GET PAP POLICY RECORD FOR SENSOR
        return pap.get(sample.entities.sensor.id);
    })
    .then(function(papRecord) {
        // DECLASSIFY SENSOR RECORD SENT TO ADMIN
        return pep.declassify(sample.entities.sensor, papRecord, adminInfo, sample.policies.defaultActor);
    })
    .then(function(filteredObject) {
        if(filteredObject.credentials.length != 2)
            return Promise.reject(new Error("ERROR: Object was filtered incorrectly: ", filteredObject));
        else
            console.log("Success: Credentials were not filtered: ", filteredObject);

        // GET PAP POLICY RECORD FOR SENSOR
        return pap.get(sample.entities.sensor.id);
    })
    .then(function(papRecord) {
        // DECLASSIFY SENSOR RECORD SENT TO USER
        return pep.declassify(sample.entities.sensor, papRecord, userInfo, sample.policies.defaultActor);
    })
    .then(function(filteredObject) {
        if(filteredObject.credentials.length != 0)
            return Promise.reject(new Error("ERROR: Object was filtered incorrectly: ", filteredObject));
        else
            console.log("Success: Credentials were filtered: ", filteredObject);

        return Promise.resolve();
    })
    .then(function() {
        // USER SETS NAME OF CLIENT HE DOES NOT OWN
        return pdp.checkWrite(userInfo, sample.policies.defaultEntity, clientInfo, sample.policies.defaultEntity);
    })
    .then(function(decision) {
        if(decision.result !== false)
            return Promise.reject(new Error("ERROR: Write from user to client name should be forbidden but is allowed: ", decision));
        else
            console.log("Success: Write from user to client name not granted");

        // ADMIN SETS NAME OF CLIENT HE OWNS
        return pdp.checkWrite(adminInfo, sample.policies.defaultEntity, clientInfo, sample.policies.defaultEntity);
    })
    .then(function(decision) {
        if(decision.result !== true)
            return Promise.reject(new Error("ERROR: Write from admin to client name should be allowed but is forbidden: ", decision));
        else
            console.log("Success: Write from admin to client name granted");

        return Promise.resolve();
    })
    .then(function() {
        deletions.push(pap.delProp(sample.entities.sensor.id));
        deletions.push(pap.delProp(sample.entities.sensor.id, "credentials"));

        return Promise.all(deletions);
    })
    .then(function() {
        return pap.get(sample.entities.sensor.id);
    })
    .then(function(r) {
        if(r.self === undefined || r.self === undefined || r.self !== null ||
           r.properties === undefined || r.properties.credentials === undefined ||
           r.properties.credentials.self === undefined || r.properties.credentials.self !== null)
            return Promise.reject(new Error("ERROR: Deletion did not reset policies or destroyed PAP structure"));
        else
            console.log("Success: Properties deleted successfully");
        
        return pap.delEntity(sample.entities.sensor.id);
    })
    .then(function() {
        return pap.get(sample.entities.sensor.id);
    })
    .catch(function(reason) {
        // TODO: The error caught here may have other reasons.
        // Become more precise with distinguished errors
        console.log("Success: Entity does not exist anymore. Call throws error: "+reason);
    })
    .catch(function(reason) {
        if(reason && reason.stack !== undefined)
            console.log(reason.stack);
        else
            console.log("Something went wrong: "+reason);
    });
