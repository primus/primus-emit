describe('emit', function () {
  'use strict';

  var chai = require('chai')
    , expect = chai.expect;

  var server, Socket, http, port = 1024
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
          expect(a).to.be.a('number');
          expect(a).to.equal(1);

          expect(b).to.be.a('string');
          expect(b).to.equal('foo');

          expect(c).to.be.a('object');
          expect(c.bar).to.equal('moo');

          expect(d).to.be.a('array');
          expect(d.length).to.equal(1);
          expect(d[0]).to.equal(1);

          next();
        });
      });

      var socket = new Socket('http://localhost:'+ port);
      socket.emit('foo', 1, 'foo', { bar: 'moo' }, [1]);
    });

    it('has the correct context', function (next) {
      server.on('connection', function (spark) {
        spark.on('foo', function () {
          expect(arguments.length).to.equal(0);
          expect(this).to.equal(spark);

          next();
        });
      });

      var socket = new Socket('http://localhost:'+ port);
      socket.emit('foo');
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
        expect(a).to.be.a('number');
        expect(a).to.equal(1);

        expect(b).to.be.a('string');
        expect(b).to.equal('foo');

        expect(c).to.be.a('object');
        expect(c.bar).to.equal('moo');

        expect(d).to.be.a('array');
        expect(d.length).to.equal(1);
        expect(d[0]).to.equal(1);

        next();
      });
    });

    it('has the correct context', function (next) {
      server.on('connection', function (spark) {
        spark.emit('foo');
      });

      var socket = new Socket('http://localhost:'+ port);
      socket.on('foo', function () {
        expect(arguments.length).to.equal(0);
        expect(this).to.equal(socket);

        next();
      });
    });
  });
});
