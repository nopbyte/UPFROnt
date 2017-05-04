var x = {
    a: 1,
    b: {
        x: 2,
        y: 3
    },
    c: {
        u: 4,
        v: 5,
        w: 6
    },
    d: "abc"
};


function walker(obj) {
    var str = "";
    var promises = [];
    
    for(var p in obj) {
        if(obj.hasOwnProperty(p)) {
            if(typeof obj[p] == 'object') {
                promises.push(new Promise(function(resolve, reject){
                    walker(obj[p]).then(function(s) {
                        resolve(p+": { "+ s + "}");
                    })
                }));
            } else {
                promises.push(Promise.resolve(p+": "+obj[p]));
            }
        }
    }

    return new Promise(function(resolve, reject) {
        Promise.all(promises).then(function(values) {
            var str = "";
            for(var i in values) {
                str += values[i] + ", ";
            }
            console.log(str);
            resolve(str);
        });
    });
}

walker(x).then(console.log);
