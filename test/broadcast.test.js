describe('broadcast', function () {
  'use strict';

  var server, Socket, http, port = 1024
    , emit = require('../broadcast')
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
  });
});
