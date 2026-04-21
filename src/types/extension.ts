// ĐỒNG BỘ với: C:\Users\admin\Downloads\tool\hr-recruitment-poster-extension\src\shared\types.ts
// Nếu extension update types, update file này tương ứng

export enum MessageType {
  PING = 'PING',
  PONG = 'PONG',
  FB_GROUP_PAGE_LOADED = 'FB_GROUP_PAGE_LOADED',
  GET_STATUS = 'GET_STATUS',
  STATUS_RESPONSE = 'STATUS_RESPONSE',
  START_QUEUE = 'START_QUEUE',
  EXECUTE_POST = 'EXECUTE_POST',
  POST_COMPLETE = 'POST_COMPLETE',
  QUEUE_DONE = 'QUEUE_DONE',
  QUEUE_PROGRESS = 'QUEUE_PROGRESS',
}

export type MessageSource =
  | 'hr-poster-webapp'
  | 'hr-poster-extension'
  | 'hr-poster-content'

export interface Message {
  id?: string
  source: MessageSource
  type: MessageType | string
  payload?: unknown
  timestamp?: number
}

export interface PostJob {
  id: string
  groupId: string
  groupUrl: string
  text: string
  mediaUrls?: string[]
}

export interface QueueProgressPayload {
  jobId: string
  groupId: string
  success: boolean
  error?: string
  doneCount: number
  totalCount: number
  timestamp: number
}

export interface PostResult {
  jobId: string
  groupId: string
  success: boolean
  error?: string
  timestamp: number
}

export interface QueueDonePayload {
  results: PostResult[]
  error?: string
}
