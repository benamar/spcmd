'use strict';

const
  fs = require('fs'),

  xml2js = require('xml2js'),
  concat = require('concat-stream'),
  Path = require('path'),
  urljoin = require('url-join'),
  request = require('request'),
  rp = require('request-promise'),
  sprequest = require('../util/sprequest'),
  istextorbinary = require('istextorbinary'),
  FileSaver_1 = require("spsave/lib/src/core/FileSaver"),
  //spsave = require("spsave").spsave,
  colors = require('colors'),
  Command = require('./command'),
  Login = require(`./login`);
const Url = require('url');

const sharedDocs = 'Shared Documents';
//const sharedDocs = 'Documents partages';

const removeTrailingSlash = function (url) {
  return url.replace(/(\/$)|(\\$)/, '');
};
const removeLeadingSlash = function (url) {
  return url.replace(/(^\/)|(^\\)/, '');
};
const trimSlashes = function (url) {
  return url.replace(/(^\/)|(^\\)|(\/$)|(\\$)/g, '');
};
const ErrorCodes = {
  saveConfilctCode: '-2130246326',
  cobaltCode: '-1597308888',
  directoryNotFoundCode: '-2147024893',
  fileDoesNotExistOnpremCode: '-2146232832',
  fileDoesNotExistOnlineCode: '-2130575338'
}


