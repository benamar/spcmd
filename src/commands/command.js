'use strict';

const
  _args        = Symbol( 'args'        ),
  _silent      = Symbol( 'silent'      ),
  _credentials = Symbol( 'credentials' ),
  _options = Symbol( 'options' );

module.exports = class Command {
  constructor ( cmd ) {
    this[ _args   ]      = cmd.args;
    this[ _silent ]      = cmd.silent;
    this[ _options ]      = cmd;
    this[ _credentials ] = {
      username : cmd.username,
      password : cmd.password
    };
  }

  get args   () { return this[ _args ]; }

  get silent () { return this[ _silent ]; }
  set silent ( value ) { this[ _silent ] = value; }

  get credentials () { return this[ _credentials ]; }
  set credentials ( value ) { this[ _credentials ] = value; }
}
