var express = require('express');
var bodyParser = require('body-parser');

var pap = require("./api");

var errorHandler = function (err, req, res, next) {
    console.log(err.stack);
    res.status(400).json({error: "unexpected_error", message: err.toString()});
};

var initialized = false;

function init() {
    var app = express();

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: true}));
    app.use(errorHandler);      
    
    app.get("/:id", get);
    app.get("/:id/full", getFull);
    app.get("/:id/prop/:property?", getProp);
    app.put("/:id", set);
    app.put("/:id/prop/:property?", setProp);
    app.delete("/:id", del);
    app.delete("/:id/prop/:property?", delProp);

    console.log("PAP APP initialized");
    
    return app;
}

function get(req, res) {
    var id = req.params.id;
    
    pap.get(id).then(function(p) {
        res.status(200).json(p).end();
    }, function(e) {
        console.log(e);
        res.status(403).json({ err: e }).end();
    });
}

function getFull(req, res) {
    var id = req.params.id;
    
    pap.getFullRecord(id).then(function(p) {
        res.status(200).json(p).end();
    }, function(e) {
        console.log(e);
        res.status(403).json({ err: e }).end();
    });
}

function getProp(req, res) {
    var id = req.params.id;
    var property = req.params.property;

    if(property === undefined)
        property = "";

    pap.get(id, property).then(function(p) {
        res.status(200).json(p).end();
    }, function(e) {
        console.log(e);
        res.status(403).json({ err: e }).end();
    });
}

function set(req, res) {
    var id = req.params.id;
    var policy = req.body;
    
    pap.set(id, policy).then(function(p) {
        res.status(200).json(p).end();
    }, function(e) {
        console.log(e);
        res.status(403).json({ err: e }).end();
    });
}

function setProp(req, res) {
    var id = req.params.id;
    var property = req.params.property;
    var policy = req.body;

    if(property === undefined)
        property = "";
    
    pap.set(id, property, policy).then(function(p) {
        res.status(200).json(p).end();
    }, function(e) {
        console.log(e);
        res.status(403).json({ err: e }).end();
    });
}

function del(req, res) {
    var id = req.params.id;

    pap.del(id).then(function(p) {
        res.status(200).json(p).end();
    }, function(e) {
        console.log(e);
        res.status(403).json({ err: e }).end();
    });
}

function delProp(req, res) {
    var id = req.params.id;
    var property = req.params.property;

    if(property === undefined)
        property = "";

    pap.del(id, property).then(function(p) {
        res.status(200).json(p).end();
    }, function(e) {
        console.log(e);
        res.status(403).json({ err: e }).end();
    });
}

module.exports = {
    init: init
};
