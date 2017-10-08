'use strict';

const
  urljoin = require('url-join'),
  spsave = require("spsave").spsave,

  Login = require(`./login`);

var glob = require('glob-fs')();
var fs = require('fs');

async function put(options, storedData) {
  try {
    let { siteHostUrl, credentials:{ username, password, sharedDocuments }, args:{ remoteFolder, localFile } } = options;
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

    let sharedDocs = typeof sharedDocuments === 'string' ? sharedDocuments : storedData.sharedDocuments;
    let relative_urlSite = siteHostUrl || storedData.relative_urlSite;
    remoteFolder = remoteFolder || "";
    const urlFolder = urljoin(sharedDocs, remoteFolder).replace(/^[/]+/g, '/');
    const siteUrl = urljoin(hostBaseUrl, relative_urlSite);
    /*
     console.log('relative_urlSite',relative_urlSite);
     console.log('storedData.relative_urlSite',storedData.relative_urlSite);
     console.log('siteUrl',siteUrl);
     console.log('urlFolder',urlFolder);
     */

    //console.log('before calling spsave');
    if (localFile.indexOf("*") != -1) {
      try {
        var files = glob.readdirSync(localFile, {});
        if (files.length == 0) {
          console.log("no file match for", localFile);
          process.exit(1);
        }
        console.log('send found files', files);
      } catch (e) {
        console.log("error reading", localFile);
        process.exit(1);
      }
    }else{
      if (!fs.existsSync(localFile)) {
        console.log(localFile, " do not exist");
        process.exit(1);
      }else{
        try
        {
          if(fs.statSync(localFile).isDirectory()){
            console.log(localFile,"is not a file, need * or **/*");
            process.exit(1);
          }
        }
        catch (err)
        {
          console.log(localFile,"is not a file, need * or **/*");
          process.exit(1);
        }
      }
    }



    let ret = await spsave(
      {
        siteUrl,
        notification: true,
        checkin: true,
        checkinType: 1,
        checkinMessage: 'checked in by spcmd'
      },
      { username, password },
      {
        folder: urlFolder,
        glob: options.args.localFile,
      }
    );
    //console.log('spsave returns',ret);
    return ret;

  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
  ;


}

module.exports = put;
