import { Barrage, VideoConfig, VideoData } from '~/lib/types'
import { Comment } from '~/lib/types'
import { DEFAULT_LANGUAGE } from '~/utils/constants/language'
import { fetchOpenAiApi } from '~/lib/openai/fetchOpenAIResult'
import { saveResult, saveUserPrompt } from '~/serve/backend'

// # of selected barrages
const k = 40
const keywords = ['省流', '空降', '封面']

export async function processBarrage(
  videoConfig: VideoConfig,
  summarySentence: string,
  videoData: VideoData,
): Promise<string> {
  const barrages = [...videoData.barrages!]

  const counter = new Map<string, { barrage: Barrage; cnt: number }>()
  for (const barrage of barrages) {
    if (counter.has(barrage.text)) {
      const item = counter.get(barrage.text)!
      item.cnt += 1
    } else {
      counter.set(barrage.text, { barrage, cnt: 1 })
    }
  }

  const barrageItems = Array.from(counter.values()).sort((a, b) => b.cnt - a.cnt)

  const selectedBarrageItems = barrageItems.slice(0, k)

  for (let i = k; i < barrageItems.length; i++) {
    const item = barrageItems[i]
    if (keywords.some((keyword) => item.barrage.text.includes(keyword)) || containTimestamp(item.barrage.text)) {
      selectedBarrageItems.push(item)
    }
  }

  // get barrage summary
  return await fetchBarrageSummary(videoConfig, videoData.title, summarySentence, selectedBarrageItems)
}

function containTimestamp(text: string): boolean {
  const regex = /\d{2}:\d{2}/
  return text.search(regex) !== -1
}

/**
 * Fetch barrage summary. We use "bullet comments" to represent "弹幕"
 * @param videoConfig
 * @param title
 * @param summarySentence
 * @param barrageItems
 */
async function fetchBarrageSummary(
  videoConfig: VideoConfig,
  title: string,
  summarySentence: string,
  barrageItems: { barrage: Barrage; cnt: number }[],
) {
  const language = videoConfig.outputLanguage || DEFAULT_LANGUAGE
  const bulletCommentNumber = videoConfig.bulletCommentNumber || 15

  const instruction = `Your output should use the following markdown template (translate the title if needed):

## Selected bullet comments
BulletComment1 | BulletComment2 | BulletComment3


Your task is to find useful or interesting video bullet comments to fill in list. One for each row, if it's very short you can put the same row. Don't return other text after the bullet comment list. Don't select similar texts and make returns informative. You should provide up to ${bulletCommentNumber} comments. Avoid change text and keep the tone and intonation. Use the text above: {{Video title}} {{Summary}} {{Bullet comments}}. The comments are sorted by decreasing number of count. Interest information might be:
Key information in the video content, summarized by commenter (like price, date, timestamp, etc.)
Jump points like 1:00
Joke or funny comments related to the video content

Reply all in ${language} Language.`
  // backup: Character painting (might with emoji like [大哭])

  const prompt = `Video title: ${title}
URL: https://www.bilibili.com/video/${videoConfig.videoId}
Summary: ${summarySentence}
Bullet comments:
${barrageItems.map((item, i) => `${item.barrage.text}`).join('\n')}

Instructions: ${instruction}`

  await saveUserPrompt(videoConfig, '2-barrage-prompt', prompt)

  const [result, init] = await fetchOpenAiApi(videoConfig, prompt)
  if (init.status !== 200) {
    throw new Error(`OpenAI API Error: ${result}`)
  }

  await saveResult(videoConfig, '2-barrage-result', result)

  return result
}
