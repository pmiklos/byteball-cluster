/*jslint node: true */
"use strict";

const uuid = require("uuid/v4");
const EventEmitter = require('events').EventEmitter;
const device = require("byteballcore/device.js");

const requests = new EventEmitter();
const responses = new EventEmitter();

function addCorrespondent(hub_host, device_pubkey, pairing_secret, cb) {
    if (device_pubkey === device.getMyDevicePubKey())
        return cb("cannot pair with myself");

    device.addUnconfirmedCorrespondent(device_pubkey, hub_host, "New", function(device_address) {
        device.startWaitingForPairing(function(reversePairingInfo) {
            device.sendPairingMessage(hub_host, device_pubkey, pairing_secret, reversePairingInfo.pairing_secret, {
                ifOk: () => cb(null, device_address),
                ifError: () => cb(null, device_address)
            });
        });
    });
}

function acceptInvitation(pairingCode, callback) {
    let matches = pairingCode.match(/^(?:\w+:)?([\w\/+]+)@([\w.:\/-]+)#([\w\/+-]+)$/);
    if (!matches)
        return callback("Invalid pairing code");

    let pubkey = matches[1];
    let hub = matches[2];
    let pairing_secret = matches[3];

    if (pubkey.length !== 44)
        return callback("Invalid pubkey length");

    addCorrespondent(hub, pubkey, pairing_secret, callback);
}

function send(peer, requestStub, callback) {
    let request = Object.assign({
        id: uuid(),
        type: "request"
    }, requestStub);

    device.sendMessageToDevice(peer, "text", JSON.stringify(request), {
        ifOk: () => {
            if (callback) {
                responses.once(request.id, (err, response) => callback(err, response));
                setTimeout(() => {
                    responses.emit(request.id, { type: "timeout" }, null);
                }, 10000);
            }
        },
        ifError: (err) => { if (callback) callback(err); }
    });
}

function listen(peer, text) {
    try {
        let message = JSON.parse(text);

        console.log(text);

        if (message.type == "request") {
            requests.emit(message.method, peer, message, (err, responseStub) => {
                if (err) {
                    device.sendMessageToDevice(peer, "text", JSON.stringify({
                        id: message.id,
                        type: "error",
                        method: message.method,
                        message: err
                    }));
                    return console.error("Failed to process message: " + err);
                }

                let response = Object.assign({
                    id: message.id,
                    type: "response",
                    method: message.method
                }, responseStub);

                device.sendMessageToDevice(peer, "text", JSON.stringify(response));
            });
        }
        else if (message.type == "response") {
            responses.emit(message.id, null, message);
        }
        else if (message.type == "error") {
            responses.emit(message.id, message, null);
        }
    }
    catch (e) {
        console.error("Invalid message: " + e + "\n" + text);
    }
}

module.exports.listen = listen;
module.exports.send = send;
module.exports.acceptInvitation = acceptInvitation;
module.exports.on = (event, listener) => requests.on(event, listener);
