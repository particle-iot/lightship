"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _express = _interopRequireDefault(require("express"));

var _serializeError = _interopRequireDefault(require("serialize-error"));

var _states = require("../states");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } } function _next(value) { step("next", value); } function _throw(err) { step("throw", err); } _next(); }); }; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const log = console;
const defaultConfiguration = {
  port: 9000,
  signals: ['SIGTERM']
};

var _default = userConfiguration => {
  const shutdownHandlers = [];

  const configuration = _objectSpread({}, defaultConfiguration, userConfiguration);

  const app = (0, _express.default)();
  const server = app.listen(configuration.port);
  let serverIsReady = false;
  let serverIsShuttingDown = false;
  app.get('/health', (req, res) => {
    if (serverIsShuttingDown) {
      res.status(500).send(_states.SERVER_IS_SHUTTING_DOWN);
    } else if (serverIsReady) {
      res.send(_states.SERVER_IS_READY);
    } else {
      res.status(500).send(_states.SERVER_IS_NOT_READY);
    }
  });
  app.get('/live', (req, res) => {
    if (serverIsShuttingDown) {
      res.status(500).send(_states.SERVER_IS_SHUTTING_DOWN);
    } else {
      res.send(_states.SERVER_IS_NOT_SHUTTING_DOWN);
    }
  });
  app.get('/ready', (req, res) => {
    if (serverIsReady) {
      res.send(_states.SERVER_IS_READY);
    } else {
      res.status(500).send(_states.SERVER_IS_NOT_READY);
    }
  });

  const signalNotReady = () => {
    if (serverIsShuttingDown) {
      log.warn('server is already shutting down');
      return;
    }

    if (serverIsReady === false) {
      log.warn('server is already is a NOT READY state');
    }

    log.info('signaling that the server is not ready to accept connections');
    serverIsReady = false;
  };

  const signalReady = () => {
    if (serverIsShuttingDown) {
      log.warn('server is already shutting down');
      return;
    }

    log.info('signaling that the server is ready to accept connections');
    serverIsReady = true;
  };

  const shutdown =
  /*#__PURE__*/
  function () {
    var _ref = _asyncToGenerator(function* () {
      if (serverIsShuttingDown) {
        log.warn('server is already shutting down');
        return;
      }

      serverIsReady = false;
      serverIsShuttingDown = true;

      for (const shutdownHandler of shutdownHandlers) {
        try {
          yield shutdownHandler();
        } catch (error) {
          log.error({
            error: (0, _serializeError.default)(error)
          }, 'shutdown handler produced an error');
        }
      }

      log.info('all shutdown handlers have run to completion; proceeding to terminate the Node.js process');
      server.close(); // eslint-disable-next-line no-process-exit

      process.exit();
    });

    return function shutdown() {
      return _ref.apply(this, arguments);
    };
  }();

  for (const signal of configuration.signals) {
    process.on(signal, () => {
      log.info({
        signal
      }, 'received a shutdown signal');
      shutdown();
    });
  }

  return {
    registerShutdownHandler: shutdownHandler => {
      shutdownHandlers.push(shutdownHandler);
    },
    shutdown,
    signalNotReady,
    signalReady
  };
};

exports.default = _default;
//# sourceMappingURL=createLightship.js.map