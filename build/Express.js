'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var express = require('express'),
    Component = require('@naujs/component'),
    _ = require('lodash'),
    path = require('path'),
    filters = require('./filters');

var Express = (function (_Component) {
  _inherits(Express, _Component);

  _createClass(Express, null, [{
    key: 'app',
    value: function app(_app) {
      return new this(_app);
    }
  }]);

  function Express(app) {
    _classCallCheck(this, Express);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Express).call(this));

    _this._app = app;
    return _this;
  }

  _createClass(Express, [{
    key: 'app',
    value: function app(_app2) {
      this._app = _app2;
      return this;
    }
  }, {
    key: 'connector',
    value: function connector(_connector) {
      this._connector = _connector;
      return this;
    }
  }, {
    key: 'apiRoot',
    value: function apiRoot(p) {
      this._apiRoot = p;
      return this;
    }
  }, {
    key: 'use',
    value: function use(Model) {
      var _this2 = this;

      this._routers = this._routers || [];
      var endPoints = this._getEndPoints(Model);
      var router = express.Router();

      if (!this._connector) {
        throw 'Must set connector first';
      }

      _.each(endPoints, function (endPoint) {
        var route = router[endPoint.type];
        route.call(router, endPoint.path, function (req, res) {
          Model.connector = _this2._connector;

          var userInputs = _.extend({}, req.params, req.query, req.body);
          var args = endPoint.args || {};

          // based on the defined options and filter the args
          var filteredInputs = _.chain(userInputs).toPairs().map(function (pair) {
            var key = pair[0];
            var value = pair[1];

            var opts = args[key];
            if (!opts) {
              return [key, value];
            }

            if (_.isString(opts)) {
              opts = {
                type: opts
              };
            }

            if (_.isObject(opts)) {
              var filter = filters[opts.type];
              if (!filter) {
                console.warn(opts + ' is not a valid type');
                return [key, value];
              }

              value = filter(value);

              if (opts.required && value === undefined) {
                return null;
              }
            }

            return [key, value];
          }).compact().fromPairs().value();

          var diff = _.chain(userInputs).keys().difference(_.keys(filteredInputs)).value();

          if (diff.length) {
            return res.status(400).json({
              error: {
                code: 400,
                message: 'Missing required argument(s) ' + diff.join(', '),
                data: {
                  required: diff
                }
              },
              success: false,
              data: null
            });
          }

          Model.executeApi(endPoint.handler, filteredInputs).then(function (result) {
            res.json({
              data: result,
              success: true,
              error: null
            });
          }, function (error) {
            var statusCode = error.statusCode || error.code || 500;
            res.status(statusCode).json({
              error: {
                code: error.code || statusCode,
                message: error.message || error.toString(),
                data: error.data || null
              },
              success: false,
              data: null
            });
          });
        });
      });

      this._routers.push(router);

      return this;
    }
  }, {
    key: 'done',
    value: function done() {
      var _this3 = this;

      _.each(this._routers, function (router) {
        _this3._app.use(_this3._apiRoot || '/', router);
      });

      return this._app;
    }
  }, {
    key: '_buildPath',
    value: function _buildPath(Model, p) {
      var apiName = Model.getApiName();

      if (apiName.charAt(0) !== '/') {
        apiName = '/' + apiName;
      }

      return path.join(apiName, p);
    }
  }, {
    key: '_getEndPoints',
    value: function _getEndPoints(Model) {
      var _this4 = this;

      var endPoints = Model.getEndPoints();

      return _.map(endPoints, function (options, handler) {
        var methodName = options.handler || handler;
        var type = (options.type || 'get').toLowerCase();
        if (!options.path) {
          throw 'Must provide path for an end point';
        }

        var args = _.clone(options.args || {});

        return {
          handler: methodName,
          type: type,
          path: _this4._buildPath(Model, options.path),
          args: args
        };
      });
    }
  }]);

  return Express;
})(Component);

module.exports = Express;