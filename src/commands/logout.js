'use strict';

const
  Command = require( './command'      ),
  Cookie  = require( '../util/storage' );

module.exports = ( context ) =>{
  return Cookie.clear(global.creds.sessionKey).then( cleared => {
    ! context.silent && console.error(
      cleared ? 'Logged out.' : 'Already logged out.'
    );
  });
}
