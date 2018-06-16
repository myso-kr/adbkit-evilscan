'use strict';

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _os = require('os');

var _os2 = _interopRequireDefault(_os);

var _ip = require('ip');

var _ip2 = _interopRequireDefault(_ip);

var _evilscan = require('evilscan');

var _evilscan2 = _interopRequireDefault(_evilscan);

var _adb = require('adb');

var _adb2 = _interopRequireDefault(_adb);

var _client = require('adbkit/lib/adb/client');

var _client2 = _interopRequireDefault(_client);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new _bluebird2.default(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return _bluebird2.default.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var NetScannerPromise = function NetScannerPromise(options) {
  return new _bluebird2.default(function (resolve, reject) {
    var result = [];
    var scanner = new _evilscan2.default(options);
    scanner.on('error', reject);
    scanner.on('result', function (data) {
      return result.push(data);
    });
    scanner.on('done', function () {
      return resolve(result);
    });
    scanner.run();
  });
};

var PORT_BASE = 15037;
var trackClients = {};
var trackDevices = _client2.default.prototype.trackDevices;
_client2.default.prototype.trackDevices = function (callback) {
  var _this = this;

  return _bluebird2.default.resolve().then(_asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3() {
    var tracker, handler, repeater;
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.next = 2;
            return trackDevices.apply(_this);

          case 2:
            tracker = _context3.sent;

            handler = function () {
              var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(network, port) {
                var adb;
                return regeneratorRuntime.wrap(function _callee$(_context) {
                  while (1) {
                    switch (_context.prev = _context.next) {
                      case 0:
                        adb = trackClients[network.ip] = trackClients[network.ip] || _adb2.default.createClient(port);
                        return _context.abrupt('return', adb.connect(network.ip, network.port).then(function (device) {
                          return tracker.emit('add', _lodash2.default.assign({ adb: adb }, network, device));
                        }).catch(function () {}));

                      case 2:
                      case 'end':
                        return _context.stop();
                    }
                  }
                }, _callee, _this);
              }));

              return function handler(_x, _x2) {
                return _ref2.apply(this, arguments);
              };
            }();

            repeater = function repeater() {
              var networks = _lodash2.default.reduce(_os2.default.networkInterfaces(), function (o, networks) {
                var network = _lodash2.default.find(networks, { family: 'IPv4', internal: false });
                return network ? o.concat([network.address + '/24']) : o;
              }, []);
              _bluebird2.default.map(networks, function () {
                var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(subnet) {
                  var devices;
                  return regeneratorRuntime.wrap(function _callee2$(_context2) {
                    while (1) {
                      switch (_context2.prev = _context2.next) {
                        case 0:
                          _context2.next = 2;
                          return NetScannerPromise({ target: subnet, port: '5555', status: 'O' });

                        case 2:
                          devices = _context2.sent;
                          return _context2.abrupt('return', _bluebird2.default.map(devices, function (device, offset) {
                            if (device.status == 'open') return handler(device, PORT_BASE + offset);
                          }));

                        case 4:
                        case 'end':
                          return _context2.stop();
                      }
                    }
                  }, _callee2, _this);
                }));

                return function (_x3) {
                  return _ref3.apply(this, arguments);
                };
              }()).finally(function () {
                return setTimeout(repeater, 5000);
              });
            };

            setTimeout(function () {
              return _bluebird2.default.map(_this.listDevices(), function (device, offset) {
                return handler(device, PORT_BASE + offset);
              }).then(function () {
                return repeater();
              });
            });
            return _context3.abrupt('return', tracker);

          case 7:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, _this);
  }))).nodeify(callback);
};