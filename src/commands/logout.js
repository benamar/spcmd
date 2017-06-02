'use strict';

const
  Command = require( './command'      ),
  Cookie  = require( '../util/storage' );

module.exports = class Logout extends Command {
  run () {
    return logout( this );
  }
}

function logout ( context ) {
  return Cookie.clear().then( cleared => {
    ! context.silent && console.error(
      cleared ? 'Logged out.' : 'Already logged out.'
    );
  });
}
