const {
  decompressFiles,
  runProcess,
  findURLinSitemap
} = require('./handlers.js')

const args = process.argv.slice(2)

if (args[0] === '--find-urls') {
  if (!args[1]) {
    console.log('At least one URL is needed as argument')
    return
  }

  args.slice(1).forEach(url => findURLinSitemap(url))
} else if(args[0] === '--decompress-only') {
  decompressFiles()
} else if(args[0]) {
  runProcess(args[0])
} else {
  console.log('Invalid command')
}