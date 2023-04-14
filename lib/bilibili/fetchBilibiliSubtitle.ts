import { reduceBilibiliSubtitleTimestamp } from '~/utils/reduceSubtitleTimestamp'
import { fetchBilibiliSubtitleUrls } from './fetchBilibiliSubtitleUrls'
import { fetchBilibiliBarrageUrls } from './fetchBilibiliBarrageUrls'
import { fetchBilibiliCommentsUrls } from './fetchBilibiliCommentsUrls'
import { VideoData } from '~/lib/types'

export async function fetchBilibiliSubtitle(
  videoId: string,
  pageNumber?: null | string,
  shouldShowTimestamp?: boolean,
): Promise<VideoData> {
  const res = await fetchBilibiliSubtitleUrls(videoId, pageNumber)
  const { title, desc, dynamic, subtitle } = res || {}
  const hasDescription = desc || dynamic
  const descriptionText = hasDescription ? `${desc} ${dynamic}` : undefined
  const subtitleList = subtitle?.list

  console.log('fetch barrages')
  const barrages = await fetchBilibiliBarrageUrls(videoId, pageNumber)
  console.log('fetch comments')
  const comments = await fetchBilibiliCommentsUrls(videoId, pageNumber)

  if (!subtitleList || subtitleList?.length < 1) {
    return { title, subtitlesArray: null, descriptionText, barrages, comments }
  }

  const betterSubtitle = subtitleList.find(({ lan }: { lan: string }) => lan === 'zh-CN') || subtitleList[0]
  const subtitleUrl = betterSubtitle?.subtitle_url?.startsWith('//')
    ? `https:${betterSubtitle?.subtitle_url}`
    : betterSubtitle?.subtitle_url
  console.log('subtitle_url', subtitleUrl)

  const subtitleResponse = await fetch(subtitleUrl)
  const subtitles = await subtitleResponse.json()
  const transcripts = reduceBilibiliSubtitleTimestamp(subtitles?.body, shouldShowTimestamp)

  return { title, subtitlesArray: transcripts, descriptionText, barrages, comments }
}

// const res = await pRetry(async () => await fetchBilibiliSubtitles(videoId), {
//   onFailedAttempt: (error) => {
//     console.log(
//       `Attempt ${error.attemptNumber} failed. There are ${error.retriesLeft} retries left.`
//     );
//   },
//   retries: 2,
// });
// @ts-ignore
