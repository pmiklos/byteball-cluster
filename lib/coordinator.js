/*jslint node: true */
"use strict";

const cluster = require("./cluster.js");

const workers = new Map();

function addOrUpdateWorker(worker) {
    if (workers.has(worker)) {
        clearTimeout(workers.get(worker).evictionTimer);
    }

    workers.set(worker, {
        evictionTimer: setTimeout(() => {
            workers.delete(worker);
            console.log("Worker removed: " + worker);
        }, 35000)
    });
}

function join(worker) {
    addOrUpdateWorker(worker);
    console.log('Worker joined: ' + worker);
}

function healthz(worker) {
    addOrUpdateWorker(worker);
    console.log('Healthz: ' + worker);
}

function forEachWorker(callback) {
    workers.forEach((_, worker) => callback(worker));
}

function sendAll(message, callback) {
    if (workers.size == 0) {
        return callback({
            type: "error",
            message: "No workers"
        });
    }
    forEachWorker((worker) => cluster.send(worker, message, callback));
}


cluster.on("healthz", healthz);

module.exports.join = join;
module.exports.forEachWorker = forEachWorker;
module.exports.send = cluster.send;
module.exports.sendAll = sendAll;
module.exports.listen = cluster.listen;
module.exports.on = cluster.on;
