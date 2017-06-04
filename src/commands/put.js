'use strict';

const
  fs = require( 'fs' ),

  xml2js          = require( 'xml2js'         ),
  concat          = require( 'concat-stream'  ),
  request         = require( 'request'        ),
  spsave = require("spsave").spsave,

  Command = require( './command' ),
  Login   = require( `./login`   );
  const Url = require('url');

module.exports = class GetFile extends Command {
  run (opts) {
    this.options = opts;
    return new Login( this ).run({
      silent      : true,
      credentials : this.credentials
    }).then( stored => put( this, stored.data ) );
  }
}

function put ( context, storedData ) {
  return new Promise( ( resolve, reject ) => {
    try {
      if (!storedData) {
        console.error('has no stored data, not logged in!')
        return resolve();
      }else{
        //console.error('storedData url',storedData.url);
      }
      //const urlParser = new URL(context.options.hostUrl);
      console.log('context.options',context.options);
      const url=Url.resolve(storedData.hostBaseUrl,context.options.credentials.relative_urlSite || storedData.relative_urlSite );
      const
        folder = context.args.remoteFolder;

      !context.silent && console.error(`Uploading file`, context.args.localFile, ' to folder', folder, '...');
      var spsave = require("spsave").spsave;
      var coreOptions = {
        siteUrl: url,
        notification: true,
        checkin: true,
        checkinType: 1
      };

      //getFileByUrl
      var fileOptions = {
        folder: `Documents partages/${folder || ''}`,
        glob: context.args.localFile,
      };

      const creds = {
        username: context.credentials.username || "XXXXYYYY",
        password: context.credentials.password || "XXXXYYZZ"
      };

      return spsave(coreOptions, creds, fileOptions)
        .then(function () {
          //console.error('saved');
          resolve();
        })
        .catch(function (err) {
          console.error(err);
          resolve();
        });

    }catch(e){console.error(e)};

  });
}

