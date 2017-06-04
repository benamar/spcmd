'use strict';

const
  Sharepoint = require('sharepoint-auth'),
  read = require('read'),
  spauth = require('node-sp-auth'),
  Cache = require('node-sp-auth/lib/src/utils/Cache'),
  CacheItem_1 = require('node-sp-auth/lib/src/utils/CacheItem'),

  Command = require('./command'),
  Storage = require('../util/storage'),
  colors = require('colors'),
  Url = require('url');

const query = (read_opts) =>
  new Promise((resolve, reject) =>
    read(read_opts, (err, result) => err ? reject() : resolve(result))
  );

let global_creds;

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
      let _credentials = { hostBaseUrl: context.hostBaseUrl, relative_urlSite: context.relative_urlSite };
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
  const creds = context.credentials;// || context.options.args && context.options.args.hostSiteUrl || context.options.hostSiteUrl;
  return new Promise((resolve, reject) => {
    return Storage.restore().then(storedData => {
        if (storedData) {
          //console.error('login check: user logged in. storedData',storedData);
          if (context.options.name == 'login') {
            console.error('Already logged in'.magenta.bold);
            console.error('Please log out if you intends to change user'.gray);
            console.error('Note that you can change temporally the host with option -s'.gray);
          }
          resolve(storedData);
          return storedData;
        } else {
          console.error('login check: not logged.'.red.bold);

          let _credentials = {
              hostBaseUrl: creds.hostBaseUrl || storedData && storedData.data.hostBaseUrl,
              relative_urlSite: creds.relative_urlSite || storedData && storedData.data.relative_urlSite
        }
          if (context.credentials.username && !context.credentials.username.startsWith('XXXX')) {
            _credentials.username = context.username;
          }

          const authenticate = (credentials) => {
            //console.error('authenticating to url '.blue.bold, credentials.url, 'for user'.green, credentials.username, '***');
            return auth(credentials).then(result => {
              if (result && result.headers) {
                !context.silent && console.error('Logged in');
                return Storage.restore().then(resolve)
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

function auth(credentials) {
  if (!credentials.username.length || !credentials.password.length) {
    return Promise.resolve('Missing username or password.');
  }
  global_creds = credentials;

  const serverUrl = Url.resolve(credentials.hostBaseUrl, credentials.relative_urlSite);
  return spauth.getAuth(serverUrl, credentials)
    .then(function (options) {
      return options;
    })
    .catch(function (e) {
      console.error('authentication error'.red, e);
      new Error('getAuth failure', e)
    });
  //return Promise.resolve('OK');
}
function queryHost(url) {
  !url && console.error('sharepoint host url site never defined'.gray);
  return Promise.resolve(url ? url : query({
    prompt: 'host site url :'.cyan.bold
  }));
}

function query_credentials(credentials = {}) {
  ( !credentials.username || !credentials.password )
  && console.error('Please enter your Sharepoint credentials'.gray);
  return queryHost(credentials.relative_urlSite).then(relative_urlSite =>
    Promise.resolve(credentials.username ? credentials.username : query({
      prompt: 'login (Email address) :'.cyan.bold
    })).then(username =>
      Promise.resolve(credentials.password ? credentials.password : query({
        prompt: `Password ${credentials.username ? '' : '     '}:`.cyan.bold,
        silent: true,
        replace: '*'
      }))
        .then(password => ({ username, password, relative_urlSite, hostBaseUrl: credentials.hostBaseUrl })
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
/*
 { key: 'ee2d5620196387cf2a4f17477f990078',
 cookie: 'FedAuth=77u/PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz48U1A+VjIsMGguZnxtZW1iZXJzaGlwfDEwMDMzZmZmYTE1NGI3NWFAbGl2ZS5jb20sMCMuZnxtZW1iZXJzaGlwfHZhbGZhY0ByZWFjdGl2ZXRlY2gub25taWNyb3NvZnQuY29tLDEzMTQwOTg2ODQ4MDAwMDAwMCwxMzEzODQ1MDM5NTAwMDAwMDAsMTMxNDE0
 MTg4NDkxMzQ3Nzc4LDAuMC4wLjAsMixjZDc0NTlmYi0zNDE4LTRkZGYtOWVmNS01ZjY2NWUyNzI1ZDYsLFYyITEwMDMzRkZGQTE1NEI3NUEhMTMxNDA5ODY4NDgsMGQxNWY4OWQtMjA2Yy0zMDAwLWM3YzItNzQ0MzQwNzUwYzgyLDBkMTVmODlkLTIwNmMtMzAwMC1jN2MyLTc0NDM0MDc1MGM4MixFMXllSTJIUnpJRTU0OWpacTdVSkNUcVFnQlVFOGt6ME9
 sdU9VR0pTaXJDcFZmMkgvaDdGVkticmgrV3ZaeEZWelc1bGdmK3lBTDJwSDVBSmRDM25GenY1SE51d1JjaU9CUWdlb2UvcGdUVm11QmozRithTUZudkJUTWQvTHdGR0JraVVPOHYzV2ozbW1ubFM2YXBMN3N6QndJbW44L3N3S1FXYkVPcytmVUJQbzhUdklvZDhEOU0rZk9ldVltWFdteC9pT1IzUXRPeUo5YWlmMjdnMWFOVy80T2RvWllia2NYTjdMQ0ppM2
 FVYVB3Y1VsVWRwREtRd3Fwc3ZEY1BTdmJCc1lwSVJpNlhsMkczUGFiYXE4OFQ1L0Y3UFRzU3drVy9KaDFBci9pMndlSHdzdXROUzA5dXZUbzVGM3p3YjRRWkY4aGtMNk43RlpGc29KNUhFZ1E9PTwvU1A+; rtFa=akMRXD66G9CA4SwncGRqUKlGHyYJC2v/LOmNw7iqFpFDeE9lq0MwOCnzCa9mYsW3vyDt9snTKUjdZDW5B6mmgOOZPvMmAaLF0tA+hDAoW9
 J0Z6Cy+l7DAn1hp7g2hZBd52kLYUSATt79CklZeDEaoOCTjScAjY26G7RnYHikpxC3da6Ep1NompXfuAfFvCY7ziMbGWXdXVOm6+mcBCi2+Ea0GU0W+6Q/7uidx4SXv3sp918RujmcCxBW8U7ebkCLvnnzJJJ7w7skqEdWLKrSsfcbNOCbxQQqHtQUbEyEzRJH2qobPvkM4n0MNOJiTTuQhzCnuZOdLJ7e7wJTcHDQhkvvAbD2wqyt7yslsga9yZNEPI22BgoHG
 ZFnJAc79VUEIAAAAA==',
 expiration: 86336,
 url: 'https://reactivetech.sharepoint.com/sites/valfacprojets/' }

 */
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
  Storage.save(key, { cookie, expiration,
    username: global_creds.username,
    hostBaseUrl: global_creds.hostBaseUrl,
    relative_urlSite:global_creds.relative_urlSite,

}).
  then(saveddata => {
    done = true;
  });
  require('deasync').loopWhile(() => !done);
};
