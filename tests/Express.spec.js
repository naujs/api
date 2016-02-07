/*eslint max-nested-callbacks:0*/

'use strict';

var express = require('express')
  , app = null
  , request = require('supertest')
  , _ = require('lodash')
  , util = require('@naujs/util')
  , ActiveRecord = require('@naujs/active-record')
  , Express = require('../').Express
  , Promise = util.getPromise()
  , Component = require('@naujs/component');

class DummyModel extends ActiveRecord {};

DummyModel.properties = {
  'name': {
    type: DummyModel.Types.string
  }
};
DummyModel.modelName = 'dummy';

class DummyConnector {
  read() {}
  create() {}
  update() {}
  delete() {}
}

function sendRequest(type, url, data) {
  data = data || {};
  return new Promise((resolve, reject) => {
    request(app)[type](url).query(data).expect('Content-Type', /json/).end((error, res) => {
      if (error) return reject(error);
      if (res.status >= 300) return reject(res);
      resolve(res);
    });
  });
}

var helpers = {
  get: function(url, data) {
    return sendRequest('get', url, data);
  },

  post: function(url, data) {
    return sendRequest('post', url, data);
  },

  put: function(url, data) {
    return sendRequest('put', url, data);
  },

  del: function(url, data) {
    return sendRequest('del', url, data);
  }
};

var expectedError = new Error('test');
expectedError.code = 40000;
expectedError.statusCode = 400;
var specs = [
  {
    type: 'get',
    path: '/api/dummies',
    expectedMethod: 'read',
    expectedData: [
      {
        id: 1
      },
      {
        id: 2
      }
    ]
  },
  {
    type: 'get',
    path: '/api/dummies/1',
    expectedMethod: 'read',
    expectedArgs: [{where: {id: 1}, limit: 1}, expectedConnectorOptions({primaryKeyValue: 1})],
    connectorData: [
      {
        id: 1
      }
    ],
    expectedData: {
      id: 1
    }
  },
  {
    type: 'post',
    path: '/api/dummies',
    data: {
      name: 'test'
    },
    expectedMethod: 'create',
    expectedArgs: [{name: 'test'}, expectedConnectorOptions()],
    expectedData: {
      id: 1,
      name: 'test'
    }
  },
  {
    type: 'put',
    path: '/api/dummies/1',
    data: {
      name: 'test'
    },
    expectedMethod: 'update',
    expectedArgs: [{where: {id: 1}}, {name: 'test'}, expectedConnectorOptions({primaryKeyValue: 1})],
    expectedData: {
      id: 1,
      name: 'test'
    }
  },
  {
    type: 'del',
    path: '/api/dummies/1',
    expectedMethod: 'delete',
    expectedArgs: [{where: {id: 1}}, expectedConnectorOptions({primaryKeyValue: 1})],
    expectedData: {
      id: 1
    }
  }
];

function expectedConnectorOptions(params) {
  return _.extend({
    'primaryKey': 'id',
    'primaryKeyValue': undefined,
    'primaryKeyType': 'number',
    'properties': {
      'name': {
        'type': 'string'
      }
    },
    'modelName': 'dummy',
    'pluralName': 'dummies'
  }, params);
}

describe('Express', () => {
  var connector;
  beforeEach(() => {
    app = express();
    connector = new DummyConnector();
    Express.app(app)
          .connector(connector)
          .apiRoot('/api')
          .use(DummyModel)
          .done();
  });

  describe('Router', () => {
    it('should have all the default routes', () => {
      var routes = _.chain(app._router.stack[2].handle.stack).map(function(stack) {
        return stack.route;
      }).value();

      expect(routes.length).toEqual(5);

      expect(routes[0].path).toEqual('/dummies/');
      expect(routes[1].path).toEqual('/dummies/:id');
      expect(routes[2].path).toEqual('/dummies/');
      expect(routes[3].path).toEqual('/dummies/:id');
      expect(routes[4].path).toEqual('/dummies/:id');

      expect(routes[0].methods.get).toBe(true);
      expect(routes[1].methods.get).toBe(true);
      expect(routes[2].methods.post).toBe(true);
      expect(routes[3].methods.put).toBe(true);
      expect(routes[4].methods.delete).toBe(true);
    });
  });

  describe('REST', () => {
    var deferred;

    _.each(specs, (spec) => {
      describe(spec.type.toUpperCase() + ' ' + spec.path, () => {
        beforeEach(() => {
          deferred = util.defer();
          spyOn(connector, spec.expectedMethod).and.returnValue(deferred.promise);
        });

        it('should call #' + spec.expectedMethod, () => {
          deferred.resolve(spec.connectorData || spec.expectedData);

          return helpers[spec.type](spec.path, spec.data).then((res) => {
            expect(res.status).toEqual(200);
            expect(res.body.data).toEqual(spec.expectedData);
            expect(res.body.success).toBe(true);
            expect(res.body.error).toBe(null);

            if (spec.expectedArgs) {
              expect(connector[spec.expectedMethod]).toHaveBeenCalledWith(...spec.expectedArgs);
            } else {
              expect(connector[spec.expectedMethod]).toHaveBeenCalled();
            }
          });
        });

        it('should return correct error', () => {
          deferred.reject(expectedError);

          return helpers[spec.type](spec.path, spec.data).then(fail, (res) => {
            expect(res.status).toEqual(400);
            var error = res.body.error;
            expect(error.code).toEqual(40000);
            expect(error.message).toEqual(expectedError.message);
            expect(res.body.data).toEqual(null);
            expect(res.body.success).toBe(false);
          });
        });
      });
    });
  });
});
