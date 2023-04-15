import type { NextFetchEvent, NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { fetchSubtitle } from '~/lib/fetchSubtitle'
import { ChatGPTAgent, fetchOpenAiApi, fetchOpenAIResult } from '~/lib/openai/fetchOpenAIResult'
import { getSmallSizeTranscripts } from '~/lib/openai/getSmallSizeTranscripts'
import { getUserSubtitlePrompt, getUserSubtitleWithTimestampPrompt } from '~/lib/openai/prompt'
import { getApiKey, selectApiKeyAndActivatedLicenseKey } from '~/lib/openai/selectApiKeyAndActivatedLicenseKey'
import { CommonSubtitleItem, SummarizeParams, VideoConfig, VideoData } from '~/lib/types'
import { isDev } from '~/utils/env'
import { processComments } from '~/lib/openai/processComments'
import { saveResult, saveUserPrompt, saveVideoData } from '~/serve/backend'
import { processBarrage } from '~/lib/openai/processBarrage'

export const config = {
  runtime: 'edge',
}

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing env var from OpenAI')
}

if (process.env.DATA_SERVER_ENABLE === 'true') {
  if (!process.env.DATA_SERVER_HOSTNAME) {
    throw new Error('Missing env var DATA_SERVER_HOSTNAME')
  }
}

export default async function handler(req: NextRequest, context: NextFetchEvent) {
  const { videoConfig, userConfig } = (await req.json()) as SummarizeParams
  const { userKey, shouldShowTimestamp } = userConfig
  const { videoId } = videoConfig

  if (!videoId) {
    return new Response('No videoId in the request', { status: 500 })
  }
  // here, we get the title, subtitles and description
  // mzm's task is to add fetchComments() and fetchBarrage() functions.
  const videoData = await fetchSubtitle(videoConfig, shouldShowTimestamp)
  // yzx: save video data
  await saveVideoData(videoConfig, videoData)

  const { title, subtitlesArray, descriptionText } = videoData
  if (!subtitlesArray && !descriptionText) {
    console.error('No subtitle in the video: ', videoId)
    return new Response('No subtitle in the video', { status: 501 })
  }
  // if we do not have subtitleArray, we use descriptionText as an alternative
  const inputText = subtitlesArray ? getSmallSizeTranscripts(subtitlesArray, subtitlesArray) : descriptionText // subtitlesArray.map((i) => i.text).join("\n")

  // TODO: try the apiKey way for chrome extensions
  // const systemPrompt = getSystemPrompt({
  //   shouldShowTimestamp: subtitlesArray ? shouldShowTimestamp : false,
  // });
  // const examplePrompt = getExamplePrompt();

  // constrcut the userPrompt
  const userPrompt = shouldShowTimestamp
    ? getUserSubtitleWithTimestampPrompt(title, inputText, videoConfig)
    : getUserSubtitlePrompt(title, inputText, videoData, videoConfig)
  if (isDev) {
    // console.log("final system prompt: ", systemPrompt);
    // console.log("final example prompt: ", examplePrompt);
    console.log('final user prompt: ', userPrompt)
  }
  // yzx: save prompt
  await saveUserPrompt(videoConfig, '0-main-prompt', userPrompt ?? '')

  // debug
  // return

  const [mainResult, init0] = await fetchOpenAiApi(videoConfig, userPrompt)
  await saveResult(videoConfig, '0-main-result', mainResult)
  // get summarization (the second line of the result)
  const summarySentence = mainResult.split('\n')[1].trim()

  // get bullet comments summary. file have been saved in processComments()
  const barrageResult = await processBarrage(videoConfig, summarySentence, videoData)

  // get comments summary. file have been saved in processComments()
  const commentResult = await processComments(videoConfig, summarySentence, videoData)

  const fullResult = [mainResult, barrageResult, commentResult].join('\n\n')
  await saveResult(videoConfig, '3-full-result', fullResult)

  return new Response(fullResult, init0)
}
