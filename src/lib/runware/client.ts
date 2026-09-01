import type {
  AccountManagementRequest,
  AccountManagementResult,
  GetResponseRequest,
  ImageInferenceRequest,
  ImageInferenceResult,
  MediaStorageDeleteRequest,
  MediaStorageDeleteResult,
  MediaStorageUploadRequest,
  MediaStorageUploadResult,
  ModelSearchRequest,
  ModelSearchResult,
  ModelUploadRequest,
  ModelUploadResult,
  RemoveBackgroundRequest,
  RemoveBackgroundResult,
  RunwareResponse,
  TaskStatusResult,
  UpscaleRequest,
  UpscaleResult,
  UsageActivityRequest,
  UsageActivityResult,
  UsageErrorsRequest,
  UsageErrorsResult,
  UsageGroupBy,
  UsagePerformanceRequest,
  UsagePerformanceResult,
  VideoInferenceRequest,
  VideoInferenceResult,
} from './types'

const RUNWARE_HTTP_ENDPOINT = 'https://api.runware.ai/v1'

export class RunwareApiError extends Error {
  code?: string
  parameter?: string
  /** The exact request object sent to Runware, for the "View API request" inspector. */
  request?: unknown
  /** The raw parsed response body (or undefined if the request never got a JSON response), for the "View API request" inspector. */
  response?: unknown

  constructor(
    message: string,
    code?: string,
    parameter?: string,
    request?: unknown,
    response?: unknown,
  ) {
    super(message)
    this.name = 'RunwareApiError'
    this.code = code
    this.parameter = parameter
    this.request = request
    this.response = response
  }
}

function makeTaskUUID(): string {
  return crypto.randomUUID()
}

export interface TaskCallResult<TResult> {
  data: TResult[]
  /** The exact request object sent to Runware (before JSON.stringify/array-wrapping), for display/debugging. */
  request: unknown
  /** The raw parsed response body, for display/debugging. */
  response: unknown
}

async function postTask<TResult>(apiKey: string, request: unknown): Promise<TaskCallResult<TResult>> {
  const res = await fetch(RUNWARE_HTTP_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify([request]),
  })

  const body = (await res.json()) as RunwareResponse<TResult>

  if (!res.ok || 'error' in body) {
    const first = 'errors' in body ? body.errors[0] : undefined
    const message = [first?.message, first?.additionalDetails?.responseContent]
      .filter(Boolean)
      .join(' — ')
    throw new RunwareApiError(
      message || `Runware request failed (HTTP ${res.status})`,
      first?.code,
      first?.parameter,
      request,
      body,
    )
  }

  return { data: body.data, request, response: body }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function generateImage(
  apiKey: string,
  params: Omit<ImageInferenceRequest, 'taskType' | 'taskUUID'>,
): Promise<TaskCallResult<ImageInferenceResult>> {
  const request: ImageInferenceRequest = {
    taskType: 'imageInference',
    taskUUID: makeTaskUUID(),
    ...params,
  }
  return postTask<ImageInferenceResult>(apiKey, request)
}

export async function upscaleImage(
  apiKey: string,
  params: Omit<UpscaleRequest, 'taskType' | 'taskUUID'>,
): Promise<TaskCallResult<UpscaleResult>> {
  const request: UpscaleRequest = {
    taskType: 'upscale',
    taskUUID: makeTaskUUID(),
    ...params,
  }
  return postTask<UpscaleResult>(apiKey, request)
}

export async function removeBackground(
  apiKey: string,
  params: Omit<RemoveBackgroundRequest, 'taskType' | 'taskUUID'>,
): Promise<TaskCallResult<RemoveBackgroundResult>> {
  const request: RemoveBackgroundRequest = {
    taskType: 'removeBackground',
    taskUUID: makeTaskUUID(),
    ...params,
  }
  return postTask<RemoveBackgroundResult>(apiKey, request)
}

const VIDEO_POLL_MAX_MS = 10 * 60 * 1000

export async function generateVideo(
  apiKey: string,
  params: Omit<VideoInferenceRequest, 'taskType' | 'taskUUID' | 'deliveryMethod'>,
  onProgress?: (progress: number | undefined) => void,
): Promise<TaskCallResult<VideoInferenceResult>> {
  const taskUUID = makeTaskUUID()
  const request: VideoInferenceRequest = {
    taskType: 'videoInference',
    taskUUID,
    deliveryMethod: 'async',
    ...params,
  }
  const submitCall = await postTask<VideoInferenceResult>(apiKey, request)

  const deadline = Date.now() + VIDEO_POLL_MAX_MS
  let delay = 2000
  while (Date.now() < deadline) {
    await sleep(delay)
    delay = Math.min(delay * 1.3, 10000)

    const pollRequest: GetResponseRequest = { taskType: 'getResponse', taskUUID }
    const pollCall = await postTask<TaskStatusResult>(apiKey, pollRequest)
    const status = pollCall.data.find((r) => r.taskUUID === taskUUID)
    if (!status) continue

    if (status.status === 'error') {
      throw new RunwareApiError('Video generation failed.')
    }
    if (status.status === 'success') {
      return {
        data: pollCall.data as unknown as VideoInferenceResult[],
        request: submitCall.request,
        response: pollCall.response,
      }
    }
    onProgress?.(status.progress)
  }

  throw new RunwareApiError('Video generation timed out.')
}

