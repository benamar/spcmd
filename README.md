spcmd
===============
A command-line utility for office365 sharepoint remote file operations

**information** 
  list remote server files 
   >spcmd ls 
  
  download of individual files from and online Sharepoint site / file storage.
   >spcmd get myshareFile.txt 

  upload of individual files or folder tree from  file storage to online Sharepoint site .
   >spcmd get newFolder/myshareFile2.txt 

  remove files
    >spcmd rm newFolder/myshareFile2.txt 
  
  you will need to login first 
  >spcmd login https://myproject.sharepoint/ login 
  >passwd:***
  
  thanks to s-kainet node-sp-auth module and Zarko Hristovski work

Installation or update
----------------------

```
$ npm install -g spcmd
```

Usage
-----

$ **spcmd** task args

**Available tasks:** 
    (use --help for more info)
    
    login -[options] [hostSiteUrl] [username] [password]  
            login with hostSiteUrl and credentials,
            if missing information are detected user will be promted from command line to complete

           Example: 
                    > spcmd login https://your.sharepoint.com/sites/myTeamsite me@mail.com password
                    > spcmd login https://your.sharepoint.com me@mail.com password -s /sites/myTeamsite -k sessionkey
                    > spcmd logout
                    > spcmd login https://your.sharepoint.com me@mail.com 
                      enter password:
                    > spcmd logout
                    > spcmd login
                      enter host/site :
                      
    logout
        clear all login credentials and host information, 
        after this, the next command will prompt you for login
    
    pwd
        show current host and site
        
    ls -[options] [remoteFolder] 
        list files in remoteFolder
        [-s]  host site url : override current site url
        
        example > spcmd ls
                folder1/  (3) 2017-06-03T18:25:01Z
                Forms/  (0) 2017-05-04T02:52:51Z
                test.js 628  2017-05-05T09:52:16Z
                file.txt 11  2017-05-18T12:48:15Z
               > spcmd ls folder1
                test/  (1) 2017-06-03T18:25:05Z
                package.json 1125  2017-06-02T13:41:39Z
                new.txt 19  2017-05-21T19:03:35Z

    get -[options] <remoteFile> [localFile]
        get a file and shows its content or saves it
          [-s]  host site url : override current site url

          Example: > spcmd get foo.pdf d:/tmp/localfoo.pdf
                    # write the remote file foo.pdf to your local drive
                   > spcmd get readme.txt
                      this is my readme.txt content
                 
                    > spcmd get readme.txt -s /sites/mysite2
                        hello, this is another readme.txt content 

    put <localFile|localFolder> [remoteFolder]      
        upload a file or directory content to sharepoint server
          remoteFolder will be created if not exist
          if local folder is provided, the same folder tree is created on remoteFolder
          
          [-s]  host site url : override current site url
          
            Example: 
                      > spcmd put d:/tmp/localfoo.pdf 
                      > spcmd put d:/tmp/localfoo.pdf remoteFolder
                      > spcmd put d:/tmp/localfoo.pdf -s /sites/anotherTeamSite
                      > spcmd put d:/mydir remoteFolder2 -s /sites/anotherTeamSite
        
    rm -[options] <remoteFile> [localFile]
        remove a file 
          [-s]  host site url : override current site url

          Example: > spcmd rm foo.pdf 
                    # remove file foo.pdf from server
                    > spcmd rm readme.txt -s /sites/mysite2
                        remove /sites/mysite2/shared folders/readme.txt from server
**Options:**

     -d, --sharedDocuments [shared Documents translation]
          provide the shared document custom name or translation'
            the default shared folder is defined the french translation 'Documents partages'
            with -d option at login, the shared folder will be stored and used for the session
            
      -k, --sessionKey [key]
            provide the session key to store to
            you may want to use multiple session without need to logout/login again
              

    --silent ............................... Suppresses most console output

License
-------
The MIT License ([MIT](http://choosealicense.com/licenses/mit/))
