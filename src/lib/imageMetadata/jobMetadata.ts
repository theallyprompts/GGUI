import type { GenerationJob } from '../../store/generation.store'

/**
 * The embedded payload's schema version. Bump this if the stripped-job shape changes in a way
 * that would break `parseEmbeddedJob` reading an older image's metadata.
 */
const SCHEMA_VERSION = 1

export interface EmbeddedJobPayload {
  app: 'runware-generator'
  version: typeof SCHEMA_VERSION
  job: GenerationJob
}

/** Field names that hold data URIs (input/mask/reference images, etc) — stripped before embedding
 *  since they'd bloat the file by megabytes and can't be reconstructed from the output image anyway. */
const DATA_URI_FIELDS = [
  'inputImage',
  'maskImage',
  'referenceImages',
  'referenceVideos',
  'referenceAudios',
  'frameImages',
] as const

/** Strips data-URI-bearing fields and the (often large) apiRequest/apiResponse debug payloads,
 *  producing a slim JSON string safe to embed in an image file. */
export function serializeJobMetadata(job: GenerationJob): string {
  const stripped: Record<string, unknown> = { ...job }
  for (const field of DATA_URI_FIELDS) {
    if (field in stripped) {
      stripped[field] = Array.isArray(stripped[field]) ? [] : null
    }
  }
  delete stripped.apiRequest
  delete stripped.apiResponse

  const payload: EmbeddedJobPayload = {
    app: 'runware-generator',
    version: SCHEMA_VERSION,
    job: stripped as unknown as GenerationJob,
  }
  return JSON.stringify(payload)
}

/** Parses a previously embedded payload back into a job-shaped object, or null if the text
 *  isn't recognizable as ours (wrong app, unsupported version, malformed JSON, or missing the
 *  minimal fields every job kind is expected to have). */
export function parseEmbeddedJob(text: string): GenerationJob | null {
  try {
    const parsed = JSON.parse(text) as Partial<EmbeddedJobPayload>
    if (parsed.app !== 'runware-generator' || !parsed.job) return null
    const job = parsed.job as Partial<GenerationJob>
    if (typeof job.kind !== 'string' || typeof job.modelId !== 'string' || typeof job.id !== 'string') {
      return null
    }
    return parsed.job
  } catch {
    return null
  }
}
