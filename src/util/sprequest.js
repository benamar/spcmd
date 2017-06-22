/**
 * Created by bbelarbi on 22/06/2017.
 */
"use strict";
var request = require('request-promise');
//var Promise = require('bluebird');
var util = require('util');
var spauth = require('node-sp-auth');
var crypto = require('crypto');
var Cache_1 = require('./Cache');

module.exports.requestDigestCache = new Cache_1.Cache();
function create(credentials, environment) {
  if (environment) {
    Object.assign(credentials, environment);
  }
  var coreRequest = function (options) {
    return new Promise(function (resolve, reject) {
      options.resolveWithFullResponse = true;
      options.simple = true;
      options.headers = options.headers || {};
      Object.assign(options.headers, {
        'Accept': 'application/json;odata=verbose',
        'Content-Type': 'application/json;odata=verbose'
      },options.headers);
      Object.assign(options,{
        json: true,
        strictSSL: false
      },options);
      //console.log('options',options)
      spauth.getAuth(options.url, credentials)
        .then(function (data) {
          Object.assign(options.headers, data.headers);
          Object.assign(options, data.options);
          return options;
        })
        .then(request)
        .then(function (response) {
          //console.log('response',response)
          resolve(response);
        })
        .catch(reject);
    });
  };
  var spRequestFunc = function (options, coreOptions) {
    if (typeof options === 'string') {
      var url = options;
      var newOptions = void 0;
      if (coreOptions) {
        newOptions = coreOptions;
        newOptions.url = url;
      }
      else {
        newOptions = {
          url: url
        };
      }
      if (!newOptions.method) {
        newOptions.method = 'GET';
      }
      return coreRequest(newOptions);
    }
    else {
      if (!options.method) {
        options.method = 'GET';
      }
      return coreRequest(options);
    }
  };
  spRequestFunc.requestDigest = async function (siteUrl) {
    try {
      var url = siteUrl.replace(/\/$/, '');
      var cacheKey = crypto.createHash('md5').update(util.format('%s@%s', url, JSON.stringify(credentials))).digest('hex');
      var cachedDigest = exports.requestDigestCache.get(cacheKey);
      if (cachedDigest) {
        console.log('cache has a digest', cachedDigest);
        return cachedDigest;
      }
      const response = await  spRequestFunc.post(url + "/_api/contextinfo");
      var digest = response.body.d.GetContextWebInformation.FormDigestValue;
      var timeout = parseInt(response.body.d.GetContextWebInformation.FormDigestTimeoutSeconds, 10);
      exports.requestDigestCache.set(cacheKey, digest, timeout - 30);
      return digest;
    }catch(e){
      throw new Error(e.message);
    }
  };
  ['get', 'post', 'delete'].forEach(function (method) {
    spRequestFunc[method] = function (options, coreOptions) {
      if (typeof options === 'string') {
        if (coreOptions) {
          coreOptions.method = method.toUpperCase();
        }
        else {
          coreOptions = {
            method: method.toUpperCase()
          };
        }
        return spRequestFunc(options, coreOptions);
      }
      if (typeof options !== 'string') {
        options.method = method.toUpperCase();
      }
      return spRequestFunc(options);
    };
  });
  return spRequestFunc;
}
module.exports.create = create;
