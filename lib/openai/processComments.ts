import { VideoConfig, VideoData } from '~/lib/types'
import { Comment } from '~/lib/types'
import { DEFAULT_LANGUAGE } from '~/utils/constants/language'
import { fetchOpenAiApi } from '~/lib/openai/fetchOpenAIResult'
import { saveResult, saveUserPrompt } from '~/serve/backend'

const k = 10
const keywords = ['省流', '空降', '封面']

export async function processComments(
  videoConfig: VideoConfig,
  summarySentence: string,
  videoData: VideoData,
): Promise<string> {
  const comments = [...videoData.comments!].sort((a, b) => b.like - a.like)
  const selectedComments = comments.slice(0, k)
  // pick comments in the rest of list
  for (let i = k; i < comments.length; i++) {
    const comment = comments[i]
    if (keywords.some((keyword) => comment.text.includes(keyword)) || containTimestamp(comment.text)) {
      selectedComments.push(comment)
    }
  }
  // get comment summary
  return await fetchCommentSummary(videoConfig, videoData.title, summarySentence, selectedComments)
}

function containTimestamp(text: string): boolean {
  const regex = /\d{2}:\d{2}/
  return text.search(regex) !== -1
}

async function fetchCommentSummary(
  videoConfig: VideoConfig,
  title: string,
  summarySentence: string,
  comments: Comment[],
) {
  const language = videoConfig.outputLanguage || DEFAULT_LANGUAGE
  const commentCount = videoConfig.commentNumber || 3

  const instruction = `Your output should use the following template:
## Hot comments
- Bulletpoint

Your task is to mining useful or interesting video comments. You should provide up to ${commentCount} concise bullet points. Avoid change comment text and keep the tone and intonation, unless it is too long. Use the text above: {{Video title}} {{Summary}} {{Comments}}. You should consider the video content via title. The comments are sorted by decreasing number of likes (which you should also consider). Interest information examples might be:
Some jump point like 1:00
Joke or funny comments related to the video content or the publisher
Key information summarized by commenter

Reply in ${language} Language.`
  // backup: Character painting (might with emoji like [大哭])

  const prompt = `Video title: ${title}
Summary: ${summarySentence}
Comments:
${comments.map((comment, i) => `${comment.text}`).join('\n')}

Instructions: ${instruction}`

  await saveUserPrompt(videoConfig, '1-comment-prompt', prompt)

  const [result, init] = await fetchOpenAiApi(videoConfig, prompt)
  if (init.status !== 200) {
    throw new Error(`OpenAI API Error: ${result}`)
  }

  await saveResult(videoConfig, '1-comment-result', result)

  return result
}
