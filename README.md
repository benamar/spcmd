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
    
    login [options] <HOSTURL> 
         Authenticates with Sharepoint explicitly 
         <HOSTURL> The Sharepoint host URL 
          [-u]  User credentials as emailaddress:password 

           Example: ocmd login https://your.sharepoint.com 

     get [options] <FILEURL> 
          [filepath] ... get a file and saves its content 
          <FILEURL>  The full Sharepoint URL path 
          [-u]  User credentials as emailaddress:password 

          Example: spcmd get https://your.sharepoint.com/sites/mysite/bar.pdf foo.pdf

      put [options] <FILEURL> [filepath] 
          upload a file to Sharepoint
            <FILEURL>  The full Sharepoint URL to the file
            [filepath] File name or file path to upload
            [remotefolder] folder name to upload to
            [-u]  User credentials as emailaddress:password

            Example: ocmd get https://your.sharepoint.com/path/bar.pdf bar.pdf

     logout
           Invalidates your Sharepoint session explicitly

**Options:**

    --silent ............................... Suppresses most console output

License
-------
The MIT License ([MIT](http://choosealicense.com/licenses/mit/))
