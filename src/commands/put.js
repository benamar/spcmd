'use strict';

const
  urljoin = require('url-join'),
  spsave = require("spsave").spsave,

  Login = require(`./login`);

async function put(options, storedData) {
  try {
    let { siteHostUrl,credentials:{  username, password,sharedDocuments }, args:{ remoteFolder, localFile } } = options;
    const { hostBaseUrl } = storedData;
    if (!storedData) {
      console.error('has no stored data, not logged in!')
      return resolve();
    } else {
      //console.error('storedData url',storedData.url);
    }
    !options.silent && console.error(`Uploading file`, localFile, ' to folder', remoteFolder, '...');

    username = username || "XXXXYYYY";
    password = password || "XXXXYYZZ";

    let sharedDocs = typeof sharedDocuments === 'string'?sharedDocuments:storedData.sharedDocuments;
    let relative_urlSite = siteHostUrl||storedData.relative_urlSite;
    remoteFolder = remoteFolder || "";
    const urlFolder = urljoin(sharedDocs,remoteFolder).replace(/^[/]+/g,'/');
    const siteUrl=urljoin(hostBaseUrl, relative_urlSite );
    /*
    console.log('relative_urlSite',relative_urlSite);
    console.log('storedData.relative_urlSite',storedData.relative_urlSite);
    console.log('siteUrl',siteUrl);
    console.log('urlFolder',urlFolder);
    */
    return await spsave(
      {
        siteUrl,
        notification: true,
        checkin: true,
        checkinType: 1
      },
      { username, password },
      {
        folder: urlFolder,
        glob: options.args.localFile,
      }
    );

  } catch
    (e) {
    console.error(e.message)
  }
  ;


}

module.exports = put;
