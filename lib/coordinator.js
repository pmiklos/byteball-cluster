/*jslint node: true */
"use strict";

const cluster = require("./cluster.js");

const workers = new Set();

function join(worker) {
    workers.add(worker);
    console.log('Worker joined: ' + worker);
}

function healthz(worker) {
    workers.add(worker);
    console.log('Healthz: ' + worker);
}

function forEachWorker(callback) {
    workers.forEach((worker) => callback(worker));
}

function sendAll(message, callback) {
    forEachWorker((worker) => cluster.send(worker, message, callback));
}


cluster.on("healthz", healthz);

module.exports.join = join;
module.exports.forEachWorker = forEachWorker;
module.exports.send = cluster.send;
module.exports.sendAll = sendAll;
module.exports.listen = cluster.listen;
module.exports.on = cluster.on;