async function rm(context) {
  let _this = {
    coreOptions: {
      checkinMessage: 'msg checkin',
      checkinType: 2
    }
  };
  const { storedData, args, siteHostUrl, sharedDocuments, jsonFormat } = context;
  let { hostBaseUrl, cookie } = storedData;

  let digest;
  const reqParams = (url, method = 'get', digest) =>
    ( {
      method,
      url,
      headers: {
        Cookie: cookie,
        accept: "application/json;odata=verbose",
        'X-RequestDigest': digest ? digest : undefined
      }
    });
  const handleError = (e, name) => {
    try {
      if (e.error && typeof e.error == 'string') {
        const js = JSON.parse(e.error);
        return new Error(name + ':' + js.error.message.value)
      }

    } catch (e) {
      //console.log('cannot read err',e);
    }
    return new Error(name + ':' + e.message);
  }
  try {

    let sharedDocs = typeof sharedDocuments === 'string' ? sharedDocuments : storedData.sharedDocuments;
    const relative_urlSite = siteHostUrl || storedData.relative_urlSite;

    const siteUrl = urljoin(storedData.hostBaseUrl, relative_urlSite).replace(/[/]+$/g, '');

    let remoteFile = args.remoteFile || "";

    //const restUrl = (fileType) => url + '/_api/web/GetFolderByServerRelativeUrl(@FolderUrl)/' + fileType +
    //("?@FolderUrl='" + encodeURIComponent(urlFolder) + "'");

    //const fileServerRelativeUrl = `${storedData.relative_urlSite}Documents partages/${remoteFile}`;
    const sharedSiteUrl = urljoin(relative_urlSite, sharedDocs);
    //console.log('sharedSiteUrl',sharedSiteUrl);
    const fileServerRelativeUrl = urljoin(sharedSiteUrl, remoteFile).replace(/^[/]+/g, '/');

    const fileServerRelativeUrl2 = urljoin(sharedDocs, remoteFile).replace(/^[/]+/g, '/');

    //console.log('fileServerRelativeUrl', fileServerRelativeUrl);

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

    _this.coreOptions = Object.assign({}, {siteUrl});

    _this.checkinFileRestUrl = siteUrl +
      '/_api/web/GetFileByServerRelativeUrl(@FileUrl)/CheckIn(comment=@Comment,checkintype=@Type)' +
      ("?@FileUrl='" + encodeURIComponent(fileServerRelativeUrl) + "'&@Comment='" + (_this.coreOptions.checkinMessage) + "'") +
      ("&@Type='" + _this.coreOptions.checkinType + "'");

    _this.updateMetaDataRestUrl = siteUrl + '/_api/web/GetFileByServerRelativeUrl(@FileUrl)/ListItemAllFields' +
      ("?@FileUrl='" + encodeURIComponent(fileServerRelativeUrl) + "'");

    _this.sprequest = sprequest.create({ username: "XXXXYYYY", password: "XXXXYYZZ" });


  } catch (e) {
    console.error(e);
    return e;
  }

  async function getFileByUrl() {
    //return _this.sprequest.get(_this.getFileRestUrl);
    try {
      //console.log('getFileByUrl: calling getFileRestUrl', _this.getFileRestUrl);

      let response = await rp(reqParams(_this.getFileRestUrl));
      //console.log("resp=", response);
      const jsonResp = JSON.parse(response);
      return jsonResp;
    } catch (e) {

      throw handleError(e, 'getFileByUrl');
    }
    return null;
  };
/*
  async function deleteFileByUrl() {
    //return _this.sprequest.get(_this.deleteFileRestUrl);
    try {
      //console.log('calling deleteFileRestUrl', _this.deleteFileRestUrl);
      let p = reqParams(_this.deleteFileRestUrl, 'delete', digest);
      p.headers["X-HTTP-Method"] = "DELETE";
      //console.log('parameters with digest',digest);
      let response = await rp(p);
      //console.log("resp=", response);
      if (response) {
        const jsonResp = JSON.parse(response);
        //console.log("resp received resp.d=", jsonResp.d);
        return jsonResp;
      }
      return true;
    } catch (e) {
      //console.error('ERROR:',e.message);
      throw handleError(e, 'deleteFileByUrl');
    }
    return null;
  };
*/
  const deleteFile = async function () {
    const digest = await _this.sprequest.requestDigest(_this.coreOptions.siteUrl);
    const resp = await _this.sprequest.delete(_this.deleteFileRestUrl, {
      headers: {
        'X-RequestDigest': digest,
        'X-HTTP-Method': "DELETE"
      }
    });
    // var fileExists = result[0];
    //var data = result[1];
    console.log('deleted file ',_this.deleteFileRestUrl);
  };

  async function requestDigest() {
    try {
      if (digest) {
        return digest;
      } else {
        //console.log("request digest".orange);
        const textResponse = await rp(reqParams(hostBaseUrl + "/_api/contextinfo", 'post'));
        if (textResponse) {
          const response = JSON.parse(textResponse);
          digest = response.d.GetContextWebInformation.FormDigestValue;
          var timeout = parseInt(response.d.GetContextWebInformation.FormDigestTimeoutSeconds, 10);
          //exports.requestDigestCache.set(cacheKey, digest, timeout - 30);
          return digest;
        }
      }
    } catch (e) {
      //console.error('ERROR:',e.message);
      throw handleError(e, 'requestDigest');
      //return throw e;
    }
    throw new Error('digest error', 'requestDigest');
    return null;
  }

  const getFileByUrl2 = function () {
    return _this.sprequest.get(_this.getFileRestUrl);
  };

  const checkoutFile = async function () {
    let isPending = true;

    const data = await getFileByUrl2();
    if (data.body.d.CheckOutType === 0) {
      console.log('error file already checked out, path', _this.getFileRestUrl);
      return null;
    }
    if (data.body.d.Level) {
      //console.log(data.body.d.Level,['unknown','The file is published','The file is in draft','The file is checked out!'][data.body.d.Level]);
    }
    //console.log('_this.checkoutFileRestUrl', _this.checkoutFileRestUrl);
    const digest = await _this.sprequest.requestDigest(_this.coreOptions.siteUrl);
    try {
      const ret = await _this.sprequest.post(_this.checkoutFileRestUrl, {
        headers: {
          'X-RequestDigest': digest
        }
      });
      //console.log(" checked out.");
    } catch (err) {

      if (err.message.indexOf(ErrorCodes.fileDoesNotExistOnpremCode) !== -1 ||
        err.message.indexOf(ErrorCodes.fileDoesNotExistOnlineCode) !== -1) {
        console.log('file do not exist');
      }
      return null;
    }

  };
/*
  async function checkoutFilebyUrl() {
    try {
      const fileInfo = await getFileByUrl();

      console.log(" CheckOutType".blue, fileInfo && fileInfo.d && fileInfo.d.CheckOutType);
      console.log('fileInfo', fileInfo.d.__metadata.uri);
      if (fileInfo.d.Level) {
          console.log(['unknown','The file is published','The file is in draft','The file is checked out!'][fileInfo.d.Level]);
      }
      if (fileInfo.d.CheckOutType === 0) {
        console.log('Error : The file is already checked out');
        return;
      }

      //const digest = await requestDigest();
      const digest = await _this.sprequest.requestDigest(_this.coreOptions.siteUrl);
      console.log('----> received digest'.blue, digest);

      //const params = reqParams(_this.checkoutFileRestUrl, 'post', digest);
      const params = reqParams(_this.checkoutFileRestUrl, 'post', digest);
      console.log('checkoutFile calling url=', _this.checkoutFileRestUrl, params);
      const textResponse = await rp(params);
      console.log('textResponse', textResponse);
      if (textResponse) {
        const response = JSON.parse(textResponse);
        //console.log('response', response, ' checkout OK');
        return response;
      }
      console.error('checkout error', textResponse);
    } catch (e) {
      //console.error('ERROR:',e);
      throw handleError(e, 'In checkoutFile');
      //return e;
    }
    //const digest = await requestDigest();
    //console.log('digest',digest)
  }
*/
  async function checkinFile() {
    try {
      //if (!digest) {        digest = await requestDigest();      }
      const digest = await _this.sprequest.requestDigest(_this.coreOptions.siteUrl);
      //console.log('calling CHECKIN checkinFileRestUrl '.blue, _this.checkinFileRestUrl);
      const textResponse = await rp(reqParams(_this.checkinFileRestUrl, 'post', digest));
      //console.log('textResponse', textResponse);
      if (textResponse) {
        const response = JSON.parse(textResponse);
        //console.log('response', response, ' checkout OK');
        return response;
      }
      console.error('checkin error');
    } catch (e) {

      throw handleError(e);
    }
    //const digest = await requestDigest();
    //console.log('digest',digest)
  }

  try {
    console.log('deleting File', _this.deleteFileRestUrl);
    await checkoutFile();
    await deleteFile();
    //await checkinFile();
  } catch (e) {
    //console.error('ERROR:', e);
    throw new Error(e.message, 'checkinFile')
  }

}

module.exports = rm;
/*

 _this.checkoutFileRestUrl
 https://reactivetech.sharepoint.com/sites/valfacprojets/_api/web/GetFileByServerRelativeUrl(@FileUrl)/CheckOut()?@FileUrl='%2Fsites%2Fvalfacprojets%2FDocuments%20partages%2Ftestp2.txt'
 https://reactivetech.sharepoint.com/sites/valfacprojets/_api/web/GetFileByServerRelativeUrl(@FileUrl)/CheckOut()?@FileUrl='%2Fsites%2Fvalfacprojets%2FDocuments%20partages%2Ftestp2.txt'

 */
