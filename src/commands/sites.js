'use strict';

const
  fs = require('fs'),

  xml2js = require('xml2js'),
  concat = require('concat-stream'),
  request = require('request'),
  rp = require('request-promise'),
  urljoin = require('url-join'),
  sprequest = require('sp-request'),
  istextorbinary = require('istextorbinary'),
  FileSaver_1 = require("spsave/lib/src/core/FileSaver"),
  spsave = require("spsave").spsave,

  Command = require('./command'),
  Login = require(`./login`);
const Url = require('url');

const sharedDocs = 'Shared Documents';
//const sharedDocs = 'Documents partages';
async function sites(context, storedData) {
  try {
    if (!storedData) {
      console.error('has no stored data, not logged in!')
      return 'you must logged In';
    }
    //const url=context.options.siteHostUrl||storedData && storedData.url;
    //url||reject('undefined host site url, option -h ');
    //const urlParser            = new URL(url);
    //console.log('storedData',storedData);
    let url = urljoin(storedData.hostBaseUrl, storedData.relative_urlSite);
    //fileType : Files or Folders
    const reqParams = {
      method: 'get',
      headers: {
        Cookie: storedData.cookie,
        accept: "application/json;odata=verbose"
      }
    };
    let infoList = [];
    const dislayFiles = () => {
      infoList.length == 0 && console.log('no site found');
      infoList.map(inf =>
        console.log(inf)
      )
    };
    const queryText = 'contentclass:sts_site';
    //const queryText = 'urn:content-classes:SPSListing';
    //const queryText = 'contentclass:STS_Web';
    url = storedData.hostBaseUrl + "/_api/search/query?querytext='" + queryText + "'";
    //url = "https://reactivetech.sharepoint.com" + `/_api/web/lists`;
    //url =
    //console.log('url', url);

    let response = await rp(Object.assign({ url: url }, reqParams));
    //displayResponse(infoList, response, reject, dislayFiles);
    //console.log('response',response);
    let filesInfo=[];
    const jsonResp = JSON.parse(response);
        const results = jsonResp.d.query.PrimaryQueryResult.RelevantResults.Table.Rows.results;
        results.forEach((rCells, i) => {
            const site = rCells.Cells.results.map(cell =>
              cell.Key == 'SPWebUrl' && { SPWebUrl: cell.Value }
              || cell.Key == 'SiteDescription' && { SiteDescription: cell.Value }
              || cell.Key == 'SiteName' && { SiteName: cell.Value }
              || cell.Key == 'Path' && { folder: cell.Value }
              || cell.Key == 'IsContainer' && { IsContainer: cell.Value }
              || cell.Key == 'ParentLink' && { ParentLink: cell.Value }
              || undefined
            ).filter(a => !!a).reduce((v, o) => Object.assign(o, v), {});
            site.SPWebUrl && filesInfo.push(site);
          }
        );

    console.log(filesInfo);

  }catch(e){
    console.log('error ',e);
  }

}







module.exports = sites;
