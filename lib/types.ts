import { VideoConfigSchema } from '~/utils/schemas/video'

export type SummarizeParams = {
  videoConfig: VideoConfig
  userConfig: UserConfig
}
export type UserConfig = {
  userKey?: string
  shouldShowTimestamp?: boolean
}
export type VideoConfig = {
  videoId: string
  service?: VideoService
  pageNumber?: null | string
} & VideoConfigSchema

export enum VideoService {
  Bilibili = 'bilibili',
  Youtube = 'youtube',
  // todo: integrate with whisper API
  Podcast = 'podcast',
  Meeting = 'meeting',
  LocalVideo = 'local-video',
  LocalAudio = 'local-audio',
}

export type CommonSubtitleItem = {
  text: string
  index: number
  s?: number | string // start time of this subtitle
}

export type Comment = {
  text: string
  like: number // 点赞
  // other data...
}

export type Barrage = {
  time: number
  timestamp: number
  text: string
}

export type VideoData = {
  title: string
  subtitlesArray?: null | Array<CommonSubtitleItem>
  descriptionText?: string
  comments?: null | Array<Comment>
  barrages?: null | Array<Barrage>
}
