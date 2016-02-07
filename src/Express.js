'use strict';

var express = require('express')
  , Component = require('@naujs/component')
  , _ = require('lodash')
  , path = require('path')
  , filters = require('./filters');

class Express extends Component {
  static app(app) {
    return new this(app);
  }

  constructor(app) {
    super();
    this._app = app;
  }

  app(app) {
    this._app = app;
    return this;
  }

  connector(connector) {
    this._connector = connector;
    return this;
  }

  apiRoot(p) {
    this._apiRoot = p;
    return this;
  }

  use(Model) {
    this._routers = this._routers || [];
    let endPoints = this._getEndPoints(Model);
    let router = express.Router();

    if (!this._connector) {
      throw 'Must set connector first';
    }

    _.each(endPoints, (endPoint) => {
      let route = router[endPoint.type];
      route.call(router, endPoint.path, (req, res) => {
        Model.connector = this._connector;

        let userInputs = _.extend({}, req.params, req.query, req.body);
        let args = endPoint.args || {};

        // based on the defined options and filter the args
        let filteredInputs = _.chain(userInputs)
          .toPairs()
          .map((pair) => {
            let key = pair[0];
            let value = pair[1];

            let opts = args[key];
            if (!opts) {
              return [key, value];
            }

            if (_.isString(opts)) {
              opts = {
                type: opts
              };
            }

            if (_.isObject(opts)) {
              let filter = filters[opts.type];
              if (!filter) {
                console.warn(`${opts} is not a valid type`);
                return [key, value];
              }

              value = filter(value);

              if (opts.required && value === undefined) {
                return null;
              }
            }

            return [key, value];
          })
          .compact()
          .fromPairs()
          .value();

        let diff = _.chain(userInputs).keys().difference(_.keys(filteredInputs)).value();

        if (diff.length) {
          return res.status(400).json({
            error: {
              code: 400,
              message: `Missing required argument(s) ${diff.join(', ')}`,
              data: {
                required: diff
              }
            },
            success: false,
            data: null
          });
        }

        Model.executeApi(endPoint.handler, filteredInputs).then((result) => {
          res.json({
            data: result,
            success: true,
            error: null
          });
        }, (error) => {
          let statusCode = error.statusCode || error.code || 500;
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

  done() {
    _.each(this._routers, (router) => {
      this._app.use(this._apiRoot || '/', router);
    });

    return this._app;
  }

  _buildPath(Model, p) {
    let apiName = Model.getApiName();

    if (apiName.charAt(0) !== '/') {
      apiName = '/' + apiName;
    }

    return path.join(apiName, p);
  }

  _getEndPoints(Model) {
    let endPoints = Model.getEndPoints();

    return _.map(endPoints, (options, handler) => {
      let methodName = options.handler || handler;
      let type = (options.type || 'get').toLowerCase();
      if (!options.path) {
        throw 'Must provide path for an end point';
      }

      let args = _.clone(options.args || {});

      return {
        handler: methodName,
        type: type,
        path: this._buildPath(Model, options.path),
        args: args
      };
    });
  }
}


module.exports = Express;
