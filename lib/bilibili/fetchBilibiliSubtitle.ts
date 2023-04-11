/*
 * @Author: Zhimin Mei 61093107+mzm1183710118@users.noreply.github.com
 * @Date: 2023-04-11 19:22:07
 * @LastEditors: Zhimin Mei 61093107+mzm1183710118@users.noreply.github.com
 * @LastEditTime: 2023-04-11 22:18:15
 * @FilePath: /OurProject/lib/bilibili/fetchBilibiliSubtitle.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { reduceBilibiliSubtitleTimestamp } from '~/utils/reduceSubtitleTimestamp'
import { fetchBilibiliSubtitleUrls } from './fetchBilibiliSubtitleUrls'

export async function fetchBilibiliSubtitle(
  videoId: string,
  pageNumber?: null | string,
  shouldShowTimestamp?: boolean,
) {
  const res = await fetchBilibiliSubtitleUrls(videoId, pageNumber)
  const { title, desc, dynamic, subtitle } = res || {}
  const hasDescription = desc || dynamic
  const descriptionText = hasDescription ? `${desc} ${dynamic}` : undefined
  const subtitleList = subtitle?.list
  if (!subtitleList || subtitleList?.length < 1) {
    return { title, subtitlesArray: null, descriptionText }
  }

  const betterSubtitle = subtitleList.find(({ lan }: { lan: string }) => lan === 'zh-CN') || subtitleList[0]
  const subtitleUrl = betterSubtitle?.subtitle_url?.startsWith('//')
    ? `https:${betterSubtitle?.subtitle_url}`
    : betterSubtitle?.subtitle_url
  console.log('subtitle_url', subtitleUrl)

  const subtitleResponse = await fetch(subtitleUrl)
  const subtitles = await subtitleResponse.json()
  const transcripts = reduceBilibiliSubtitleTimestamp(subtitles?.body, shouldShowTimestamp)
  return { title, subtitlesArray: transcripts, descriptionText }
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
