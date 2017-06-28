var settings = require('./settings.js');
var upfront = require('./../../index.js');

var pap = upfront.pap;
var pdp = upfront.pdp;
var pep = upfront.pep;

var user = require('./sample').entities.user2;
var defaultActor = require('./sample').policies.defaultActor;
var defaultEntity = require('./sample').policies.defaultEntity;

upfront.init(settings)
    .then(function() {
        return pap.set(user.id, defaultActor);
    }, function(e) {
        console.log("ERROR: Unable to initialize UPFROnt!");
        return Promise.reject(e);
    })
    .then(function() {
        return pap.getFullRecord(user.id);
    }, function(e) {
        console.log("ERROR: Unable to set user entry.");
        return Promise.reject(e);
    })
    .then(function(u) {
        return pap.set(user.id, "", defaultEntity);
    }, function(e) {
        console.log("ERROR: Unable to retrieve user entry.");
        return Promise.reject(e);
    }).then(function() {
        return pap.getFullRecord(user.id);
    }, function(e) {
        console.log("ERROR: Unable to set user entry.");
        return Promise.reject(e);
    }).then(function(u) {
        return pap.set(user.id, "address.street", defaultEntity);
    }, function(e) {
        console.log("ERROR: Unable to retrieve user entry.");
        return Promise.reject(e);
    }).then(function() {
        return pap.getFullRecord(user.id);
    }, function(e) {
        console.log("ERROR: Unable to set user entry.");
        return Promise.reject(e);
    }).then(function(u) {
        return pap.set(user.id, "passwd", defaultEntity);
    }, function(e) {
        console.log("ERROR: Unable to retrieve user entry.");
        return Promise.reject(e);
    }).then(function() {
        return pap.getFullRecord(user.id);
    }, function(e) {
        console.log("ERROR: Unable to set user entry.");
        return Promise.reject(e);
    }).then(function(u) {
        console.log("Done.");
        return upfront.finish();
    }, function(e) {
        console.log("ERROR: Unable to retrieve user entry.");
        return Promise.reject(e);
    }).catch(function(reason) {
        if(reason && reason.stack !== undefined)
            console.log(reason.stack);
        else
            console.log("ERROR: "+reason);
    });
