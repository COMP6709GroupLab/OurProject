import { PassThrough } from 'stream'
import { find, sample } from '~/utils/fp'

interface Comment {
  like: number
  message: string
}

interface CommentsInfo {
  comment?: {
    list: Comment[]
  }
}

export const fetchBilibiliCommentsUrls = async (videoId: string, pageNumber?: null | string): Promise<CommentsInfo> => {
  const sessdata = sample(process.env.BILIBILI_SESSION_TOKEN?.split(','))
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
    Host: 'api.bilibili.com',
    Cookie: `SESSDATA=${sessdata}`,
  }
  const commonConfig: RequestInit = {
    method: 'GET',
    cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
    headers,
    referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
  }

  // get the cid, e.g:https://api.bilibili.com/x/web-interface/view?bvid=BV15T411a7bc
  const params = `?bvid=${videoId}`
  const requestUrl = `https://api.bilibili.com/x/web-interface/view${params}`
  const response = await fetch(requestUrl, commonConfig)
  const json = await response.json()
  const oid = json.data.aid
  // use the cid to get the Comments, e.g:https://api.bilibili.com/x/v2/reply?&type=1&pn=0&sort=2&oid=568696678
  const params2 = `oid=${oid}`
  const requestUrl2 = `https://api.bilibili.com/x/v2/reply?&type=1&pn=0&sort=2&${params2}`
  const response2 = await fetch(requestUrl2, commonConfig)
  const json2 = await response2.json()
  const comments: Comment[] = json2.data.replies.map((reply: any) => ({
    like: reply.like,
    message: reply.content.message,
  }))
  const result = { comment: { list: comments } }
  console.log(`comments length`, result.comment.list.length)
  return result
}
