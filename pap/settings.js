module.exports = {
    // this specifies host, port and path where
    // this module should wait for requests
    // if specified, the module runs as a PAP server
    // if undefined, the module runs as a PAP client
    // accessing another PAP server
    /* server: {
        "host": "localhost",
        port: 1234,
        path: "/pap/",
        tls: false,
        cluster: 1
    },*/
    // storage specifies where the policies
    // are stored persistently:
    // 1. if policies are stored remotely
    // in another PAP, specify as type "remote"
    // and indicate host, port and path
    // 2. if policies are stored locally
    // in a database, specify the db module
    // ("mongodb", tbd) and the hostname and
    // port
    // thus, specifying type "remote" and specifying
    // api yields an invalid configuration

    // TODO: make sure that type contains a file name to the module which is then loaded
    storage: {
        type: "mongodb",
        host: "localhost",
        port: 27017,
        password: "",
        user: "",
        dbName: "pap-database",
        collection: "policies",

        // specifies whether the module should check
        // the cache to fetch a policy, of course,
        // this may induce additional lookups but on
        // average using the cache is recommended

        // TODO: check whether leaving this out works
        cache: {
            enabled: false,
            TTL: 600,
            pubsub: {
                type: "redis",
                channel: "policyUpdates"
            }
        }
    }
}
