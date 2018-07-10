# Simple 2nd layer Byteball chat bot communication protocol.

There are two roles: a coordinator and a worker.

## Coordinator

The coordinator is a byteball chatbot that manages the group of worker bots and provides an interface to the user to communicate with the cluster.

```javascript
const eventBus = require('byteballcore/event_bus.js');
const headlessWallet = require('headless-byteball');
const cluster = require("byteball-cluster");

require('byteballcore/wallet.js');

const coordinator = cluster.Coordinator;

eventBus.on('text', coordinator.listen);

coordinator.sendAll({
    method: "hello",
    name: "Coordinator"
}, (err, response) => {
    if (err) return console.error(err.message);
    console.log(response.result);
});
```

# Worker

The worker is a byteball chat bot that performs a task instructed by the coordinator.

```javascript
const eventBus = require("byteballcore/event_bus.js");
const headlessWallet = require("headless-byteball");
const config = require("byteballcore/conf.js");
const cluster = require("byteball-cluster");
require("byteballcore/wallet.js");

const worker = cluster.Worker;

eventBus.once("headless_wallet_ready", function() {
    worker.join(config.coordinatorPairingCode, (err, coordinator) => {
        if (err) return Error(err);
        console.error("Joined computing cluster " + coordinator);
    });
});

eventBus.on("text", worker.listen);

worker.on("hello", (coordinator, message, callback) => {
    callback(null, {
        result: "Hello " + message.name
    });
});
```
