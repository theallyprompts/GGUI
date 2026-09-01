// Runware imageInference request/response shapes.
// Reference: https://runware.ai/docs/models/alibaba-z-image-turbo/schema.json

export interface RunwareLora {
  model: string
  weight?: number
}

export const SCHEDULERS = [
  'Default',
  'Euler',
  'Euler a',
  'Euler Beta',
  'Euler Karras',
  'DPM++',
  'DPM++ 2M',
  'DPM++ 2M Karras',
  'DPM++ 2M SDE',
  'DPM++ 2M SDE Karras',
  'DPM++ 3M',
  'DPM++ SDE',
  'DPM++ SDE Karras',
  'UniPC',
  'UniPC Karras',
  'Heun',
  'LCM',
  'LMS',
  'DDIM',
  'TCDScheduler',
] as const

export type Scheduler = (typeof SCHEDULERS)[number]

export interface OutpaintSpec {
  top: number
  bottom: number
  left: number
  right: number
  blur: number
}

export interface AcceleratorOptions {
  fbCache?: boolean
  fbCacheThreshold?: number
  teaCache?: boolean
  teaCacheDistance?: number
  dbCache?: boolean
  dbCacheThreshold?: number
}

/** Cache-step based accelerator shape used by FLUX.1 [dev] (no fbCache; adds absolute/percentage step windows). */
export interface CacheAcceleratorOptions {
  teaCache?: boolean
  teaCacheDistance?: number
  dbCache?: boolean
  dbCacheThreshold?: number
  dbCacheSkipInterval?: number
  cacheStartStep?: number
  cacheStartStepPercentage?: number
  cacheEndStep?: number
  cacheEndStepPercentage?: number
  cacheMaxConsecutiveSteps?: number
}

export interface ImageInferenceInputs {
  seedImage?: string
  maskImage?: string
  referenceImages?: string[]
}

/** Simple 4-level acceleration used by FLUX.2 [klein] — mutually exclusive with acceleratorOptions. */
export type AccelerationLevel = 'none' | 'low' | 'medium' | 'high'

export interface ImageInferenceRequest {
  taskType: 'imageInference'
  taskUUID: string
  model: string
  positivePrompt: string
  negativePrompt?: string
  width: number
  height: number
  steps?: number
  CFGScale?: number
  seed?: number
  numberResults?: number
  scheduler?: string
  outputFormat?: 'JPG' | 'PNG' | 'WEBP'
  outputQuality?: number
  includeCost?: boolean
  inputs?: ImageInferenceInputs
  strength?: number
  maskMargin?: number
  outpaint?: OutpaintSpec
  acceleration?: AccelerationLevel
  acceleratorOptions?: AcceleratorOptions | CacheAcceleratorOptions
  lora?: RunwareLora[]
  vae?: string
}

export interface ImageInferenceResult {
  taskType: 'imageInference'
  taskUUID: string
  imageUUID: string
  imageURL?: string
  seed?: number
  cost?: number
  NSFWContent?: boolean
}

export interface UpscaleSettings {
  enhanceDetails?: boolean
  realism?: boolean
}

export interface UpscaleRequest {
  taskType: 'upscale'
  taskUUID: string
  model: string
  inputs: {
    image: string
  }
  upscaleFactor?: number
  targetMegapixels?: number
  settings?: UpscaleSettings
  outputFormat?: 'JPG' | 'PNG' | 'WEBP'
  outputQuality?: number
  includeCost?: boolean
}

export interface UpscaleResult {
  taskType: 'upscale'
  taskUUID: string
  imageUUID: string
  imageURL?: string
  cost?: number
}

export interface FrameImageSpec {
  image: string
  frame: 'first' | 'last'
}

export interface VideoInferenceInputs {
  referenceImages?: string[]
  frameImages?: (string | FrameImageSpec)[]
  referenceVideos?: string[]
  referenceAudios?: string[]
}

