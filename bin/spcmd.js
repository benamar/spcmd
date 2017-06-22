#!/usr/bin/env node --harmony

'use strict';
let Program;
try {
  Program = require('commander');
} catch (e) {
  console.log("module missing,please type");
  console.log("npm install");
  console.log("npm needs nodejs to be installed, you know :)");
  process.exit(1)
}
const Package = require('../package');
const Storage = require('../src/util/storage');
const colors = require('colors');
const Url = require('url');

process.on('uncaughtException', function (err) {
  console.error('uncaught',err);
})

Program
  .version(`${Package.name}/v${Package.version}`)
  .option('-u, --username [user name]', 'office365 account user name or user email')
  .option('-p, --password [user password]', 'office365 account password')
  .option('-s, --siteHostUrl [host site url]', 'override site host url')
  .option('-d, --sharedDocuments [shared Documents translation]', 'provide the shared document custom name or translation')
  .option('-k, --sessionKey [key]', 'provide the session key to store to')
  .option('-j, --jsonFormat', 'display in json format');

const isArg = (a) => ['commands', 'parent', 'options', 'Command', 'Option', 'rawArgs', 'args']
  .filter(k => k == a).length === 0 && !a.startsWith('_');

const validateFuncs = {
  siteHostUrl: (v) => v.replace(/^([^/])/g, '/$1').replace(/^[/]?(sites)?[/]?/g, '/sites/'),
  sessionKey: (v) => typeof v === 'string' && v.length > 0 ? v : 'defaultSessionKey',
}

const validate = (k, obj) => {
  const v = validateFuncs[k] && validateFuncs[k](obj[k]) || obj[k];
  //console.log('validating '.green, k, '=', obj[k], "-->".blue, v);
  return v;
}

const addArgKeys = (obj, m = {}) => {

  Object.keys(obj).filter(isArg).map(k => m[k] = validate(k, obj));
  Object.keys(obj.parent).filter(isArg).map(k => m[k] = validate(k, obj.parent));
  return m;
};
const relativeUrlPath = (_url) => {
  const r = new Url.URL(_url);
  return r.pathname;
};

const origineBaseUrl = (_url) => {
  const r = new Url.URL(_url);
  return r.origin;
};

const credentials = (o, args) => {
  let siteHostUrl = o.parent.siteHostUrl;

  let hostBaseUrl = args.loginUrl;
  let relative_urlSite;

  if (hostBaseUrl) {
    const urlSite = relativeUrlPath(hostBaseUrl);
    if (!siteHostUrl) {
      relative_urlSite = urlSite;
      hostBaseUrl = origineBaseUrl(hostBaseUrl);
    } else {
      if (urlSite.startsWith('/sites') || urlSite.startsWith('sites')) {
        console.error("Warning : host url should not have a relative path if relative site is provides".yellow.bold)
      }
    }

  }
  if (siteHostUrl) {
    if (siteHostUrl.startsWith('http')) {
      //override hostBaseUrl
      hostBaseUrl = origineBaseUrl(siteHostUrl);
      relative_urlSite = relativeUrlPath(siteHostUrl);
    } else {
      relative_urlSite = siteHostUrl;
    }
  }
  const creds = {
    username: o.parent.username || args.username,
    password: o.parent.password || args.password,
    hostBaseUrl,
    relative_urlSite,
    sharedDocuments: typeof o.parent.sharedDocuments === 'string' && o.parent.sharedDocuments || 'Documents partages',
    sessionKey: typeof o.parent.sessionKey === 'string' && o.parent.sessionKey.length > 0 ? o.parent.sessionKey : 'defaultSessionKey',
  };
  global.creds = creds;
  //console.log('creds',creds)
  return creds;
};

const getOptions = (args, o) => (addArgKeys(o, {
  name: o._name,
  args: args,
  credentials: credentials(o, args),
  silent: o.parent.silent,
  help: o.parent.help,
  version: o.parent.version,
  o: JSON.stringify(o._args)
}));

const execCmd = (namedArgs, options) => {
  const opts = getOptions(namedArgs, options);
  let Command = require(`../src/commands/${options._name}`);
  //new Command(opts).run(opts).then(() => process.exit(0)).catch(    (reason) => console.error('error',reason)||process.exit(1)  );
  return Storage.restore(global.creds.sessionKey).then(storedData => {
    opts.storedData = storedData && storedData.data;
    Command(opts, storedData && storedData.data).then(() => process.exit(0)).catch((reason) => console.error('Error:', reason.message) || process.exit(1));
  });
}

Program
  .command('login [url] [username] [password]')
  //.command('get [options] <shareFile> <localFilePath>')
  .description('login with hostSiteUrl and credentials'.green + ',\n\t\t\t\t\t\t any missing information from command line wil be prompted'.green)
  .action(function (loginUrl, username, password, options) {
    execCmd({ loginUrl, username, password }, options);
  });

Program
  .command('logout')
  //.command('get [options] <shareFile> <localFilePath>')
  .description(`logout`.green)
  .action(function (options) {
    execCmd({}, options);
  });

Program
  .command('pwd')
  //.command('get [options] <shareFile> <localFilePath>')
  .description(`show current host and site`.green)
  .action(function (options) {
    execCmd({}, options);
  });

Program
  .command('ls [remoteFolder]')
  .description(`list files in remoteFolder`.green)
  .action(function (remoteFolder, options) {
    execCmd({ remoteFolder }, options);
  });

Program
  .command('sites ')
  .description(`list all sites/subsites of current location`.green)
  .action(function (options) {
    execCmd({}, options);
  });

Program
  .command('get <remoteFile> [localFile]')
  .description(` get a file and shows its content or saves it`.green)
  .action(function (remoteFile, localFile, options) {
    execCmd({ remoteFile, localFile }, options);
  });

Program
  .command('rm <remoteFile>')
  .description(` remove a file`.green)
  .action(function (remoteFile, options) {
    execCmd({ remoteFile }, options);
  });

Program
  .command('put <localFile> [remoteFolder] ')
  .description(` put a file on sharepoint server`.green)
  .action(function (localFile, remoteFolder, options) {
    execCmd({ localFile, remoteFolder }, options);
  });

Program
  .command('*')
  .action(function (cmd) {
    console.error(`\n*\nunknown command ${cmd}!\n*\n`);
    Program.help();
    console.error(`\n*\nunknown command ${cmd}!\n*\n`);

  });

Program.parse(process.argv);
if (process.argv.length < 3) {
  console.log('missing command');
  Program.help();
}
/*
 if ( ! cmd ) return;

 let Command = require( `../src/commands/${cmd.name}` );
 new Command( cmd ).run().then( () => process.exit( 0 ) ).catch(
 () => process.exit( 1 )
 );
 */
