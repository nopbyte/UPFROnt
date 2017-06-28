module.exports = {
    entities : {
        admin : {
            "user_name":"bob",
            "auth_type":"agile-local",
            "password":"secret",
            "id":"bob!@!agile-local",
            "type":"/user",
            "role":"admin",
            "owner":"bob!@!agile-local"
        },
        user : {
            "user_name":"alice",
            "auth_type":"agile-local",
            "password":"secret",
            "id":"alice!@!agile-local",
            "type":"/user",
            "role":"student",
            "owner":"alice!@!agile-local"
        },
        sensor : {
            "name"  : "sensor",
            "id"    : "some_id_for_sensor",
            "type"  : "/sensor",
            "owner" : "bob!@!agile-local",
            "credentials" : [
                "start token",
                {"system" : "dropbox", "value": "xyzsometoken"},
                {"system" : "github", "value": "xyzsomeothertoken"},
                "sometoken in a mixed array"
            ]
        },
        client : {
            "name"  : "client",
            "id"    : "some_id_for_client",
            "type"  : "/client",
            "owner" : "bob!@!agile-local",
            "credentials" : [ "foo", "bar" ]
        },
        user2: {
            "id": "123456789",
            "name": "Schreckling",
            "address": {
                "street": "Innstrasse 43",
                "city": "Passau"
            },
            "role": "user",
            "passwd": "pwdhash"
        }
    },
    policies : {
        // default policy for an entity if becomes an active entity, trying to interact with other entities
        defaultActor : [
            // actions of an actor are not restricted a priori
            { to: false },
            { to: true }
        ],
        // default policy for all properties of entities
        defaultEntity : { flows: [
            // all properties can be read by everyone
            { to: true },
            // all properties can only be changed by the owner of the entity
            { to: false, locks: [ { lock: "hasType", args: [ "/user" ] }, { lock: "isOwner" } ] }
        ]},
        defaultPasswd : [
            // the property can only be read by the user itself
            { to: true, locks: [ { lock: "hasType", args: [ "/user" ] }, { lock: "isOwner" } ] },
            // the property can be set by the user itself and
            { to: false, locks: [ { lock: "hasType", args: [ "/user" ] }, { lock: "isOwner" } ] },
            // by all users with role admin
            { to: false, locks: [ { lock: "hasType", args: [ "/user" ] }, { lock : "attrEq", args : [ "role", "admin" ] } ] }
        ],
        defaultRole : [
            // can be read by everyone 
            { to: true },
            // can only be changed by users with role admin
            { to: false, locks: [ { lock: "hasType", args: [ "/user" ] }, { lock : "attrEq", args : [ "role", "admin" ] } ] }
        ],
        adminOnly : [
            { to: false, locks: [ { lock: "hasType", args: [ "/user" ] }, { lock : "attrEq", args : [ "role", "admin" ] } ] },
            { to: true, locks: [ { lock: "hasType", args: [ "/user" ] }, { lock : "attrEq", args : [ "role", "admin" ] } ] }
        ]        
    }
};
