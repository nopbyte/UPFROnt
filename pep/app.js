var express = require('express');
var bodyParser = require('body-parser');

var pep = require("./api.js");

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
    
    app.post("/declassify", declassify);
    
    return app;
}

function declassify(req, res) {
    var details = req.body;
    
    if(details.obj && details.trg) {
        (function() {
            if(!details.objRecord  && !details.trgPolicy) {
                return pep.declassify(details.obj, details.trg)
            }
            else if(details.objRecord && details.trgPolicy)
                return pep.declassify(details.obj, details.objRecord, details.trg, details.trgPolicy);
        })().then(function(r) {
            res.status(200).json(r).end();
        }, function(e) {
            console.log("e: ", e);
            res.status(500).json({err: e}).end();
        });
    } else {
        res.status(400).json(r).end();
    }
}

module.exports = {
    init: init
};
