'use strict';

const
  fs = require( 'fs' ),

  xml2js          = require( 'xml2js'         ),
  concat          = require( 'concat-stream'  ),
  request         = require( 'request'        ),
  istextorbinary  = require( 'istextorbinary' ),
  spsave = require("spsave").spsave,

  Command = require( './command' ),
  Login   = require( `./login`   ),
  Parser  = require( './parser'  );

module.exports = class GetFile extends Command {
  run () {
    return new Login( this ).run({
      silent      : true,
      credentials : this.credentials
    }).then( jar => put( this, jar ) );
  }
}

function put ( context, storedData ) {
  return new Promise( ( resolve, reject ) => {
    if ( ! storedData ) {
      console.log('has no stored data, not logged in!')
      return resolve();
    }
    let
      url          = Parser.getUrl( context.args ),
      relative_url = Parser.getUrl( context.args, { relative : true } ),
      filepath     = context.args[ 1 ],
      folder     = context.args[ 2 ];


    ! context.silent && console.log( `Uploading file`, filepath,' to folder',folder ,'...');
    var spsave = require("spsave").spsave;
    var coreOptions = {
      siteUrl: url+relative_url,
      notification: true,
      checkin: true,
      checkinType: 1
    };

    //getFileByUrl
    var fileOptions = {
      folder: `Documents partages/${folder||''}`,
      glob: filepath,
    };

    const creds = {
      username: context.credentials.username || "XXXXYYYY",
      password: context.credentials.password || "XXXXYYZZ"
    };
    return spsave(coreOptions, creds, fileOptions)
      .then(function(){
        //console.log('saved');
        resolve();
      })
      .catch(function(err){
        console.log(err);
        resolve();
      });



  });
}

function parse_request_error ( response ) {
  let default_msg = 'Could not download file.';
  return new Promise( resolve => {
    if ( ! response.headers[ 'content-type' ].includes( 'application/xml' ) ) {
      return resolve( default_msg );
    }
    response.pipe( concat( buffer => {
      xml2js.parseString(
        buffer.toString(), { explicitArray : false }, ( err, result ) =>
          resolve( err ? default_msg : result[ 'm:error' ][ 'm:message' ]._ )
      );
    }));
  });
}
