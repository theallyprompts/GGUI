export type TaskType =
  | 'imageInference'
  | 'upscale'
  | 'videoInference'
  | 'removeBackground'
  | 'extractMetadata'
  | 'uploadModel'
  | 'manageMedia'
  | 'introduction'

/** Broad style/architecture family a model belongs to — used by Prompt Studio to group and
 *  filter saved prompts, and (later) to key ecosystem-specific prompt-enhancer instructions.
 *  Pony/Illustrious share `sdxl-anime` since they're stylistically interchangeable checkpoints
 *  on the same base architecture, matching how Civitai's own ecosystem grouping collapses
 *  Pony/Illustrious/NoobAI to one shared root. */
export type Ecosystem = 'z-image' | 'flux' | 'seedream' | 'sdxl-anime' | 'sd15' | 'minimax-video'

export interface AspectRatioOption {
  label: string
  ratio: number // width / height
  icon: 'portrait-tall' | 'portrait' | 'square' | 'landscape' | 'landscape-wide'
}

export interface ResolutionTier {
  label: string
  megapixels: number
}

interface ModelDefinitionBase {
  id: string // Runware AIR ID
  label: string
  description: string
  thumbnail?: string
  taskType: TaskType
  /** Excluded from the model picker's selectable list, but still fully functional — findModel(), remix, and existing jobs referencing it keep working. */
  hidden?: boolean
  /** Absent for utility models (upscale/rembg/extract-metadata/upload-model/manage-media) — they don't generate from a prompt, so there's nothing for Prompt Studio to key against. */
  ecosystem?: Ecosystem
}

/** A selectable underlying model variant (e.g. FLUX.2 [klein] 9B vs 4B) sharing one form/picker entry. */
export interface ModelVariant {
  id: string // Runware AIR ID for this variant
  label: string
  pricePerMegapixel: number
}

export interface ImageInferenceModelDefinition extends ModelDefinitionBase {
  taskType: 'imageInference'
  /** Unused (no form controls rendered) when supportsSteps is false. */
  defaultSteps: number
  maxSteps: number
  /** Unused (no form controls rendered) when supportsSteps is false. */
  defaultCFGScale: number
  maxCFGScale: number
  supportsNegativePrompt: boolean
  /** Runware requires width/height multipleOf this value. */
  dimensionMultiple: number
  minDimension: number
  maxDimension: number
  aspectRatios: AspectRatioOption[]
  resolutionTiers: ResolutionTier[]
  /** Approximate cost per megapixel, in USD. Ignored (use pricePerImage instead) when pricePerImage is set. */
  pricePerMegapixel: number
  /** Flat approximate cost per generated image, in USD, regardless of resolution. Takes precedence over pricePerMegapixel. */
  pricePerImage?: number
  /** Which accelerator (caching) UI this model supports, if any. */
  acceleratorKind?: 'fbCache' | 'cacheStep'
  supportsVae?: boolean
  /** Selectable underlying model variants sharing this one form (e.g. 9B/4B). First is the default. */
  variants?: ModelVariant[]
  /** Max reference images for edit/conditioning (no seed-image+strength or mask/outpaint support). */
  maxReferenceImages?: number
  /** Simple 4-level acceleration (none/low/medium/high) instead of detailed cache options. */
  supportsAccelerationLevel?: boolean
  /** Model has no steps/CFGScale/scheduler controls at all (distinct from just hiding advanced options). */
  supportsSteps?: boolean
}

/** A pricing tier: pricePerImage applies when megapixels <= maxMegapixels (tiers are checked in order). */
export interface PricingTier {
  maxMegapixels: number
  pricePerImage: number
}

export interface UpscaleModelDefinition extends ModelDefinitionBase {
  taskType: 'upscale'
  minUpscaleFactor: number
  maxUpscaleFactor: number
  defaultUpscaleFactor: number
  minTargetMegapixels: number
  maxTargetMegapixels: number
  pricingTiers: PricingTier[]
}

/** A selectable underlying background-removal model variant (e.g. RemBG v1.4 vs BiRefNet Massive). */
export interface RemoveBackgroundModelVariant {
  id: string // Runware AIR ID for this variant
  label: string
  /** Approximate cost per run, in USD — varies with input image complexity in practice. */
  pricePerImage: number
  /** Whether this variant accepts the alphaMatting/postProcessMask settings (RemBG does; BiRefNet's schema exposes no settings at all). */
  supportsSettings: boolean
}

export interface RemoveBackgroundModelDefinition extends ModelDefinitionBase {
  taskType: 'removeBackground'
  /** Approximate cost per run, in USD — varies with input image complexity in practice. */
  pricePerImage: number
  supportsSettings: boolean
  /** Selectable underlying model variants sharing this one form (e.g. RemBG v1.4 / BiRefNet Massive). First is the default. */
  variants?: RemoveBackgroundModelVariant[]
}

/** One of the model's fixed, API-accepted (width, height) pairs — video models don't allow arbitrary sizes. */
export interface VideoResolutionOption {
  aspectRatioLabel: string
  resolutionTierLabel: string
  width: number
  height: number
}

export interface VideoInferenceModelDefinition extends ModelDefinitionBase {
  taskType: 'videoInference'
  aspectRatios: AspectRatioOption[]
  resolutionTiers: ResolutionTier[]
  /** The fixed (width, height) pairs the API accepts — cross product of aspectRatios x resolutionTiers. */
  resolutions: VideoResolutionOption[]
  minDuration: number
  maxDuration: number
  defaultDuration: number
  maxReferenceImages: number
  maxFrameImages: number
  maxReferenceVideos: number
  maxReferenceAudios: number
  /** Approximate cost per second of generated output video, in USD, at the cheapest resolution tier. */
  pricePerSecond: number
}

/** A purely client-side utility with no Runware API call of its own — reads generation
 *  metadata previously embedded into a saved image file. */
export interface ExtractMetadataModelDefinition extends ModelDefinitionBase {
  taskType: 'extractMetadata'
}

/** A utility for registering a self-hosted .safetensors file (checkpoint/LoRA/LyCORIS/VAE/
 *  embeddings) with Runware so it becomes usable as a `model`/`lora` value in other requests. */
export interface UploadModelModelDefinition extends ModelDefinitionBase {
  taskType: 'uploadModel'
}

/** A utility for uploading/deleting reusable media assets (Runware's mediaStorage API) —
 *  when active, replaces both the form pane AND the results/gallery pane with a media manager. */
export interface ManageMediaModelDefinition extends ModelDefinitionBase {
  taskType: 'manageMedia'
}

/** A pseudo-model with no Runware API call at all — a landing page pinned above the picker's
 *  category groups, replacing both the form pane AND the results pane with app orientation content. */
export interface IntroductionModelDefinition extends ModelDefinitionBase {
  taskType: 'introduction'
}

export type ModelDefinition =
  | ImageInferenceModelDefinition
  | UpscaleModelDefinition
  | VideoInferenceModelDefinition
  | RemoveBackgroundModelDefinition
  | ExtractMetadataModelDefinition
  | UploadModelModelDefinition
  | ManageMediaModelDefinition
  | IntroductionModelDefinition
