# Emit

The `emit` module adds `client->server` and `server->client` event emitting to
Primus.

## Installation

The module is released under the name `primus-emit`:

```
npm install --save primus-emit
```

The `--save` flags tells `npm` to automatically add the package and it's
installed version as dependency.

## Adding it to Primus

The module should be used through Primus's plugin system. In the following
examples we assume that your server has been setup as:

```js
'use strict';

var Primus = require('primus')
  , server = require('http').createServer();
  , primus = new Primus(server, { transformer: 'websockets' });
```

Now that the server and Primus instance has been created we can add the plugin
with the server. Adding plugins is done with the `primus.use` method:

```js
primus.user('emit', require('primus-emit'));
```

And that is everything that you need. The module doesn't require any
configuration.

If you are manually saving the compiled Primus client to disk make sure you
include the plugins before calling the `primus.save`, `primus.library` or
`primus.Socket` methods or properties as you will be compiling the client file
**without** the added plugins.

## Usage

There are a couple exceptions on the events that you can emit between the server
and client. We automatically blacklist reserved event names. This ensures that
you cannot accidentally emit the `end` event on the client and close the
connection on the server etc. The blacklisted events are all events that are
prefixed with `incomming:` and `outgoing:` as they are used by Primus internally
and all events client or server emits. See https://github.com/primus/primus#events
for an overview of all events that are emitted by Primus.

### Server

To emit an event from the server to the client you can simply call the `emit`
method:

```js
primus.on('connection', funciton connection(spark) {
  spark.emit('event-name', 'arguments');

  //
  // To receive events, simply add a listenern for it.
  //
  spark.on('custom-event', function custom(data, another, arg) {
    assert.equal(data.foo, 'foo');
    assert.equal(another, 1);
    assert.equal(arg, 'bar');

    this.emit('foo', 'bar');
  });
});
```

### Broadcasting

If you want to send an event to every connected client on your server you can
simply do that by iterating over the connections.

```js
primus.forEach(function (spark) {
  spark.emit('broadcast', 'event');
});
```

### Client

Sending events on the client is just as simple as on the server.

```js
var primus = new Primus('http://localhost:port');

//
// We can listen to events that are emitted from the server.
//
primus.on('event-name', function (arg) {
  assert.equal(arg, 'arguments');

  //
  // Or emit our own events to the server.
  //
  this.emit('custom-event', { foo: 'foo' }, 1, 'bar');
});

primus.on('foo', function (bar) {
  assert.equal(bar, 'bar');
  primus.emit('foo', bar);
});
```

## License

MIT