export interface VideoInferenceRequest {
  taskType: 'videoInference'
  taskUUID: string
  model: string
  positivePrompt: string
  width?: number
  height?: number
  duration?: number
  seed?: number
  numberResults?: number
  outputFormat?: 'MP4' | 'WEBM' | 'MOV'
  outputQuality?: number
  includeCost?: boolean
  deliveryMethod?: 'async'
  inputs?: VideoInferenceInputs
}

export interface VideoInferenceResult {
  taskType: 'videoInference'
  taskUUID: string
  videoUUID: string
  videoURL?: string
  seed?: number
  cost?: number
  NSFWContent?: boolean
}

export interface RemoveBackgroundSettings {
  alphaMatting?: boolean
  alphaMattingBackgroundThreshold?: number
  alphaMattingErodeSize?: number
  alphaMattingForegroundThreshold?: number
  postProcessMask?: boolean
  returnOnlyMask?: boolean
  /** [R, G, B, A], each 0-255. Defaults to [255, 255, 255, 0] (fully transparent) per Runware's docs. */
  rgba?: [number, number, number, number]
}

export interface RemoveBackgroundRequest {
  taskType: 'removeBackground'
  taskUUID: string
  model: string
  inputs: {
    image: string
  }
  settings?: RemoveBackgroundSettings
  outputFormat?: 'JPG' | 'PNG' | 'WEBP'
  outputQuality?: number
  includeCost?: boolean
}

export interface RemoveBackgroundResult {
  taskType: 'removeBackground'
  taskUUID: string
  imageUUID?: string
  imageURL?: string
  cost?: number
}

export interface GetResponseRequest {
  taskType: 'getResponse'
  taskUUID: string
}

export interface MediaStorageUploadRequest {
  taskType: 'mediaStorage'
  taskUUID: string
  operation: 'upload'
  media: string
}

export interface MediaStorageDeleteRequest {
  taskType: 'mediaStorage'
  taskUUID: string
  operation: 'delete'
  media: string
}

export interface MediaStorageUploadResult {
  taskType: 'mediaStorage'
  taskUUID: string
  operation: 'upload'
  mediaUUID: string
  mediaURL: string
}

export interface MediaStorageDeleteResult {
  taskType: 'mediaStorage'
  taskUUID: string
  operation: 'delete'
  mediaUUID: string
}

export type ModelUploadCategory = 'checkpoint' | 'lora' | 'lycoris' | 'vae' | 'embeddings'

export interface ModelUploadRequest {
  taskType: 'modelUpload'
  taskUUID: string
  category: ModelUploadCategory
  format: 'safetensors'
  name: string
  version: string
  downloadURL: string
  architecture: string
  air?: string
  uniqueIdentifier?: string
  private?: boolean
  heroImageURL?: string
  tags?: string[]
  shortDescription?: string
  comment?: string
  type?: string
  defaultScheduler?: string
  defaultSteps?: number
  defaultCFG?: number
  defaultStrength?: number
  defaultWeight?: number
  positiveTriggerWords?: string
}

export interface ModelUploadResult {
  taskType: 'modelUpload'
  taskUUID: string
  status: 'validated' | 'downloaded' | 'optimized' | 'stored' | 'ready' | 'failed'
  message?: string
  air?: string
}

export type ModelSearchVisibility = 'public' | 'private' | 'favorite' | 'owned'

export interface ModelSearchRequest {
  taskType: 'modelSearch'
  taskUUID: string
  search: string
  source?: 'featured' | 'community'
  category?: ModelUploadCategory
  architecture?: string
  capabilities?: string[]
  visibility?: ModelSearchVisibility
  limit?: number
  offset?: number
  sort?: string
}

export interface ModelSearchResultItem {
  air: string
  name: string
  category: ModelUploadCategory
  architecture?: string | null
  capabilities?: string[]
  source?: string
  heroImage?: string | null
  private?: boolean
  isFavorite?: boolean
  provider?: string
  shortDescription?: string
  positiveTriggerWords?: string
}

export interface ModelSearchResult {
  taskType: 'modelSearch'
  taskUUID: string
  results?: ModelSearchResultItem[]
}

export interface AccountManagementRequest {
  taskType: 'accountManagement'
  taskUUID: string
  operation: 'getDetails'
}

