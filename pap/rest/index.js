var path = require('path');

/*****************/
/* Local Modules */
/*****************/

var api = require("../api");

function init(settings, app) {
    var p = path.sep;
    if(settings.server && settings.server.path) {
        p = settings.server.path;
        if(!p.endsWith(path.sep))
           p += path.sep;
    }

    app.get(p + "policy" + path.sep, get);
    app.put(p + "policy" + path.sep, set);
    app.delete(p + "policy" + path.sep, del);
    
    return Promise.resolve();
}

function get(req, res) {
    var id = req.body.id;
    var property = req.body.property;

    api.get(id, property).then(function(p) {
        res.status(200).json(p).end();
    }, function(e) {
        console.log(e);
        res.status(403).json({ err: e }).end();
    });
}

function set(req, res, policy) {
    var id = req.body.id;
    var property = req.body.property;
    var policy = req.body.policy;

    api.set(id, property).then(function(p) {
        res.status(200).json(p).end();
    }, function(e) {
        console.log(e);
        res.status(403).json({ err: e }).end();
    });
}

function del(req, res) {
    var id = req.body.id;
    var property = req.body.property;

    api.del(id, property).then(function(p) {
        res.status(200).json(p).end();
    }, function(e) {
        console.log(e);
        res.status(403).json({ err: e }).end();
    });
}

module.exports = {
    init: init
}
