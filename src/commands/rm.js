'use strict';

const
  fs = require('fs'),

  xml2js = require('xml2js'),
  concat = require('concat-stream'),
  Path = require('path'),
  urljoin = require('url-join'),
  request = require('request'),
  rp = require('request-promise'),
  sprequest = require('sp-request'),
  istextorbinary = require('istextorbinary'),
  FileSaver_1 = require("spsave/lib/src/core/FileSaver"),
  spsave = require("spsave").spsave,

  Command = require('./command'),
  Login = require(`./login`);
const Url = require('url');

const sharedDocs = 'Shared Documents';
//const sharedDocs = 'Documents partages';
async function rm(context, storedData) {
  let _this = {
    coreOptions: {
      checkinMessage: 'msg checkin',
      checkinType:2
    }
  };
  let { args:{ remoteFile } } = context;
  let { hostBaseUrl, relative_urlSite, cookie } = storedData;
  let digest;
  const reqParams = (url, method = 'get', digest) =>
    ( {
      method,
      url,
      headers: {
        Cookie: cookie,
        accept: "application/json;odata=verbose",
        'X-RequestDigest':digest ?  digest  : undefined
      }
    });

  try {

    if (!storedData) {
      console.error('has no stored data, not logged in!')
      return 'you must logged In';
    }
    const siteUrl =urljoin(hostBaseUrl, relative_urlSite);
    //var fileServerRelativeUrl = this.path + "/" + this.file.folder + "/" + this.file.fileName;
    const fileServerRelativeUrl = `${storedData.relative_urlSite}Documents partages/${remoteFile}`;
    _this.fileName = Path.basename(remoteFile);
    _this.folder = Path.dirname(remoteFile);

    _this.uploadFileRestUrl = siteUrl +
      '/_api/web/GetFolderByServerRelativeUrl(@FolderName)/Files/add(url=@FileName,overwrite=true)' +
      ("?@FolderName='" + encodeURIComponent(_this.folder) + "'&@FileName='" + encodeURIComponent(_this.fileName) + "'");
    _this.getFileRestUrl = siteUrl + '/_api/web/GetFileByServerRelativeUrl(@FileUrl)' +
      ("?@FileUrl='" + encodeURIComponent(fileServerRelativeUrl) + "'");

    //_this.deleteFileRestUrl = siteUrl + '/_api/web/GetFileByServerRelativeUrl(@FileUrl)/delete()' +
     // ("?@FileUrl='" + encodeURIComponent(fileServerRelativeUrl) + "'");
    _this.deleteFileRestUrl = siteUrl + '/_api/web/GetFileByServerRelativeUrl(@FileUrl)' +
      ("?@FileUrl='" + encodeURIComponent(fileServerRelativeUrl) + "'");

    //_this.deleteFileRestUrl = siteUrl + "/_api/web/getfilebyserverrelativeurl('" + fileServerRelativeUrl+ "')";

    _this.checkoutFileRestUrl = siteUrl + '/_api/web/GetFileByServerRelativeUrl(@FileUrl)/CheckOut()' +
      ("?@FileUrl='" + encodeURIComponent(fileServerRelativeUrl) + "'");

    _this.checkinFileRestUrl = siteUrl +
      '/_api/web/GetFileByServerRelativeUrl(@FileUrl)/CheckIn(comment=@Comment,checkintype=@Type)' +
      ("?@FileUrl='" + encodeURIComponent(fileServerRelativeUrl) + "'&@Comment='" + (_this.coreOptions.checkinMessage) + "'") +
      ("&@Type='" + _this.coreOptions.checkinType + "'");

    _this.updateMetaDataRestUrl = siteUrl + '/_api/web/GetFileByServerRelativeUrl(@FileUrl)/ListItemAllFields' +
      ("?@FileUrl='" + encodeURIComponent(fileServerRelativeUrl) + "'");


  } catch (e) {
    console.log(e);
    return e;
  }

  async function getFileByUrl() {
    //return _this.sprequest.get(_this.getFileRestUrl);
    try {
      console.log('calling getFileRestUrl', _this.getFileRestUrl);

      let response = await rp(reqParams(_this.getFileRestUrl));
      //console.log("resp=", response);
      const jsonResp = JSON.parse(response);
      return jsonResp;
    } catch (e) {
      console.log(e);
      return e;
    }
    return null;
  };

  async function deleteFileByUrl() {
    //return _this.sprequest.get(_this.deleteFileRestUrl);
    try {
      console.log('calling deleteFileRestUrl', _this.deleteFileRestUrl);
      let p = reqParams(_this.deleteFileRestUrl, 'delete', digest);
      p.headers["X-HTTP-Method"]= "DELETE";

      console.log('parameters with digest',digest, p);
      let response = await rp(p);
      //console.log("resp=", response);
      const jsonResp = JSON.parse(response);
      console.log("resp received resp.d=", jsonResp.d);
      return jsonResp;
    } catch (e) {
      console.log(e);
      return e;
    }
    return null;
  };

  async function requestDigest() {
    try {
      if (digest) {
        return digest;
      } else {
        console.log("request digest".orange);
        const textResponse = await rp(reqParams(hostBaseUrl + "/_api/contextinfo",'post'));
        if (textResponse) {
          const response = JSON.parse(textResponse);
          digest = response.d.GetContextWebInformation.FormDigestValue;
          var timeout = parseInt(response.d.GetContextWebInformation.FormDigestTimeoutSeconds, 10);
          //exports.requestDigestCache.set(cacheKey, digest, timeout - 30);
          return digest;
        }
      }
    } catch (e) {
      console.log(e);
      return e;
    }
    return null;
  }

  async function checkoutFile() {
    try {
      const fileInfo = await getFileByUrl();
      console.log("CHECKOUT CheckOutType".blue, fileInfo.d.CheckOutType);
      const digest = await requestDigest();
      console.log('digest', digest);
      if(fileInfo.d.CheckOutType === 0){
        return ;
      }
      const params = reqParams(_this.checkoutFileRestUrl, 'post', digest);
      console.log('calling ', _this.checkoutFileRestUrl, 'with', params);
      const textResponse = await rp(params);
      console.log('textResponse', textResponse);
      if (textResponse) {
        const response = JSON.parse(textResponse);
        //console.log('response', response, ' checkout OK');
        return response;
      }
      console.log('checkout error', textResponse);
    } catch (e) {
      console.log(e);
      return e;
    }
    //const digest = await requestDigest();
    //console.log('digest',digest)
  }

  async function checkinFile() {
    try {
      if(!digest)
      {
        digest = await requestDigest();
      }
      console.log('calling CHECKIN checkinFileRestUrl '.blue, _this.checkinFileRestUrl);
      const textResponse = await rp(reqParams(_this.checkinFileRestUrl, 'post', digest));
      console.log('textResponse', textResponse);
      if (textResponse) {
        const response = JSON.parse(textResponse);
        //console.log('response', response, ' checkout OK');
        return response;
      }
      console.log('checkin error');
    } catch (e) {
      console.log(e);
      return e;
    }
    //const digest = await requestDigest();
    //console.log('digest',digest)
  }

  try {
    await checkoutFile();
    await deleteFileByUrl();
    //await checkinFile();
  } catch (e) {
    console.log(e);
    return e;
  }

}

module.exports = rm;
