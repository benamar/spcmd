'use strict';

const
  Sharepoint = require('sharepoint-auth'),
  read = require('read'),
  spauth = require('node-sp-auth'),
  Cache = require('node-sp-auth/lib/src/utils/Cache'),
  CacheItem_1 = require('node-sp-auth/lib/src/utils/CacheItem'),

  Command = require('./command'),
  Storage = require('../util/storage'),
  colors  = require('colors');
  const query = (read_opts) =>
  new Promise((resolve, reject) =>
    read(read_opts, (err, result) => err ? reject() : resolve(result))
  );

var current_url ;
module.exports = class Login extends Command {
  run(opts) {
    opts = opts || {};
    this.options = opts;
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
    return Storage.restore(context.url).then(storedData => {
      if (storedData || context.authenticating) {
        //console.error('user logged in.');
        //!context.authenticating && context.options && context.options.name=='login' && console.error('Already logged in.(to change user logout first)');
        resolve(storedData);
        return;
      }
      context.authenticating = true;
      let _credentials = {url:context.url};
      if (!context.username.startsWith('XXXX')) {
        _credentials.username = context.username;
      }

      return query_credentials(_credentials).then(credentials =>
        auth(context.url, credentials).then(result => {
            if (result) {
              //!context.silent && console.error('Logged in.');
              resolve(result);
            } else {
              console.error('could not log in!');
              reject('auth error : could not log in');
            }
          })
      );
    });
  });
}


function login(context) {
  const url = context.credentials.url;// || context.options.args && context.options.args.hostSiteUrl || context.options.hostSiteUrl;
  return new Promise((resolve, reject) => {
     return Storage.restore(url).then(storedData => {
        if (storedData) {
          //console.error('login check: user logged in.');
          if(context.options.name=='login')
          {
            console.error('Already logged in'.magenta.bold);
            console.error('Please log out if you intends to change user'.gray);
            console.error('Note that you can change temporally the host with option -s'.gray);
          }
          resolve(storedData);
          return storedData;
        } else {
          console.error('login check: not logged.'.red.bold);
          let _credentials = {url:url||storedData && storedData.data.url}
          if (context.credentials.username && !context.credentials.username.startsWith('XXXX')) {
            _credentials.username = context.username;
          }

          const authenticate = (credentials) => {
            console.error('authenticating to url '.blue.bold,credentials.url,'for user'.green, credentials.username, '***');
            return auth(credentials.url, credentials).then(result => {
              if (result && result.headers) {
                !context.silent && console.error('Logged in');
                return Storage.restore(url).then(resolve)
              } else {
                //console.error('Error occured'.red.bold,result);
                reject('server authentication problem')
              }
            });


          };
          //console.error('*authenticating on url ',url);
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

  if (!credentials.username.length || !credentials.password.length) {
    return Promise.resolve('Missing username or password.');
  }

  return spauth.getAuth(serverUrl, credentials)
    .then(function (options) {
      return options;
    })
    .catch(function (e) {
      console.error('authentication error'.red,e);
      new Error('getAuth failure', e)
    });
  //return Promise.resolve('OK');
}
function queryHost(url){
  !url && console.error('sharepoint host url site never defined'.gray);
  return Promise.resolve(url ? url : query({
    prompt: 'host site url :'.cyan.bold
  }));
}

function query_credentials(credentials = {}) {
  ( !credentials.username || !credentials.password )
  && console.error('Please enter your Sharepoint credentials'.gray);
  return queryHost(credentials.url).then(url =>
    (current_url = url) &&
    Promise.resolve(credentials.username ? credentials.username : query({
    prompt: 'login (Email address) :'.cyan.bold
  })).then(username =>
    Promise.resolve(credentials.password ? credentials.password : query({
      prompt: `Password ${credentials.username ? '' : '     '}:`.cyan.bold,
      silent: true,
      replace: '*'
    }))
      .then(password => ({ username, password ,url})
      )
    )
  );
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
  const keyHash = this.getHashKey(key);
  var cacheItem = this._cache[key];
  let storedValue = false;
  let done = false;
  Storage.restore(keyHash).then(storeResult => {
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
  if (storedValue && storedValue.data)
    cacheItem = createCacheItem(storedValue.data.cookie, storedValue.data.expiration);
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

Cache.Cache.prototype.set = function (url, cookie, expiration) {
  const key = this.getHashKey(url);
  let cacheItem = createCacheItem(cookie, expiration);
  this._cache[key] = cacheItem;
  let done = false;
  Storage.save(key, { cookie, expiration ,url:current_url}).then(saveddata => {
    done = true;
  });
  require('deasync').loopWhile(() => !done);
};
