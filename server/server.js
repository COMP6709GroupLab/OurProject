const http = require('http')
const fs = require('fs')
const path = require('path')
const { URL } = require('url')

const UPLOAD_FOLDER = path.join(__dirname, '..', 'data')
console.log(UPLOAD_FOLDER)

if (!fs.existsSync(UPLOAD_FOLDER)) {
  fs.mkdirSync(UPLOAD_FOLDER, { recursive: true })
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`)
  const { pathname } = url

  if (req.method === 'POST' && pathname.startsWith('/save/')) {
    const [_0, _1, videoId, filename] = pathname.split('/')
    console.log('save file: ', videoId, filename)

    const folderpath = path.join(UPLOAD_FOLDER, videoId)
    if (!fs.existsSync(folderpath)) {
      fs.mkdirSync(folderpath, { recursive: true })
    }

    const filepath = path.join(folderpath, filename)
    let data = ''
    req.on('data', (chunk) => {
      data += chunk.toString()
    })
    req.on('end', () => {
      fs.writeFile(filepath, data, { encoding: 'utf-8' }, (err) => {
        if (err) {
          console.error(err)
          res.writeHead(500)
          res.end('Error saving file')
        } else {
          res.writeHead(200)
          res.end('file saved')
        }
      })
    })
  } else {
    res.writeHead(404)
    res.end('Not Found')
  }
})

server.listen(5001, '0.0.0.0', () => {
  console.log('server start')
})

process.on('SIGINT', () => {
  console.log('Stopping server...')
  server.close(() => {
    console.log('Server stopped.')
    process.exit()
  })
})
