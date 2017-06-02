'use strict';

const
  fs = require( 'fs' ),

  xml2js          = require( 'xml2js'         ),
  concat          = require( 'concat-stream'  ),
  request         = require( 'request'        ),
  spsave = require("spsave").spsave,

  Command = require( './command' ),
  Login   = require( `./login`   );
  //const URL = require('url').URL;

module.exports = class GetFile extends Command {
  run (opts) {
    this.options = opts;
    return new Login( this ).run({
      silent      : true,
      credentials : this.credentials
    }).then( jar => put( this, jar ) );
  }
}

function put ( context, storedData ) {
  return new Promise( ( resolve, reject ) => {
    try {
      if (!storedData) {
        console.error('has no stored data, not logged in!')
        return resolve();
      }else{
        //console.error('storedData url',storedData.data.data.url);
      }
      //const urlParser = new URL(context.options.hostUrl);
      const url = context.options.hostUrl||storedData.data.data.url;
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
      //console.error('fileOptions:', fileOptions);
      //console.error('coreOptions:', coreOptions);

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

