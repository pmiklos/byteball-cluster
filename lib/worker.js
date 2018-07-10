/*jslint node: true */
"use strict";

const cluster = require("./cluster.js");

function join(clusterInvitationCode, callback) {
    cluster.acceptInvitation(clusterInvitationCode, (err, coordinator) => {
        if (err) return console.error(err);
        setTimeout(() => healthz(coordinator), 30000);
        callback(null, coordinator);
    });
}

function healthz(coordinator) {
    cluster.send(coordinator, {
        method: "healthz"
    });
    setTimeout(() => healthz(coordinator), 30000);
}

function pong(coordinator, message, callback) {
    callback(null, {
        result: "pong"
    });
}


cluster.on("ping", pong);

module.exports.join = join;
module.exports.on = cluster.on;
module.exports.listen = cluster.listen;