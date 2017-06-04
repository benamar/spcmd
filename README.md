cmd file
===============
A command-line utility for sharepoint file operations

**information** 
  Currently supports download/upload of individual files from and online Sharepoint site / file storage.
  incoming: list remote folders, upload folders
  this is based on s-kainet node-sp-auth module and  Zarko Hristovski utility

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
                    > spcmd login https://your.sharepoint.com me@mail.com password -s /sites/myTeamsite
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
        [-u]  User login as emailaddress (if not already logged)
        [-p]  User password (if not already logged)
        
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
          [-u]  User login as emailaddress (if not already logged)
          [-p]  User password (if not already logged)

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
          [-u]  User login as emailaddress (if not already logged)
          [-p]  User password (if not already logged)
          
            Example: 
                      > spcmd put d:/tmp/localfoo.pdf 
                      > spcmd put d:/tmp/localfoo.pdf remoteFolder
                      > spcmd put d:/tmp/localfoo.pdf -s /sites/anotherTeamSite
                      > spcmd put d:/mydir remoteFolder2 -s /sites/anotherTeamSite
        
        rm
          not yet available
          
**Options:**

    --silent ............................... Suppresses most console output

License
-------
The MIT License ([MIT](http://choosealicense.com/licenses/mit/))
