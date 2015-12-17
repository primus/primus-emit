describe('emit', function () {
  'use strict';

  var server, Socket, http, port = 1024
    , EE = require('events').EventEmitter
    , assume = require('assume')
    , Primus = require('primus')
    , emit = require('./');

  beforeEach(function each(next) {
    http = require('http').createServer();
    server = new Primus(http);

    server.use('emit', emit);
    Socket = server.Socket;

    http.listen(++port, next);
  });

  afterEach(function each(next) {
    server.destroy(next);
  });

  describe('server', function () {
    it('emits events', function (next) {
      server.on('connection', function (spark) {
        spark.on('foo', next);
      });

      var socket = new Socket('http://localhost:'+ port);
      socket.emit('foo');
    });

    it('receives arguments', function (next) {
      server.on('connection', function (spark) {
        spark.on('foo', function (a, b, c, d) {
          assume(a).to.be.a('number');
          assume(a).to.equal(1);

          assume(b).to.be.a('string');
          assume(b).to.equal('foo');

          assume(c).to.be.a('object');
          assume(c.bar).to.equal('moo');

          assume(d).to.be.a('array');
          assume(d.length).to.equal(1);
          assume(d[0]).to.equal(1);

          next();
        });
      });

      var socket = new Socket('http://localhost:'+ port);
      socket.emit('foo', 1, 'foo', { bar: 'moo' }, [1]);
    });

    it('has the correct context', function (next) {
      server.on('connection', function (spark) {
        spark.on('foo', function () {
          assume(arguments.length).to.equal(0);
          assume(this).to.equal(spark);

          next();
        });
      });

      var socket = new Socket('http://localhost:'+ port);
      socket.emit('foo');
    });

    it('doesn\'t die when we do a regular write', function (next) {
      server.on('connection', function (spark) {
        spark.on('data', function (msg) {
          if (msg === 'foo') next();
        });
      });

      var socket = new Socket('http://localhost:'+ port);

      socket.write({ object: 'works' });
      socket.write([ 'array', 'works' ]);
      socket.write('string works');
      socket.write(1);
      socket.write('foo');
    });
  });

  describe('client', function () {
    it('emits events', function (next) {
      server.on('connection', function (spark) {
        spark.emit('foo');
      });

      var socket = new Socket('http://localhost:'+ port);
      socket.on('foo', next);
    });

    it('receives arguments', function (next) {
      server.on('connection', function (spark) {
        spark.emit('foo', 1, 'foo', { bar: 'moo' }, [1]);
      });

      var socket = new Socket('http://localhost:'+ port);
      socket.on('foo', function (a, b, c, d) {
        assume(a).to.be.a('number');
        assume(a).to.equal(1);

        assume(b).to.be.a('string');
        assume(b).to.equal('foo');

        assume(c).to.be.a('object');
        assume(c.bar).to.equal('moo');

        assume(d).to.be.a('array');
        assume(d.length).to.equal(1);
        assume(d[0]).to.equal(1);

        next();
      });
    });

    it('has the correct context', function (next) {
      server.on('connection', function (spark) {
        spark.emit('foo');
      });

      var socket = new Socket('http://localhost:'+ port);
      socket.on('foo', function () {
        assume(arguments.length).to.equal(0);
        assume(this).to.equal(socket);

        next();
      });

    });

    it('doesn\'t die when we do a regular write', function (next) {
      server.on('connection', function (spark) {
        spark.write({ object: 'works' });
        spark.write([ 'array', 'works' ]);
        spark.write('string works');
        spark.write(1);
        spark.write('foo');
      });

      var socket = new Socket('http://localhost:'+ port);

      socket.on('data', function (msg) {
        if (msg === 'foo') next();
      });
    });
  });

  describe('incoming message transformer', function () {
    it('bails out if called with a wrong `this` value (server)', function (next) {
      server.on('connection', function (spark) {
        spark.transforms(server, new EE(), 'incoming', { emit: ['foo'] });
        next();
      });

      new Socket('http://localhost:'+ port);
    });

    it('bails out if called with a wrong `this` value (client)', function (next) {
      var socket = new Socket('http://localhost:'+ port);

      socket.transforms(socket, new EE(), 'incoming', { emit: ['foo'] });
      next();
    });
  });
});

describe('broadcast', function () {
  'use strict';

  var server, Socket, http, port = 1024
    , EE = require('events').EventEmitter
    , emit = require('./broadcast')
    , assume = require('assume')
    , Primus = require('primus');

  beforeEach(function each(next) {
    http = require('http').createServer();
    server = new Primus(http);

    server.use('broadcast', emit);
    Socket = server.Socket;

    http.listen(++port, next);
  });

  afterEach(function each(next) {
    server.destroy(next);
  });

  describe('server', function () {
    it('receives events', function (next) {
      server.on('foo', function () { next (); });

      var socket = new Socket('http://localhost:'+ port);
      socket.emit('foo');
    });

    it('also receives the data event globally', function (next) {
      server.on('data', function () { next (); });

      var socket = new Socket('http://localhost:'+ port);
      socket.write('foo');
    });

    it('receives arguments', function (next) {
      server.on('foo', function (spark, a, b, c, d) {
        assume(spark).to.be.instanceOf(server.Spark);

        assume(a).to.be.a('number');
        assume(a).to.equal(1);

        assume(b).to.be.a('string');
        assume(b).to.equal('foo');

        assume(c).to.be.a('object');
        assume(c.bar).to.equal('moo');

        assume(d).to.be.a('array');
        assume(d.length).to.equal(1);
        assume(d[0]).to.equal(1);

        next();
      });

      var socket = new Socket('http://localhost:'+ port);
      socket.emit('foo', 1, 'foo', { bar: 'moo' }, [1]);
    });

    it('has the correct context', function (next) {
      server.on('foo', function () {
        assume(arguments.length).to.equal(1);
        assume(this).to.equal(server);

        next();
      });

      var socket = new Socket('http://localhost:'+ port);
      socket.emit('foo');
    });

    it('also prefixes the data event with a spark', function (next) {
      server.on('data', function (spark, a) {
        assume(spark).to.be.instanceOf(server.Spark);

        assume(a).to.be.a('number');
        assume(a).to.equal(1);

        next();
      });

      var socket = new Socket('http://localhost:'+ port);
      socket.write(1);
    });
  });

  describe('incoming message transformer', function () {
    it('bails out if called with a wrong `this` value', function (next) {
      server.on('data', function () {
        next();
      });

      server.on('foo', function () {
        next();
      });

      server.on('connection', function (spark) {
        spark.transforms(server, new EE(), 'incoming', { emit: ['foo'] });
        next();
      });

      new Socket('http://localhost:'+ port);
    });
  });
});
