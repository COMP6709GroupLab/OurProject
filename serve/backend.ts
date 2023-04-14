import { VideoConfig, VideoData } from '~/lib/types'

export async function saveVideoData(videoConfig: VideoConfig, videoData: VideoData) {
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

export async function saveUserPrompt(videoConfig: VideoConfig, name: string, inputText: string) {
  if (process.env.DATA_SERVER_ENABLE !== 'true') {
    return
  }
  console.log('Save prompt text')
  const { videoId } = videoConfig
  await saveFile(videoId, name + '.txt', inputText)
}

export async function saveResultStream(videoConfig: VideoConfig, stream: ReadableStream) {
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

  saveResult(videoConfig, 'result', text).then(() => {
    console.log('Save result stream finished')
  })
}

export async function saveResult(videoConfig: VideoConfig, name: string, resultText: string) {
  if (process.env.DATA_SERVER_ENABLE !== 'true') {
    return
  }
  console.log('Save result text')
  const { videoId } = videoConfig
  await saveFile(videoId, name + '.txt', resultText)
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
  }).catch((err) => {
    console.error(err)
    throw new Error(`Data Server Error: ${err}`)
  })

  if (res.status !== 200) {
    console.log(res.status, res.statusText)
    const msg = await res.text()
    throw new Error(`Data Server Error: ${msg}`)
  }
}
