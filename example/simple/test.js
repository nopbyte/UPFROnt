
function genF(i) {
    var str = "G"+i;
    return function() {
        return Promise.resolve("G"+i);
    };
};

var a = []
for(var j = 0; j < 100; j++) {
    var f = genF(j);
    a.push(f);
}

var values = [];
a.reduce(function(p, n) {
    return p.then(function(v) {
        values.push(v);
        return n();
    });
}, Promise.resolve(0)).then(function() {
    console.log(JSON.stringify(values));
});
