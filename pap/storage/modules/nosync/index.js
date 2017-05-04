function init(_settings, handle) {
    return Promise.resolve();
};

function lock(id) {
    return Promise.resolve(function empty() {} );
}

function mark() {
    // do nothing
}

module.exports = {
    init: init,
    mark: mark,
    lock: lock
};
