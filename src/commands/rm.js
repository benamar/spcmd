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
  const URL = require('url').URL;

module.exports = class GetFile extends Command {
  run (opts) {
    this.options = opts;
    return new Login( this ).run({
      silent      : true,
      credentials : this.credentials
    }).then( jar => rm( this, jar ) );
  }
}

function checkInOut ( check,context, storedData ) {
  try {
    return new Promise((resolve, reject) => {
      const url = context.options.hostUrl || storedData.data.data.url;
      const urlParser = new URL(url);
      const checkinMessage = 'checkin';
      const fileServerRelativeUrl = `${urlParser.pathname}Documents partages/${context.args.remoteFile}`;
      const fileRestUrl = url + '/_api/web/GetFileByServerRelativeUrl(@FileUrl)/$value' +
        ("?@FileUrl='" + encodeURIComponent(fileServerRelativeUrl) + "'");

      const fileRestUrls = {
        checkout: this.coreOptions.siteUrl + '/_api/web/GetFileByServerRelativeUrl(@FileUrl)/CheckOut()' +
        ("?@FileUrl='" + encodeURIComponent(fileServerRelativeUrl) + "'"),

        checkin: this.coreOptions.siteUrl +
        '/_api/web/GetFileByServerRelativeUrl(@FileUrl)/CheckIn(comment=@Comment,checkintype=@Type)' +
        ("?@FileUrl='" + encodeURIComponent(fileServerRelativeUrl) + "'&@Comment='" + (checkinMessage) + "'") +
        ("&@Type='" + this.coreOptions.checkinType + "'")
      }
      console.log('url',fileRestUrls[check]);
      request({
        method: 'post',
        url: fileRestUrls[check],
        headers: {
          Cookie: storedData.data.data.data,
        }
      }).on('error', err => {
        console.error('get error');
        console.error(`${err.host} ${err.code}`.red.bold);
        reject(err);
      })
        .on('response', response => {
          //console.log("resp received");
          if (response.statusCode !== 200) {
            parse_request_error(response).then(msg => {
              console.error(msg.red.bold);
              if (response.statusCode === 403) {
                // FIXME: re-login if access denied
                console.error("access denied : (one cause can be session expired)")
              }
              reject(msg);
            });
            return;
          }
          console.log(check, fileRestUrl, 'ok');
          response.pipe(concat(buffer =>
            istextorbinary.isText(undefined, buffer, (err, is_text) => {
              console.error(err || is_text
                ? buffer.toString()
                : 'Not going to show a binary file. Run the command to save it as a file.'
              );
              resolve();
            })
          ));

        });

    });
  }catch(e){console.log(e)}

}
function rm ( context, storedData ) {
  return checkInOut('checkin',context, storedData ).then(check=> {
    return new Promise((resolve, reject) => {
      if (!storedData) {
        console.error('has no stored data, not logged in!')
        return resolve();
      } else {
        //console.log(context',context);
      }
      const url = context.options.hostUrl || storedData.data.data.url;
      const urlParser = new URL(url);
      const fileRestUrl = url + '/_api/web/GetFileByServerRelativeUrl(@FileUrl)/$value' +
        ("?@FileUrl='" + encodeURIComponent(`${urlParser.pathname}Documents partages/${context.args.remoteFile}`) + "'");
      //console.log( 'get fileRestUrl :',fileRestUrl);
      /*
       url: `${url}/_api/SP.AppContextSite(@target)/web
       /getfilebyserverrelativeurl('/Shared Documents/filename.docx')
       ?@target='${context.args.remoteFile}'`,
       */
      request({
        method: 'post',
        url: fileRestUrl,
        headers: {
          Cookie: storedData.data.data.data,
          "X-HTTP-Method": "DELETE",
          //"X-FORMS_BASED_AUTH_ACCEPTED":"f"
        }
      }).on('error', err => {
        console.error('get error');
        console.error(`${err.host} ${err.code}`.red.bold);
        reject(err);
      })
        .on('response', response => {
          //console.log("resp received");
          if (response.statusCode !== 200) {
            parse_request_error(response).then(msg => {
              console.error(msg.red.bold);
              if (response.statusCode === 403) {
                // FIXME: re-login if access denied
                console.error("access denied : (one cause can be session expired)")
              }
              reject(msg);
            });
            return;
          }
          console.log("server response ok :", fileRestUrl);
          checkInOut('checkout',context, storedData );
          response.pipe(concat(buffer =>
            istextorbinary.isText(undefined, buffer, (err, is_text) => {
              console.error(err || is_text
                ? buffer.toString()
                : 'Not going to show a binary file. Run the command to save it as a file.'
              );
              resolve();
            })
          ));

        });

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