export interface AccountManagementResult {
  taskType: 'accountManagement'
  taskUUID: string
  operation: 'getDetails'
  organizationUUID?: string
  organizationName?: string
  /** USD balance as a plain number — despite Runware's docs describing it as a {amount, freeBalance, currency} object. */
  balance?: number
}

export type UsageGroupBy = 'date' | 'model' | 'apiKey'

interface UsageRequestBase {
  taskType: 'accountManagement'
  taskUUID: string
  /** YYYY-MM-DD. Runware caps the (startDate, endDate) span at 30 days. */
  startDate: string
  endDate: string
  models?: string[]
  apiKeys?: string[]
  groupBy?: UsageGroupBy[]
  timezone?: string
}

export interface UsageActivityRequest extends UsageRequestBase {
  operation: 'getUsageActivity'
}

export interface UsagePerformanceRequest extends UsageRequestBase {
  operation: 'getUsagePerformance'
}

export interface UsageErrorsRequest extends UsageRequestBase {
  operation: 'getUsageErrors'
}

export interface UsageMeta {
  totalRequests?: number
  totalResults?: number
  totalSpend?: number
  avgDailySpend?: number
  projectedSpend?: number
  avgInferenceTime?: number
  p50InferenceTime?: number
  p90InferenceTime?: number
  p99InferenceTime?: number
  totalErrors?: number
  errorRate?: number
}

export interface UsageActivityTimeseriesRow {
  date: string
  count: number
  spend: number
}

export interface UsageActivityModelRow {
  date: string
  model: string
  modelName?: string
  count: number
  spend: number
}

export interface UsageActivityApiKeyRow {
  date: string
  apiKey: string
  count: number
  spend: number
}

export interface UsagePerformanceModelRow {
  date: string
  model: string
  modelName?: string
  apiKey?: string
  avgInferenceTime: number | null
  p90InferenceTime: number | null
  p99InferenceTime: number | null
}

export interface UsageErrorsTimeseriesRow {
  date: string
  clientErrors: number
  serverErrors: number
}

export interface UsageErrorsModelRow {
  date: string
  model: string
  modelName?: string
  apiKey?: string
  clientErrors: number
  serverErrors: number
}

export interface UsageActivityResult {
  taskType: 'accountManagement'
  taskUUID: string
  operation: 'getUsageActivity'
  startDate: string
  endDate: string
  usage: {
    timeseries?: { data: UsageActivityTimeseriesRow[]; meta: UsageMeta }
    model?: { data: UsageActivityModelRow[]; meta: UsageMeta }
    apiKey?: { data: UsageActivityApiKeyRow[]; meta: UsageMeta }
  }
}

export interface UsagePerformanceResult {
  taskType: 'accountManagement'
  taskUUID: string
  operation: 'getUsagePerformance'
  startDate: string
  endDate: string
  usage: {
    model?: { data: UsagePerformanceModelRow[]; meta: UsageMeta }
  }
}

export interface UsageErrorsResult {
  taskType: 'accountManagement'
  taskUUID: string
  operation: 'getUsageErrors'
  startDate: string
  endDate: string
  usage: {
    timeseries?: { data: UsageErrorsTimeseriesRow[]; meta: UsageMeta }
    model?: { data: UsageErrorsModelRow[]; meta: UsageMeta }
  }
}

export interface TaskStatusResult {
  taskType: string
  taskUUID: string
  status: 'processing' | 'success' | 'error'
  progress?: number
  videoUUID?: string
  videoURL?: string
  seed?: number
  cost?: number
  NSFWContent?: boolean
}

export interface RunwareErrorResponse {
  error: true
  errors: Array<{
    code: string
    message: string
    parameter?: string
    taskUUID?: string
    documentation?: string
    additionalDetails?: {
      responseContent?: string
      responseStatusCode?: number
    }
  }>
}

export interface RunwareSuccessResponse<T> {
  data: T[]
}

export type RunwareResponse<T> = RunwareSuccessResponse<T> | RunwareErrorResponse
