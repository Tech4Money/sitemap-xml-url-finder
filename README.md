# Sitemap XML URL Finder
Node application to scrap splitted sitemap XML files of a index.xml and search for urls inside them.

## To run
To start the whole process (download index, download and decrompess all the xml files linked there)
```
yarn start <XML index file url>
```

To decompress already downloaded xml files at `sitemaps` folder
```
yarn decompress
```

To find urls inside the xml files
```
yarn find-urls <url1> <url2> <url3> <url-n>
```
