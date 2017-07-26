var express = require('express');
var bodyParser = require('body-parser');

var pdp = require("./api");

var errorHandler = function (err, req, res, next) {
    console.log(err.stack);
    res.status(400).json({error: "unexpected_error", message: err.toString()});
}

function init() {
    var app = express();

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: true}));
    app.use(errorHandler);

    app.post("/write", checkWrite);
    app.post("/read", checkRead);
    
    return app;
}

function checkWrite(req, res) {
    var details = req.body;
    
    if(details.obj && details.sub) {
        (function() {
            if(!details.objPolicy  && !details.subPolicy) {
                return pdp.checkWrite(details.sub, details.obj)
            }
            else if(details.objPolicy && details.subPolicy)
                return pdp.checkWrite(details.sub, details.subPolicy, details.obj, details.objPolicy);
        })().then(function(r) {
            res.status(200).json(r).end();
        }, function(e) {
            res.status(500).json({err: e}).end();
        });
    } else {
        res.status(400).json(r).end();
    }
}

function checkRead(req, res) {
    var details = req.body;
    
    if(details.obj && details.sub) {
        (function() {
            if(!details.objPolicy  && !details.subPolicy) {
                return pdp.checkRead(details.sub, details.obj)
            }
            else if(details.objPolicy && details.subPolicy)
                return pdp.checkRead(details.sub, details.subPolicy, details.obj, details.objPolicy);
        })().then(function(r) {
            res.status(200).json(r).end();
        }, function(e) {
            res.status(500).json({err: e}).end();
        });
    } else {
        res.status(400).json(r).end();
    }
}

module.exports = {
    init: init
};
