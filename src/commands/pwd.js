'use strict';

const
  fs = require( 'fs' ),

  xml2js          = require( 'xml2js'         ),
  concat          = require( 'concat-stream'  ),
  request         = require( 'request'        ),
  sprequest       = require('sp-request'      ),
  istextorbinary  = require( 'istextorbinary' ),
  FileSaver_1 = require("spsave/lib/src/core/FileSaver"),
  spsave = require("spsave").spsave,

  Command = require( './command' ),
  Login   = require( `./login`   );
  const Url = require('url');

module.exports = class Pwd extends Command {
  run (opts) {
    this.options = opts;
    return new Login( this ).run({
      silent      : true,
      credentials : this.credentials
    }).then( stored => pwd( this, stored.data ) );
  }
}

function pwd ( context, storedData ) {
  return new Promise( ( resolve, reject ) => {
    if ( ! storedData ) {
      console.error('has no stored data, not logged in!')
      return resolve();
    }
    console.log('Host url : '.blue.bold,storedData.hostBaseUrl);
    console.log('Username : '.blue.bold,storedData.username);
    console.log('Site url  : '.blue.bold,storedData.relative_urlSite);
    //console.log('data',storedData)
  });
}

