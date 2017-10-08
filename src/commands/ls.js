'use strict';

const
  fs = require('fs'),
  xml2js = require('xml2js'),
  concat = require('concat-stream'),
  request = require('request'),
  urljoin = require('url-join'),
  rp = require('request-promise'),
  colors = require('colors'),
  Url = require('url');

//const sharedDocs = 'Shared Documents';
//const sharedDocuments = 'Documents partages';

const spreq = async ({ cookie }, params) => {

  //console.log('restUrl',params.url);
  let response = await rp(Object.assign({
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

var listInfoKeys=["internalversion",
  "level",
  "docstoreversion",
  "Subject",
  "modifiedby",
  "modifiedby2",
  "docstoretype",
  "contentversion",
  "previewexists",
  "author",
  "author2",
  "thumbnailexists",
  "timelastwritten",
//  "contenttag",
  "folderitemcount",
  "parentid",
  "timelastmodified",
  "timecreated",]

async function ls(context) {
  const { storedData, args, siteHostUrl, sharedDocuments, jsonFormat } = context;
  try {
    if (!storedData) {
      console.trace('has no session data, not logged in!')
      throw new Error('has no session data, not logged in!');
    }

    let sharedDocs = typeof sharedDocuments === 'string' ? sharedDocuments : storedData.sharedDocuments;
    const relative_urlSite = siteHostUrl || storedData.relative_urlSite;

    const url = urljoin(storedData.hostBaseUrl, relative_urlSite).replace(/[/]+$/g, '');
    let remoteFolder = args.remoteFolder || "";
    const urlFolder = urljoin(urljoin(relative_urlSite, sharedDocs), remoteFolder).replace(/^[/]+/g, '/');
    const restUrl = (fileType) => url + '/_api/web/GetFolderByServerRelativeUrl(@FolderUrl)/' + fileType +
    ("?@FolderUrl='" + encodeURIComponent(urlFolder) + "'");

    //console.log('siteUrl',url);
    //console.log('urlFolder',urlFolder);

    const dislayFiles = (infoList) => {
      infoList.length == 0
      && console.log('empty folder or does not exist')
      || console.log('\nlist for '.underline, ':', urlFolder, '\n');

      infoList.map(inf =>
        typeof inf.ItemCount != 'undefined' ?
          console.log(`${inf.Name}/ `.blue.bold + ` (${inf.ItemCount}) ${inf.TimeLastModified}`) :
          console.log(
            `${inf.Name} `.green.bold + `${inf.Length}  ${inf.TimeLastModified}(`,
            ['Online', 'Offline', 'draft', ''][inf.CheckOutType],
            ['?', 'published', 'draft', 'checked out!'][inf.Level].cyan,
            '-', inf.CheckInComment.gray,
            ')')
      )
    };

    let infoList = [];
    let jsonResp = await spreq(storedData, { url: restUrl('Folders') });
    infoList.push(...jsonResp.d.results);
    let jsonResp2 = await spreq(storedData, { url: restUrl('Files') });
    infoList.push(...jsonResp2.d.results);
    let formattedResult0 = ({ Name, ItemCount, TimeLastModified, Length, TimeCreated, CheckInComment, Title, Level,ListItemAllFields,Properties }) => (
      {
        Name,
        TimeLastModified,
        TimeCreated,
        isDir: typeof ItemCount !== 'undefined',
        ItemCount,
        Length,
        CheckInComment, Title, Level,
        //ListItemAllFields_uri: ListItemAllFields["__deferred"]['uri'],
        Properties_uri: Properties["__deferred"]['uri'],
        properties:{}
      });
    let formattedResult=(a)=>{
      //console.log('--------------------',a);
      return formattedResult0(a);
    };
    if (jsonFormat) {
      //console.log('jsonfile')
      let jsn =
        {
          url,
          urlFolder,
          folders: infoList.filter(({ItemCount})=>typeof ItemCount !== 'undefined')
          .map(formattedResult),
          files: infoList.filter(({ItemCount})=>typeof ItemCount === 'undefined')
          .map(formattedResult)
        };

      //console.log(jsn.folders);
       for(let fi in jsn.files){
        let f = jsn.files[fi];
        try {
          //console.log('info for ',f.Properties_uri);
          let infos = await spreq(storedData, { url: f.Properties_uri });
          //console.log('###infos.d.__metadata#',infos.d.__metadata)
          if (infos.d)
            for (let m in infos.d) {
              let k = m.replace('vti_x005f_', '');
              if (listInfoKeys.indexOf(k)!=-1) {
                let info = infos.d[m]
                //console.log('#######', m, "#", info)
                f.properties[k] = info;
                if (["modifiedby","author"].indexOf(k)!=-1) {
                   f.properties["_"+k+"_"] = f.properties[k];
                   f.properties[k] = info.split('|').reverse()[0];
                }
              }
            }
          //console.log('==>',f.properties);
          delete f.Properties_uri;
        }catch(e){
          f.properties['error']=e.message
          ///console.error(e)
        }
      }
      console.log(JSON.stringify(jsn,null,2));

    } else {
      //console.log('console print')
      dislayFiles(infoList);
    }

  } catch (e) {
    console.error(e.message)
    return e;
  }
}

module.exports = ls;


