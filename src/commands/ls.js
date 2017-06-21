'use strict';

const
  fs = require( 'fs' ),
  xml2js          = require( 'xml2js'         ),
  concat          = require( 'concat-stream'  ),
  request         = require( 'request'        ),
  urljoin = require('url-join'),
  rp = require('request-promise'),
  Url = require('url');

  //const sharedDocs = 'Shared Documents';
//const sharedDocuments = 'Documents partages';

const spreq= async ({cookie},params)=>{

  //console.log('restUrl',params.url);
  let response = await rp( Object.assign({
    method: 'get',
    headers: {
      Cookie: cookie,
      accept: "application/json;odata=verbose"
    }
  }, params)
  );
  const jsonResp = JSON.parse(response);
  return jsonResp;
};

async function ls( context ){
    const {storedData,args,siteHostUrl,sharedDocuments,jsonFormat} = context;
    try {
      if (!storedData) {
        //console.error('has no session data, not logged in!')
        throw new Error('has no session data, not logged in!');
      }

      let sharedDocs = typeof sharedDocuments === 'string'?sharedDocuments:storedData.sharedDocuments;
      const relative_urlSite = siteHostUrl||storedData.relative_urlSite;

      const url = urljoin(storedData.hostBaseUrl, relative_urlSite).replace(/[/]+$/g,'');
      let remoteFolder = args.remoteFolder || "";
      const urlFolder = urljoin(urljoin(relative_urlSite,sharedDocs),remoteFolder).replace(/^[/]+/g,'/');
      const restUrl = (fileType) => url + '/_api/web/GetFolderByServerRelativeUrl(@FolderUrl)/' + fileType +
      ("?@FolderUrl='" + encodeURIComponent(urlFolder) + "'");

      //console.log('siteUrl',url);
      //console.log('urlFolder',urlFolder);

      let infoList = [];
      const dislayFiles = () => {
        infoList.length == 0 && console.log('empty folder or does not exist')
        infoList.map(inf =>
          typeof inf.ItemCount != 'undefined' ?
            console.log(`${inf.Name}/ `.blue.bold + ` (${inf.ItemCount}) ${inf.TimeLastModified}`) :
            console.log(`${inf.Name} `.green.bold + `${inf.Length}  ${inf.TimeLastModified}`)
        )
      };

      let jsonResp = await spreq(storedData,{ url: restUrl('Folders') });
      infoList.push(...jsonResp.d.results);
      let jsonResp2 = await spreq(storedData,{ url: restUrl('Files') });
      infoList.push(...jsonResp2.d.results);
      if(jsonFormat){
        console.log(
        infoList.map(({Name,ItemCount,TimeLastModified,Length}) =>(
          JSON.parse(JSON.stringify({
            Name,
            TimeLastModified,
            isDir:typeof ItemCount != 'undefined',
            ItemCount,
            Length
          })
          ))
        )
        )
      }else {
        dislayFiles();
      }

    }catch(e){
      console.error(e.message)
      return e;
    }
}



module.exports= ls;
