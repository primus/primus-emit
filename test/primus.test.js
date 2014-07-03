describe('emit', function () {
  'use strict';

  var server, Socket, http, port = 1024
    , assume = require('assume')
    , Primus = require('primus')
    , emit = require('../');

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

    it('doesnt die when we do a regular write', function (next) {
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

    it('doesnt die when we do a regular write', function (next) {
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
});
