const http = require('http')
const fs = require('fs')
const path = require('path')
const { URL } = require('url')

const UPLOAD_FOLDER = path.join(__dirname, '..', 'data')
console.log(UPLOAD_FOLDER)

if (!fs.existsSync(UPLOAD_FOLDER)) {
  fs.mkdirSync(UPLOAD_FOLDER, { recursive: true })
}

const server = http.createServer(async (req, res) => {
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
  } else if (req.method === 'GET' && pathname.startsWith('/barrage/')) {
    const [_0, _1, cid] = pathname.split('/')
    console.log('get barrage: ', cid)

    const { default: axios } = await import('axios')

    const resp = await axios.get(`https://api.bilibili.com/x/v1/dm/list.so?oid=${cid}`, {
      headers: {
        Accept: 'text/xml',
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
        'Accept-Encoding': 'gzip, deflate, br',
        Host: 'api.bilibili.com',
      },
    })
    const text = resp.data.toString()
    console.log('barrage: ', text.slice(0, 100))

    res.writeHead(200)
    res.end(text)
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
