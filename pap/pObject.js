"use strict";

var clone = require("clone");
var equal = require("deep-equal");
var uuid = require("uuid");
var w = require("winston");
w.level = process.env.LOG_LEVEL;

var emptyObject = {
    /* The policy for the object itself */
    s: null,
    /* The meta policy, i.e. policy controlling the policy */
    m: null,
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
 * @param {Boolean} meta - Decides whether the policy is the meta policy or the regular policy
 * @returns {null|Object} Returns null if the property path did not specify a policy before or the policy object replaced by the new one.
 */
PolicyObject.prototype.setProperty = function(property, policy, meta) {
    var oldPolicy = null;
    var toSet = 's';
    
    if(meta === true)
        toSet = 'm'

    if(property === "") {
        var pRef = addDictionaryRef(this.d, policy);
        if(this[toSet] !== null) {
            oldPolicy = clone(getDictionaryPolicy(this.d, this[toSet]));
            delDictionaryRef(this.d, curObj[toSet]);
        }
        this[toSet] = pRef;
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

        if(curObj[toSet] !== null) {
            oldPolicy = clone(getDictionaryPolicy(this.d, curObj[toSet]));
            delDictionaryRef(this.d, curObj[toSet]);
        }
        curObj[toSet] = pRef;
    }

    return oldPolicy;
};

/** @function
 * @param {string} property - The path to the property for which the policy should be deleted.
 * @returns {null|Object} Returns null if the property path does not exist or the object representing the policy set which was removed from this property path.
 */
PolicyObject.prototype.delProperty = function(property, meta) {
    var oldPolicyRef = null;
    var toSet = 's';

    if(meta === true)
        toSet = 'm';

    if(property === "") {
        oldPolicyRef = this[toSet];
        this[toSet] = null;
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

        if(curObj[toSet] !== null) {
            oldPolicyRef = curObj[toSet];
            curObj[toSet] = null;
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
PolicyObject.prototype.getProperty = function(property, meta) {
    w.info("PAP.pObject.getProperty("+JSON.stringify(this, "",2)+", '" + property+"')");
    var toSet = 's';

    if(meta === true)
        toSet = 'm';

    if(property === "") {
        return this[toSet];
    } else {
        var curObj = this.o;

        var p = property
            .replace(/\[/, ".")
            .replace(/\]./g, ".")
            .replace(/\]$/g, "");

        var attrNames = p.split(".");
        var effPolicy = curObj[toSet];
        while(attrNames.length) {
            var n = attrNames.shift();
            if(curObj.p.hasOwnProperty(n)) {
                curObj = curObj.p[n];
                effPolicy = curObj[toSet];
            } else
                return getDictionaryPolicy(this.d, effPolicy);
        }

        if(curObj[toSet] === null)
            return getDictionaryPolicy(this.d, effPolicy);
        else
            return getDictionaryPolicy(this.d, curObj[toSet]);
    }
};

/** @function
 * @returns {Object} Returns a map of full property paths to policies.
 */
PolicyObject.prototype.getPPMap = function(meta, start) {
    var toGet = 's';
    
    if(meta === true)
        toGet = 'm';
    
    if(property === "") {
        return this[toGet];
    } else {
        var curObj = this.o;
        var effPolicy = curObj[toGet];
        
        for(var obj in curObject.p) {
            var n = attrNames.shift();
            if(curObj.p.hasOwnProperty(n)) {
                curObj = curObj.p[n];
                effPolicy = curObj[toGet];
            } else
                return getDictionaryPolicy(this.d, effPolicy);
        }

        if(curObj[toGet] === null)
            return getDictionaryPolicy(this.d, effPolicy);
        else
            return getDictionaryPolicy(this.d, curObj[toGet]);
    }
}

module.exports = PolicyObject;
