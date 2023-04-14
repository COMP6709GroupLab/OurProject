import { sample } from '~/utils/fp'
import { Barrage } from '~/lib/types'

export async function fetchBilibiliBarrageUrls(videoId: string, pageNumber?: null | string): Promise<Barrage[]> {
  const cid = await getVideoCid(videoId)
  const xmlText = await getBarrageXmlText(cid)
  return parseBarrageXmlText(xmlText)
}

async function getVideoCid(videoId: string): Promise<number> {
  const sessdata = sample(process.env.BILIBILI_SESSION_TOKEN?.split(','))
  const headers = {
    Accept: 'application/json, text/xml',
    'Content-Type': 'application/json, text/xml',
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
    'Accept-Encoding': 'gzip, deflate, br',

    Host: 'api.bilibili.com',
    Cookie: `SESSDATA=${sessdata}`,
  }
  const commonConfig: RequestInit = {
    method: 'GET',
    cache: 'no-cache',
    headers,
    referrerPolicy: 'no-referrer',
  }

  // get the cid, e.g:https://api.bilibili.com/x/player/pagelist?bvid=BV11v4y1L7CD
  const params = `?bvid=${videoId}`
  const requestUrl = `https://api.bilibili.com/x/player/pagelist${params}`
  const response = await fetch(requestUrl, commonConfig)
  const json = await response.json()
  const cid = json.data[0].cid
  console.log(`cid:`, cid)

  return cid
}

async function getBarrageXmlText(cid: number): Promise<string> {
  const requestUrl = process.env.DATA_SERVER_HOSTNAME + '/barrage/' + cid
  const response = await fetch(requestUrl, { method: 'GET', headers: { Accept: 'text/xml' } })
  const xmlText = await response.text()
  // console.log(xmlText)
  return xmlText
}

function parseBarrageXmlText(xmlText: string): Barrage[] {
  const barrageList: Barrage[] = []
  const regex = /<d p="(.+?)">(.+?)<\/d>/g
  let match
  while ((match = regex.exec(xmlText)) !== null) {
    const arr = match[1].split(',')
    const time = parseFloat(arr[0]),
      timestamp = parseInt(arr[4])
    const text = match[2]
    barrageList.push({ time, timestamp, text })
  }
  return barrageList
}
