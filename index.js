'use strict';

/**
 * The client-side plugin for Primus which adds EventEmitter functionality.
 *
 * @param {Primus} primus The initialised Primus connection.
 * @api public
 */
exports.client = function client(primus) {
  var toString = Object.prototype.toString
    , emit = primus.emit;

  primus.transform('incoming', function incoming(packet) {
    var data = packet.data;

    if (
         this !== primus                                // Incorrect context.
      || 'object' !== typeof data                       // Events are objects.
      || !~toString.call(data.emit).indexOf(' Array]')  // Not an emit object.
    ) {
      return;
    }

    //
    // Check if we've received an event that is already used internally.
    // We use our previously saved `emit` function to emit the event so we
    // prevent recursion and message flood.
    //
    if (!this.reserved(data.emit[0])) emit.apply(primus, data.emit);

    return false;
  });

  primus.emit = function emitter(event) {
    if (
         primus.reserved(event)
      || 'newListener' === event
      || 'removeListener' === event
    ) return emit.apply(this, arguments);

    primus.write({ emit: Array.prototype.slice.call(arguments, 0) });
    return true;
  };
};

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

    if (
         !(this instanceof Spark)     // Incorrect context.
      || 'object' !== typeof data     // Events are objects.
      || !Array.isArray(data.emit)    // Not an emit object.
    ) {
      return;
    }

    //
    // Check if we've received an event that is already used internally.
    // We use our previously saved `emit` function to emit the event so we
    // prevent recursion and message flood.
    //
    if (!this.reserved(data.emit[0])) emit.apply(this, data.emit);

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
