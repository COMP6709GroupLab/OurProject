import type { NextFetchEvent, NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { fetchSubtitle } from '~/lib/fetchSubtitle'
import { ChatGPTAgent, fetchOpenAIResult } from '~/lib/openai/fetchOpenAIResult'
import { getSmallSizeTranscripts } from '~/lib/openai/getSmallSizeTranscripts'
import { getUserSubtitlePrompt, getUserSubtitleWithTimestampPrompt } from '~/lib/openai/prompt'
import { selectApiKeyAndActivatedLicenseKey } from '~/lib/openai/selectApiKeyAndActivatedLicenseKey'
import { CommonSubtitleItem, SummarizeParams, VideoConfig, VideoData } from '~/lib/types'
import { isDev } from '~/utils/env'

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
    : getUserSubtitlePrompt(title, inputText, videoConfig)
  if (isDev) {
    // console.log("final system prompt: ", systemPrompt);
    // console.log("final example prompt: ", examplePrompt);
    console.log('final user prompt: ', userPrompt)
  }
  // yzx: save prompt
  await saveUserPrompt(videoConfig, userPrompt ?? '')

  // debug
  // return

  // after constructing the userPromt, we call the openai API to get the answer.
  try {
    const stream = true
    const openAiPayload = {
      model: 'gpt-3.5-turbo',
      messages: [
        // { role: ChatGPTAgent.system, content: systemPrompt },
        // { role: ChatGPTAgent.user, content: examplePrompt.input },
        // { role: ChatGPTAgent.assistant, content: examplePrompt.output },
        { role: ChatGPTAgent.user, content: userPrompt },
      ],
      // temperature: 0.5,
      // top_p: 1,
      // frequency_penalty: 0,
      // presence_penalty: 0,
      max_tokens: Number(videoConfig.detailLevel) || (userKey ? 800 : 600),
      stream,
      // n: 1,
    }

    // yzx: change to curie
    // const stream = false    // yzx: I change it to false so that we can get it at the server
    // const openAiPayload = {
    //   model: "text-curie-001",
    //   prompt: userPrompt,
    //   max_tokens: Number(videoConfig.detailLevel) || (userKey ? 800 : 600),
    //   temperature: 0.7,
    //   top_p: 1,
    //   frequency_penalty: 0,
    //   presence_penalty: 0,
    //   stream: stream
    // }

    // TODO: need refactor
    const openaiApiKey = await selectApiKeyAndActivatedLicenseKey(userKey, videoId)
    // here is the fetch function for the result
    const result = await fetchOpenAIResult(openAiPayload, openaiApiKey, videoConfig)
    if (stream) {
      const [stream0, stream1] = result.tee()
      setTimeout(() => {
        saveResultStream(videoConfig, stream0)
      })
      return new Response(stream1)
    }
    setTimeout(() => {
      saveResult(videoConfig, result)
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error(error.message)
    return new Response(
      JSON.stringify({
        errorMessage: error.message,
      }),
      {
        status: 500,
      },
    )
  }
}

async function saveVideoData(videoConfig: VideoConfig, videoData: VideoData) {
  if (process.env.DATA_SERVER_ENABLE !== 'true') {
    return
  }

  console.log('Save video data')

  const { videoId } = videoConfig

  // prepare content
  const data = { videoId, ...videoData }
  const content = JSON.stringify(data, null, 2)

  await saveFile(videoId, 'video.json', content)
}

async function saveUserPrompt(videoConfig: VideoConfig, inputText: string) {
  if (process.env.DATA_SERVER_ENABLE !== 'true') {
    return
  }
  console.log('Save prompt text')
  const { videoId } = videoConfig
  await saveFile(videoId, 'prompt.txt', inputText)
}

async function saveResultStream(videoConfig: VideoConfig, stream: ReadableStream) {
  if (process.env.DATA_SERVER_ENABLE !== 'true') {
    return
  }
  console.log('Process result stream')
  const decoder = new TextDecoder()
  let text = ''
  const reader = stream.getReader()

  while (true) {
    const { done, value } = await reader.read()
    if (done) {
      break
    }
    text += decoder.decode(value, { stream: !reader.closed })
  }

  saveResult(videoConfig, text).then(() => {
    console.log('Save result stream finished')
  })
}

async function saveResult(videoConfig: VideoConfig, resultText: string) {
  if (process.env.DATA_SERVER_ENABLE !== 'true') {
    return
  }
  console.log('Save result text')
  const { videoId } = videoConfig
  await saveFile(videoId, 'result.txt', resultText)
}

async function saveFile(videoId: string, filename: string, content: string) {
  const url = process.env.DATA_SERVER_HOSTNAME! + `/save/${videoId}/${filename}`
  console.log('Save file: ' + url)
  console.log(content)
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
    },
    body: content,
  })

  if (res.status !== 200) {
    console.log(res.status, res.statusText)
    const msg = await res.text()
    throw new Error(`Data Server Error: ${msg}`)
  }
}
