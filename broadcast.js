'use strict';

/**
 * The server-side plugin for Primus which adds EventEmitter functionality.
 *
 * @param {Primus} primus The initialised Primus server.
 * @api public
 */
exports.server = function server(primus) {
  var Spark = primus.Spark
    , emit = Spark.prototype.emit;

  primus.transform('incoming', function incoming(packet) {
    var data = packet.data;

    if (!(this instanceof Spark)) return;

    if (
         'object' !== typeof data     // Events are objects.
      || !Array.isArray(data.emit)    // Not an emit object.
    ) {
      primus.emit.apply(primus, ['data', this].concat(data));
      return;
    }

    //
    // Check if we've received an event that is already used internally. We
    // splice in a reference to the spark as first argument that will be
    // received by the emitted function.
    //
    if (!primus.reserved(data.emit[0])) {
      data.emit.splice(1, 0, this);
      primus.emit.apply(primus, data.emit);
    }

    return false;
  });

  Spark.prototype.emit = function emitter(event) {
    if (
         this.reserved(event)
      || 'newListener' === event
      || 'removeListener' === event
    ) return emit.apply(this, arguments);

    this.write({ emit: Array.prototype.slice.call(arguments, 0) });
    return true;
  };
};

//
// The client interface can be exactly the same, we just don't need it anymore.
//
exports.client = require('./').client;
