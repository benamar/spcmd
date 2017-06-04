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

module.exports = class GetFile extends Command {
  run (opts) {
    this.options = opts;
    return new Login( this ).run({
      silent      : true,
      credentials : this.credentials
    }).then( stored => ls( this, stored.data ) );
  }
}

function ls ( context, storedData ) {
  return new Promise( ( resolve, reject ) => {
    if ( ! storedData ) {
      console.error('has no stored data, not logged in!')
      return resolve();
    }
    //const url=context.options.siteHostUrl||storedData && storedData.url;
    //url||reject('undefined host site url, option -h ');
    //const urlParser            = new URL(url);
    const url=Url.resolve(storedData.hostBaseUrl,storedData.relative_urlSite);
    let   remoteFolder=context.args.remoteFolder||"";
    //fileType : Files or Folders
    remoteFolder = remoteFolder.startsWith('/')?remoteFolder.slice(1):remoteFolder;
    const restUrl = (fileType) => url + '/_api/web/GetFolderByServerRelativeUrl(@FolderUrl)/'+fileType +
      ("?@FolderUrl='" + encodeURIComponent(`${storedData.relative_urlSite}Documents partages/${remoteFolder}`) + "'");
    const onError=(err)=>err => {
      console.error( `list error ${err.host} ${err.code}`);
      reject( err );
    }
    const reqParams = {
      method:'get',
      headers : {
        Cookie : storedData.cookie,
        accept: "application/json;odata=verbose"
      }
    };
    let infoList=[];
    const dislayFiles=()=>{
      infoList.length==0 && console.log('empty folder or does not exist')
      infoList.map(inf=>
        typeof inf.ItemCount != 'undefined' ?
          console.log(`${inf.Name}/ `.blue.bold+` (${inf.ItemCount}) ${inf.TimeLastModified}`)   :
          console.log(`${inf.Name} `.green.bold+`${inf.Length}  ${inf.TimeLastModified}`)
      )
    };
    request(Object.assign({url:restUrl('Folders')},reqParams)).on( 'error', onError(reject))
      .on( 'response', response => {
        displayResponse(infoList,response,reject,next);
      });
    const next=()=>
    request(Object.assign({url:restUrl('Files')},reqParams)).on( 'error', onError(reject))
      .on( 'response', response => {
        console.log('listing url : '.yellow,`${storedData.hostBaseUrl+storedData.relative_urlSite+remoteFolder}`.grey,'\n');
        displayResponse(infoList,response,reject,dislayFiles);
      });

  });
}



const isOk=(reject)=>(response)=> {
  //console.log("resp received");
  if (response.statusCode !== 200) {
    parse_request_error(response).then(msg => {
      console.error(msg.red.bold);
      if (response.statusCode === 403) {
        // FIXME: re-login if access denied
        console.error("access denied : (this also occur when probably when you need to relog in)")
      }
      reject(msg);
    });
    return false;
  };
  return true
};
const displayResponse=(filesInfo,response,reject,resolve)=>
  isOk(response) &&
  response.pipe( concat( buffer =>
  istextorbinary.isText( undefined, buffer, ( err, is_text ) => {

    try{
      const resp = JSON.parse(buffer.toString());
      filesInfo.push(...resp.d.results);
    }catch(e) {
      console.log("Error reading response!",e);
      console.error( err || is_text
        ? true || buffer.toString()
        : 'Not going to show a binary file. Run the command to save it as a file.'
      );
    }
    resolve();
  })
));

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




