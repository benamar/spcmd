'use strict';

const
  Sharepoint = require('sharepoint-auth'),
  read = require('read'),
  spauth = require('node-sp-auth'),
  Cache = require('node-sp-auth/lib/src/utils/Cache'),
  CacheItem_1 = require('node-sp-auth/lib/src/utils/CacheItem'),

  Command = require('./command'),
  Parser = require('./parser'),
  Storage = require('../util/storage')
  ;

module.exports = class Login extends Command {
  run(opts) {
    opts = opts || {};
    if (opts.silent !== undefined) {
      this.silent = opts.silent;
    }
    if (opts.credentials !== undefined) {
      this.credentials = opts.credentials;
    }
    return login(this);
  }
}

function loginCheck(context) {

  return new Promise((resolve, reject) => {
    return Storage.restore(context.url).then(data => {
      if (data || context.authenticating) {
        console.log('user logged in.');
        !gcontext.authenticating && !context.silent && console.log('Already logged in.');
        resolve(data);
        return;
      }
      context.authenticating = true;
      let _credentials = {};
      if (!context.username.startsWith('XXXX')) {
        _credentials.username = context.username;
      }
      query_credentials(_credentials).then(credentials => {
          return auth(context.url, credentials).then(result => {
            if (result) {
              !context.silent && console.log('Logged in.');
              resolve(result);
            } else {
              console.error('could not log in!');
              reject('error from auth')
            }
          })
        }
      );
    });
  });
}


function login(context) {
  //console.log('---login------- context=', context);
  const url = Parser.getUrl(context.args);
  //console.log('login enter context ', context);
  //console.log('login enter url', url);
  return new Promise((resolve, reject) => {
    return Storage.restore(url).then(data => {
        if (data) {
          console.log('login check: user logged in.');
          resolve(data);
          return data;
        } else {
          console.log('login check: not logged.');
          let _credentials = {}
          if (context.credentials.username && !context.credentials.username.startsWith('XXXX')) {
            _credentials.username = context.username;
          }

          const authenticate = (credentials) => {
            console.log('authenticating on url ',url,'with credentials', credentials.username, '***');
            return auth(url, credentials).then(result => {
              //console.log('auth returned Logged in with',result);
              if (result && result.headers) {
                !context.silent && console.log('Logged in');
                resolve(result);
              } else {
                console.error(result);
                reject('error from auth')
              }
            });


          };

          return (!context.credentials.username || !context.credentials.password ) ?
            query_credentials(context.credentials).then(credentials =>
              authenticate(credentials)
            )
            : authenticate(context.credentials);


        }

      }
    );
  })

}

function auth(serverUrl, credentials) {
  //console.log('called auth: serverUrl ', serverUrl, 'credentials', credentials);

  if (!credentials.username.length || !credentials.password.length) {
    return Promise.resolve('Missing username or password.');
  }


  return spauth.getAuth(serverUrl, credentials)
    .then(function (options) {
      return options;
    })
    .catch(function (e) {
      console.error('authentication error');
      new Error('getAuth failure', e)
    });
  //return Promise.resolve('OK');
}

function query_credentials(credentials = {}) {
  ( !credentials.username || !credentials.password )
  && console.log('Please enter your Sharepoint credentials'.gray);
  let query = (read_opts) =>
    new Promise((resolve, reject) =>
      read(read_opts, (err, result) => err ? reject() : resolve(result))
    );
  return Promise.resolve(credentials.username ? credentials.username : query({
    prompt: 'Email address :'.cyan.bold
  })).then(username =>
    Promise.resolve(credentials.password ? credentials.password : query({
      prompt: `Password ${credentials.username ? '' : '     '}:`.cyan.bold,
      silent: true,
      replace: '*'
    }))
      .then(password => ({ username: username, password: password })));
}


function createCacheItem(data, expiration) {
  let cacheItem;
  if (!expiration) {
    cacheItem = new CacheItem_1.CacheItem(data);
  }
  else if (typeof expiration === 'number') {
    var now = new Date();
    now.setSeconds(now.getSeconds() + expiration);
    cacheItem = new CacheItem_1.CacheItem(data, now);
  }
  else if (expiration instanceof Date) {
    cacheItem = new CacheItem_1.CacheItem(data, expiration);
  }
  return cacheItem;
}

Cache.Cache.prototype.get = function (key) {
  //console.log('ok*************', key);
  const keyHash = this.getHashKey(key);
  var cacheItem = this._cache[key];
  let storedValue = false;
  let done = false;
  Storage.restore(keyHash).then(storeResult => {
    //console.log('Storage.restore res=', storeResult)
    storedValue = storeResult && storeResult.data;
    if (!storedValue || !storedValue.data) {
      const username = key.split('@').reverse()[0];
      const url = key.split('@')[0];
      if (username.startsWith('XXXX')) {
        return loginCheck({ url, username }).then(data => {
          storedValue = data;
          done = true;
        });
      }
    }
    done = true;
  });
  require('deasync').loopWhile(() => !done);
 //console.log('storedValue', storedValue);
  if (storedValue && storedValue.data)
     //console.log('storedValue.data.expiration',storedValue.data.expiration,'storedValue.data.data', storedValue.data.data);
    cacheItem = createCacheItem(storedValue.data.data, storedValue.data.expiration);
  if (!cacheItem) {
    return undefined;
  }
  if (!cacheItem.expiredOn) {
    return cacheItem.data;
  }
  var now = new Date();
  if (now > cacheItem.expiredOn) {
    this.remove(key);
    return undefined;
  }
  else {
    return cacheItem.data;
  }
};

Cache.Cache.prototype.set = function (key, data, expiration) {
  var cacheItem = undefined;
  //console.log(`---> set cache  data='${data}'`);
  // console.log(`---> set cache expiration='${expiration}'`);
  key = this.getHashKey(key);
  cacheItem = createCacheItem(data, expiration);
  this._cache[key] = cacheItem;
  let done = false;
  Storage.save(key, { data, expiration }).then(saveddata => {
    //console.log('credentials saved saveddata', saveddata);
    done = true;
  });
  require('deasync').loopWhile(() => !done);
};
