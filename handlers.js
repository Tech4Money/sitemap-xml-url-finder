const https = require('https')
const fs = require('fs')
const path = require('path')
const targz = require('targz');
const zlib = require('zlib')
const xmlParser = require('xml2json')

const downloadFile = async url => {
  console.log('Downloading file from ', url)
  const fileName = url.split('/').slice(-1)
  const sitemapsFolder = path.resolve('./sitemaps')
  if (!fs.existsSync(sitemapsFolder)) {
    fs.mkdirSync(sitemapsFolder)
  }
  const filePath = path.resolve(`./sitemaps/${fileName}`)
  const request = await new Promise((resolve, reject) =>
    https.get(url, (res) => {
      res.on('data', d => {
        fs.writeFileSync(filePath, d, 'utf8')
        resolve()
      })
    }).on('error', e => reject(e))
  )
  console.log('Download finished!')
  return fileName
}

const parseIndex = fileName => {
  console.log('Parsing index xml file')
  const index = fs.readFileSync(path.resolve(`./sitemaps/${fileName}`))
  const json = JSON.parse(xmlParser.toJson(index))
  const urls = json.sitemapindex.sitemap.map(o => o.loc)
  console.log('Sitemap urls generated!')
  return urls
}

const deleteFile = (file, resolve, reject) => {
  console.log('Deleting file', file)
  fs.unlink(file, (error) => {
    if (error) {
      console.log('An error ocurred when deleting', file)
      console.log(error)
      reject(err)
    }
    console.log('File deleted with success', file)
    resolve()
  })
}

const donwloadSitemaps = urls => urls.map(url => downloadFile(url))

const getUrlsfromFile = filePath => {
  const file = fs.readFileSync(filePath)
  const urls = JSON.parse(xmlParser.toJson(file)).urlset.url.map(u => u.loc)
  return urls
}

const decompressFiles = () => {
  const allFiles = fs.readdirSync('./sitemaps')
  const compressedFiles = allFiles.filter(f => f.match('.gz'))
  const compressedFilesQty = compressedFiles.length
  if (!compressedFilesQty) {
    console.log('Compressed files not found skipping decompression')
    return null
  }

  console.log('Total of', compressedFilesQty, 'compressed files found')
  console.log('Starting decompression')
  const promises = []

  compressedFiles.forEach(f => {
    console.log('Decompressing file', f)
    const compressedFilePath = path.resolve(`./sitemaps/${f}`)

    const promise = new Promise((resolve, reject) => {
      fs.readFile(compressedFilePath, (readError, compressedData) => {
        if (readError) {
          console.log('An error occurred when reading', f)
          console.log(readError)
          reject(readError)
        }
        const decompressedFileName = f.slice(0, -3)
        const decompressedFilePath = compressedFilePath.slice(0, -3)

        zlib.gunzip(compressedData, (decompressError, decompressedData) => {
          if (decompressError) {
            console.log('An error ocurred when decompressing file', f)
            console.log(decompressError)
            reject(decompressError)
          }
          console.log('File decompressed with success', decompressedFileName)

          fs.writeFile(decompressedFilePath, decompressedData, writeError => {
            if (writeError) {
              console.log('An error ocurred when writing decompressed file', decompressedFileName)
              console.log(writeError)
              reject(writeError)
            }
            console.log('Decompressed file saved with success', decompressedFileName)
            deleteFile(compressedFilePath, resolve, reject)
          })
        })
      })
    })

    promises.push(promise)

    Promise.all(promises)
      .then(() => console.log('Done decompressing'))
      .catch((e) => console.log('An error ocurred when decompressing', e))
  })
}

const findURLinSitemap = url => {
  const allFiles = fs.readdirSync('./sitemaps')
  const xmlFileNames = allFiles.filter(f => f.match(/.xml$/) && !f.match('index'))

  if (!xmlFileNames.length) {
    console.log('XML files not found')
    return
  }

  console.log('Found', xmlFileNames.length, 'XML files')
  const foundFile = xmlFileNames.find(f => {
    console.log('Looking for URL in', f)
    const filePath = `./sitemaps/${f}`
    const urls = getUrlsfromFile(filePath)
    return urls.find(u => u === url)
  })

  if (foundFile) {
    console.log('Found', url, 'in', foundFile)
    return
  }

  console.log('URL not found: ', url)
}

const runProcess = url => {
  downloadFile(url).then(([indexFileName]) => {
    const sitemapFilesUrls = parseIndex(indexFileName)
    Promise.all(donwloadSitemaps(sitemapFilesUrls)).then(() => decompressFiles())
  })
}

module.exports = {
  runProcess,
  decompressFiles,
  findURLinSitemap,
}