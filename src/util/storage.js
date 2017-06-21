'use strict';

const
  fs            = require( 'fs'            ),
  path          = require( 'path'          ),
  child_process = require( 'child_process' ),
  crypto        = require( 'crypto'        ),

  storage_path = path.join(
    process.env.HOME_SESSION_PATH || process.env.HOME || process.env.USERPROFILE || process.env.HOMEPATH,
    '.sharepoint-file-$session'
  ),
  cookie_file_path = path.join( storage_path, 'cookie_data.json' ),
  algorithm        = 'aes-256-ctr';

let request, getmac;
try {
  request = require( 'request' );
  getmac  = require( 'getmac' );
}
catch ( err ) {}

module.exports = class Storage {
  static restore (key) {
    return restore(key);
  }

  static save ( url, payload) {
    return save( url, payload );
  }

  static clear (key) {
    return clear(key);
  }
}

function restore (key) {
  return new Promise( resolve =>
    fs.readFile( cookie_file_path.replace('$session',key), 'utf8', ( err, data ) => {
      if ( err ) {
        return resolve();
      }
      decrypt( data ).then(
        data => resolve( {data} )
      ).catch( () => resolve() );
    })
  );
}


function save ( key, data ) {
  //data = { url : url, data};
  return encrypt( Object.assign({key},data) ).then( encrypted => new Promise( resolve =>
    fs.mkdir( storage_path.replace('$session',key), () =>
      fs.writeFile( cookie_file_path.replace('$session',key), encrypted, err =>
        resolve( err ? undefined : {data })
      )
    )
  ));
}

function clear (key) {
  return new Promise( ( resolve, reject ) =>
    fs.stat( storage_path.replace('$session',key), error => {
      if ( error ) {
        return resolve();
      }

      let rm = process.platform.startsWith( 'win' ) ? 'rmdir /s/q' : 'rm -rf';
      child_process.exec( `${rm} ${storage_path.replace('$session',key)}`, error => {
        if ( error ) {
          console.error( 'Cookie.clear error', error );
          return reject( error );
        }
        resolve( true );
      });
    })
  );
}

function encrypt ( data ) {
  return getMac().then( address => {
    let
      cipher  = crypto.createCipher( algorithm, address ),
      crypted = cipher.update( JSON.stringify( data ), 'utf8', 'hex' );
    crypted += cipher.final( 'hex' );
    return crypted;
  });
}

function decrypt ( data ) {
  return getMac().then( address => {
    let
      decipher = crypto.createDecipher( algorithm, address ),
      dec      = decipher.update( data, 'hex', 'utf8' );
    dec += decipher.final( 'utf8' );
    return JSON.parse( dec );
  });
}

function getMac () {
  return new Promise( ( resolve, reject ) => getmac.getMac( ( err, address ) =>
    err ? reject( err ) : resolve( address.split( ':' ).join( 'x' ) )
  ));
}
