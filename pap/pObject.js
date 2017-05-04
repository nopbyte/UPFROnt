"use strict";

var clone = require("clone");
var equal = require("deep-equal");
var uuid = require("uuid");
var w = require("winston");
w.level = process.env.LOG_LEVEL;

var emptyObject = {
    /* The policy for the object itself */
    s: null,
    /* All properties in this object which carry policies */
    p: {}
};

/**
 * Constructs a new PolicyObject from another object or creates an empty PolicyObject
 * @constructor
 * @param {undefined|null|Object} object - Another PolicyObject from which to copy relevant properties.
 */
function PolicyObject(object) {
    /**
     * @memberof PolicyObject
     * @instance
     * @member {object} dictionary A dictionary of all policies contained in this PolicyObject */
    this.d = {};
    /**
     * @memberof PolicyObject
     * @instance
     * @member {object} entity The effective policy used when the entity represented by this object becomes active */
    this.e = null;
    /**
     * @memberof PolicyObject
     * @instance
     * @member {object} object The structure of the PolicyObject */
    this.o = clone(emptyObject);

    if(object) {
        if((object.d && !object.o) ||
           (!object.d && object.o))
            w.error("Cannot construct PolicyObject from invalid object");

        if(object.d && object.o) {
            this.d = object.d;
            this.o = object.o;
        }
        if(object.e)
            this.e = object.e;
    }
};

function getDictionaryPolicy(dict, ref) {
    if(dict.hasOwnProperty(ref))
        return dict[ref].p;
    else
        return null;
};

function addDictionaryRef(dict, policy) {
    var max = 0;

    for(var ref in dict) {
        ref = parseInt(ref);
        if(ref >= max)
            max = ref + 1;

        if(equal(dict[ref].p, policy)) {
            dict[ref].c++;
            return ref;
        }
    }

    var ref = max;
    dict[ref] = { p: policy, c: 1 };

    return ref;
};

function delDictionaryRef(dict, ref) {
    if(dict.hasOwnProperty(ref)) {
        dict[ref].c--;
        if(dict[ref].c === 0)
            delete dict[ref];
    }
};

/**
 * @public
 * @function
 * @param {string} property - The path to the property for which the policy should be deleted.
 * @param {Object} policy - The object representing the policy to be set for the specified property path.
 * @returns {null|Object} Returns null if the property path did not specify a policy before or the policy object replaced by the new one.
 */
PolicyObject.prototype.setProperty = function(property, policy) {
    var oldPolicy = null;

    if(property === "") {
        var pRef = addDictionaryRef(this.d, policy);
        if(this.s !== null) {
            oldPolicy = clone(getDictionaryPolicy(this.d, this.s));
            delDictionaryRef(this.d, curObj.s);
        }
        this.s = pRef;
    } else {
        var pRef = addDictionaryRef(this.d, policy);
        var curObj = this.o;

        var p = property
            .replace(/\[/, ".")
            .replace(/\]./g, ".")
            .replace(/\]$/g, "");

        var attrNames = p.split(".");
        while(attrNames.length) {
            var n = attrNames.shift();
            if(curObj.p.hasOwnProperty(n)) {
                curObj = curObj.p[n];
            } else {
                curObj.p[n] = clone(emptyObject);
                curObj = curObj.p[n];
            }
        }

        if(curObj.s !== null) {
            oldPolicy = clone(getDictionaryPolicy(this.d, curObj.s));
            delDictionaryRef(this.d, curObj.s);
        }
        curObj.s = pRef;
    }

    return oldPolicy;
};

/** @function
 * @param {string} property - The path to the property for which the policy should be deleted.
 * @returns {null|Object} Returns null if the property path does not exist or the object representing the policy set which was removed from this property path.
 */
PolicyObject.prototype.delProperty = function(property) {
    var oldPolicyRef = null;

    if(property === "") {
        oldPolicyRef = this.s;
        this.s = null;
    } else {
        var curObj = this.o;
        var parObj = null;

        var p = property
            .replace(/\[/, ".")
            .replace(/\]./g, ".")
            .replace(/\]$/g, "");

        var attrNames = p.split(".");
        var n = null;
        while(attrNames.length) {
            n = attrNames.shift();
            if(curObj.p.hasOwnProperty(n)) {
                parObj = curObj;
                curObj = curObj.p[n];
            } else
                return;
        }

        if(curObj.s !== null) {
            oldPolicyRef = curObj.s;
            curObj.s = null;
            if(parObj !== null && Object.keys(curObj.p).length === 0) {
                delete parObj.p[n];
            }
        }
    }

    var oldPolicy = clone(getDictionaryPolicy(this.d, oldPolicyRef));
    delDictionaryRef(this.d, oldPolicyRef);

    return oldPolicy;
};

/** @function
 * @param {string} property - The path to the property for which a policy should be derived.
 * @returns {null|Object} Returns null if no policy was set for this property path or the object representing the policy set for this property path.
 */
PolicyObject.prototype.getProperty = function(property) {
    w.info("PAP.pObject.getProperty("+JSON.stringify(this, "",2)+", '" + property+"')");

    if(property === "") {
        return this.s;
    } else {
        var curObj = this.o;

        var p = property
            .replace(/\[/, ".")
            .replace(/\]./g, ".")
            .replace(/\]$/g, "");

        var attrNames = p.split(".");
        var effPolicy = curObj.s;
        while(attrNames.length) {
            var n = attrNames.shift();
            if(curObj.p.hasOwnProperty(n)) {
                curObj = curObj.p[n];
                effPolicy = curObj.s;
            } else
                return getDictionaryPolicy(this.d, effPolicy);
        }

        if(curObj.s === null)
            return getDictionaryPolicy(this.d, effPolicy);
        else
            return getDictionaryPolicy(this.d, curObj.s);
    }
};

module.exports = PolicyObject;
