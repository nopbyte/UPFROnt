var w = require('winston');
w.level = process.env.LOG_LEVEL;

module.exports = function(Lock) {
    "use strict";

    var IsOwnerLock = function(lock) {
        // call the super class constructor
        Lock.call(this, lock);
    };

    Lock.registerLock("isOwner", IsOwnerLock);

    IsOwnerLock.prototype = Object.create(Lock.prototype);

    IsOwnerLock.prototype.copy = function() {
        var c = new IsOwnerLock(this);
        return c;
    }

    IsOwnerLock.prototype.handleUser = function(subject, object, isStatic) {
        if(isStatic) {
            throw new Error("handleUser for hasId lock is not supported in static analysis yet");
        } else {
            if((subject.type == '/user' && object.data.hasOwnProperty('owner') &&
                object.data.owner == subject.data.id && !this.not) ||
               ((subject.type != '/user' || !object.data.hasOwnProperty('owner') ||
                 object.data.owner != subject.data.id) && this.not))
                return { result : true, conditional : false };
            else
                return { result : false, conditional : false, lock : this };
        }
    };

    IsOwnerLock.prototype.handleSensor = function(subject, object, isStatic) {
        if(isStatic) {
            throw new Error("handleSO for hasId lock is not supported in static analysis yet");
        } else {
            if((subject.type == '/sensor' && object.data.hasOwnProperty('owner') &&
                object.data.owner == subject.data.id && !this.not) ||
               ((subject.type != '/sensor' || !object.data.hasOwnProperty('owner') ||
                 object.data.owner != subject.data.id) && this.not))
                return { result : true, conditional : false };
            else
                return { result : false, conditional : false, lock : this };
        }
    };

    IsOwnerLock.prototype.handleAny = function(subject, object, isStatic) {
        if(isStatic) {
            throw new Error("IsOwnerLock.prototype.handleAny is not supported in static analysis, yet.");
        } else {
            var r = this.handleSensor(subject, object, isStatic);
            if(this.not) {
                if(!r.result)
                    return { result : false, conditional : false, lock : this };
            } else
                if(r.result)
                    return r;

            r = this.handleUser(subject, object, isStatic);
            if(this.not) {
                if(!r.result)
                    return { result : false, conditional : false, lock : this };
            } else {
                if(r.result)
                    return r;
            }
            
            if(this.not)
                return { result : true, conditional : false };
            else
                return { result : false, conditional : false, lock : this };
        }
    };

    IsOwnerLock.prototype.isOpen = function(context, scope) {
	w.debug("IsOwnerLock.prototype.isOpen");
	if(valid(context)) {
	    if(!context.isStatic) {
		if(valid(context.entity) && valid(context.entity.data) && valid(context.entity.data.id)) {
                    var other = context.getOtherEntity();
                    if(valid(other) && valid(other.data) && valid(other.data.owner)) {
		        if(context.entity.data.id === other.data.owner)
			    return Promise.resolve({open: true, cond: false});
		        else
			    return Promise.resolve({open: false, cond: false, lock: this});
                    } else {
                        return Promise.reject(new Error("IsOwnerLock.prototype.isOpen cannot evaluate opposing entities in message context or context is invalid!"));
                    }
		} else {
                    return Promise.reject(new Error("IsOwnerLock.prototype.isOpen current context is invalid!"));
                }
	    } else {
		return Promise.reject(new Error("IsOwnerLock.prototype.isOpen not implemented for static analysis, yet"));
	    }
	} else
	    return Promise.reject(new Error("IsOwnerLock.prototype.isOpen: Context is invalid"));
    };

    IsOwnerLock.prototype.lub = function(lock) {
        if(this.eq(lock))
		    return this;
        else {
            if(this.lock == lock.lock)
                return Lock.closedLock();
            else
                return null;
        }
    };

    function valid(o) {
	return o !== undefined && o !== null;
    }
}