export async function getAccountDetails(apiKey: string): Promise<AccountManagementResult> {
  const request: AccountManagementRequest = {
    taskType: 'accountManagement',
    taskUUID: makeTaskUUID(),
    operation: 'getDetails',
  }
  const { data } = await postTask<AccountManagementResult>(apiKey, request)
  const [result] = data
  if (!result) throw new RunwareApiError('No account details returned.')
  return result
}

export interface UsageQueryParams {
  startDate: string
  endDate: string
  groupBy?: UsageGroupBy[]
  timezone?: string
}

export async function getUsageActivity(
  apiKey: string,
  params: UsageQueryParams,
): Promise<UsageActivityResult> {
  const request: UsageActivityRequest = {
    taskType: 'accountManagement',
    taskUUID: makeTaskUUID(),
    operation: 'getUsageActivity',
    ...params,
  }
  const { data } = await postTask<UsageActivityResult>(apiKey, request)
  const [result] = data
  if (!result) throw new RunwareApiError('No usage activity returned.')
  return result
}

export async function getUsagePerformance(
  apiKey: string,
  params: UsageQueryParams,
): Promise<UsagePerformanceResult> {
  const request: UsagePerformanceRequest = {
    taskType: 'accountManagement',
    taskUUID: makeTaskUUID(),
    operation: 'getUsagePerformance',
    ...params,
  }
  const { data } = await postTask<UsagePerformanceResult>(apiKey, request)
  const [result] = data
  if (!result) throw new RunwareApiError('No usage performance data returned.')
  return result
}

export async function getUsageErrors(
  apiKey: string,
  params: UsageQueryParams,
): Promise<UsageErrorsResult> {
  const request: UsageErrorsRequest = {
    taskType: 'accountManagement',
    taskUUID: makeTaskUUID(),
    operation: 'getUsageErrors',
    ...params,
  }
  const { data } = await postTask<UsageErrorsResult>(apiKey, request)
  const [result] = data
  if (!result) throw new RunwareApiError('No usage error data returned.')
  return result
}

export async function uploadModel(
  apiKey: string,
  params: Omit<ModelUploadRequest, 'taskType' | 'taskUUID'>,
): Promise<TaskCallResult<ModelUploadResult>> {
  const request: ModelUploadRequest = {
    taskType: 'modelUpload',
    taskUUID: makeTaskUUID(),
    ...params,
  }
  return postTask<ModelUploadResult>(apiKey, request)
}

export async function searchModels(
  apiKey: string,
  params: Omit<ModelSearchRequest, 'taskType' | 'taskUUID'>,
): Promise<TaskCallResult<ModelSearchResult>> {
  const request: ModelSearchRequest = {
    taskType: 'modelSearch',
    taskUUID: makeTaskUUID(),
    ...params,
  }
  return postTask<ModelSearchResult>(apiKey, request)
}

export async function uploadMedia(apiKey: string, media: string): Promise<MediaStorageUploadResult> {
  const request: MediaStorageUploadRequest = {
    taskType: 'mediaStorage',
    taskUUID: makeTaskUUID(),
    operation: 'upload',
    media,
  }
  const { data } = await postTask<MediaStorageUploadResult>(apiKey, request)
  const [result] = data
  if (!result) throw new RunwareApiError('No response returned from Runware.')
  return result
}

export async function deleteMedia(apiKey: string, mediaUUID: string): Promise<MediaStorageDeleteResult> {
  const request: MediaStorageDeleteRequest = {
    taskType: 'mediaStorage',
    taskUUID: makeTaskUUID(),
    operation: 'delete',
    media: mediaUUID,
  }
  const { data } = await postTask<MediaStorageDeleteResult>(apiKey, request)
  const [result] = data
  if (!result) throw new RunwareApiError('No response returned from Runware.')
  return result
}

export async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    await generateImage(apiKey, {
      model: 'runware:z-image@turbo',
      positivePrompt: 'a red apple on a white table',
      width: 512,
      height: 512,
      numberResults: 1,
    })
    return true
  } catch (err) {
    if (err instanceof RunwareApiError && err.code === 'invalidApiKey') return false
    if (err instanceof RunwareApiError) return true // key is valid, some other param/quota issue
    throw err
  }
}
