import { find, sample } from '~/utils/fp'

type BilibiliBarrages = {
  barrageTime: number
  barrageText: string
}

interface BarrageInfo {
  barrage?: {
    list: BilibiliBarrages[]
  }
}

export const fetchBilibiliBarrageUrls = async (videoId: string, pageNumber?: null | string): Promise<void> => {
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
  // use the cid to get the barrage file, e.g:https://api.bilibili.com/x/v1/dm/list.so?oid=1058578591 or https://comment.bilibili.com/1058578591.xml
  const params2 = `${cid}`
  const requestUrl2 = `https://api.bilibili.com/x/v1/dm/list.so?oid=${params2}`
  console.log(`fetch barrage from:`, requestUrl2)
  const response2 = await fetch(requestUrl2, commonConfig)
  const XMLtext = await response2.text()
  //   return json2.data
}
