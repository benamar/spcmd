'use strict';

const
  fs = require( 'fs' ),

  xml2js          = require( 'xml2js'         ),
  concat          = require( 'concat-stream'  ),
  request         = require( 'request'        ),
  sprequest       = require('sp-request'      ),
  istextorbinary  = require( 'istextorbinary' ),
  urljoin = require('url-join'),
  FileSaver_1 = require("spsave/lib/src/core/FileSaver"),
  spsave = require("spsave").spsave,

  Command = require( './command' ),
  Login   = require( `./login`   );
  const Url = require('url');


function get ( context ) {
  const {storedData,args,siteHostUrl,sharedDocuments,jsonFormat} = context;
  return new Promise( ( resolve, reject ) => {
    if ( ! storedData ) {
      console.error('has no stored data, not logged in!')
      return resolve();
    }else {
      //console.log(context',context);
    }

    let sharedDocs = typeof sharedDocuments === 'string'?sharedDocuments:storedData.sharedDocuments;
    const relative_urlSite = siteHostUrl||storedData.relative_urlSite;

    const url = urljoin(storedData.hostBaseUrl, relative_urlSite).replace(/[/]+$/g,'');
    let remoteFile = args.remoteFile || "";
    const urlFile = urljoin(urljoin(relative_urlSite,sharedDocs),remoteFile).replace(/^[/]+/g,'/');

    const fileRestUrl = url + '/_api/web/GetFileByServerRelativeUrl(@FileUrl)/$value'  +
    ("?@FileUrl='" + encodeURIComponent(urlFile) + "'");



    request({
      method:'get',
      url : fileRestUrl,
      headers : {
        Cookie : storedData.cookie
      }
    }).on( 'error', err => {
      console.error('get error');
      console.error( `${err.host} ${err.code}`.red.bold );
      reject( err );
    })
      .on( 'response', response => {
        //console.log("resp received");
        if ( response.statusCode !== 200 ) {
          parse_request_error( response ).then( msg => {
            console.error( msg.red.bold );
            if ( response.statusCode === 403 ) {
              // FIXME: re-login if access denied
              console.error("access denied : (this also occur when probably when you need to relog in)")
            }
            reject( msg );
          });
          return;
        }
        const filepath = context.args.localFile;
        if ( context.args.localFile ) {
          console.error("opening file ",filepath);
          response.pipe(
            fs.createWriteStream( filepath ).on( 'finish', () => {
              ! context.silent && console.error(
                `Saved to ${filepath} (${fs.statSync( filepath ).size} B).`
              )
              resolve();
            })
          );
          return;
        }
        //console.log("to stdout");
        response.pipe( concat( buffer =>
          istextorbinary.isText( undefined, buffer, ( err, is_text ) => {
            console.error( err || is_text
              ? buffer.toString()
              : 'Not going to show a binary file. Run the command to save it as a file.'
            );
            resolve();
          })
        ));


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


module.exports = get;
