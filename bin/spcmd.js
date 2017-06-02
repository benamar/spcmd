#!/usr/bin/env node --harmony

'use strict';

const Program = require('commander');
const Package = require('../package');

process.on('uncaughtException', function (err) {
  console.log(err);
})

Program
  .version(`${Package.name}/v${Package.version}`)
  .option('-u, --username [user name]', 'office365 account user name or user email')
  .option('-p, --password [user password]', 'office365 account password')
  .option('-h, --hostUrl [host site url]', 'host site url');

const isArg = (a) => ['commands', 'parent', 'options', 'Command', 'Option', 'rawArgs', 'args']
  .filter(k => k == a).length === 0 && !a.startsWith('_');

const addArgKeys = (obj, m = {}) => {
  Object.keys(obj).filter(isArg).map(k => m[k] = obj[k]);
  Object.keys(obj.parent).filter(isArg).map(k => m[k] = obj.parent[k]);
  return m;
};
const getOptions = (args, o) => (addArgKeys(o, {
  name: o._name,
  args: args,
  username: o.parent.username,
  url: o.parent.hostUrl,
  password: o.parent.password,
  silent: o.parent.silent,
  help: o.parent.help,
  version: o.parent.version,
  o: JSON.stringify(o._args)
}));

const execCmd = (nameArgs, options) => {
  const opts = getOptions(nameArgs, options);
  let Command = require(`../src/commands/${options._name}`);
  new Command(opts).run(opts).then(() => process.exit(0)).catch(
    () => process.exit(1)
  );
}

Program
  .command('login <hostSiteUrl> -u username -p password')
  //.command('get [options] <shareFile> <localFilePath>')
  .description(` get a file and shows its content or saves it`)
  .action(function (hostSiteUrl, options) {
    execCmd({ hostSiteUrl }, options);
  });

Program
  .command('logout')
  //.command('get [options] <shareFile> <localFilePath>')
  .description(` get a file and shows its content or saves it`)
  .action(function (options) {
    execCmd({}, options);
  });

Program
  .command('get <remoteFile> [localFile]')
  .description(` get a file and shows its content or saves it`)
  .action(function (remoteFile, localFile, options) {
    execCmd({ remoteFile, localFile }, options);
  });
Program
  .command('rm <remoteFile>')
  .description(` remove a file`)
  .action(function (remoteFile, options) {
    execCmd({ remoteFile }, options);
  });

Program
  .command('put <localFile> [remoteFolder] ')
  .description(` put a file on sharepoint server`)
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
/*
 if ( ! cmd ) return;

 let Command = require( `../src/commands/${cmd.name}` );
 new Command( cmd ).run().then( () => process.exit( 0 ) ).catch(
 () => process.exit( 1 )
 );
 */
