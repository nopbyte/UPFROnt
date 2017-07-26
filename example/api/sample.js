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
            ],
            "secret": "stuff",
            "secret2": "more stuff"
        },
        sensor2: {
            "credentials"  : [ "sensor" ],
            "id"    : "some_id_for_sensor2"
        },            
        client : {
            "name"  : "client",
            "id"    : "some_id_for_client",
            "type"  : "/client",
            "owner" : "bob!@!agile-local",
            "credentials" : [ "foo", "bar" ]
        },
    },
    policies : {
        // default policy for an entity if becomes an active entity, trying to interact with other entities
        defaultActor : [
            // actions of an actor are not restricted a priori
            { op: "write" },
            { op: "read" }
        ],
        // default policy for all properties of entities
        defaultEntity : { flows: [
            // all properties can be read by everyone
            { op: "read" },
            // all properties can only be changed by the owner of the entity
            { op: "write", locks: [ { lock: "hasType", args: [ "/user" ] }, { lock: "isOwner" } ] }
        ]},
        defaultPasswd : { flows: [
            // the property can only be read by the user itself
            { op: "read", locks: [ { lock: "hasType", args: [ "/user" ] }, { lock: "isOwner" } ] },
            // the property can be set by the user itself and
            { op: "write", locks: [ { lock: "hasType", args: [ "/user" ] }, { lock: "isOwner" } ] },
            // by all users with role admin
            { op: "write", locks: [ { lock: "hasType", args: [ "/user" ] }, { lock : "attrEq", args : [ "role", "admin" ] } ] }
        ], actions: { "read": [ { action: "delete" } ] } },
        defaultSecret2 : { flows: [
            { op: "write", locks: [ { lock: "hasType", args: [ "/user" ] }, { lock : "attrEq", args : [ "role", "admin" ] } ] },
            { op: "read", locks: [ { lock: "hasType", args: [ "/user" ] }, { lock : "attrEq", args : [ "role", "admin" ] } ] }
        ], actions: { "read": [ { action: "replace", args: [ "fixed", "CLASSIFIED" ] } ] } },
        defaultRole : [
            // can be read by everyone 
            { op: "read" },
            // can only be changed by users with role admin
            { op: "write", locks: [ { lock: "hasType", args: [ "/user" ] }, { lock : "attrEq", args : [ "role", "admin" ] } ] }
        ],
        adminOnly : { flows: [
            { op: "write", locks: [ { lock: "hasType", args: [ "/user" ] }, { lock : "attrEq", args : [ "role", "admin" ] } ] },
            { op: "read", locks: [ { lock: "hasType", args: [ "/user" ] }, { lock : "attrEq", args : [ "role", "admin" ] } ] }
        ], actions: { "read": [ { action: "delete" } ] } }
    }
};
