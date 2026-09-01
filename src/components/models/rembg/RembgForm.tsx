import { RotateCcw } from 'lucide-react'
import { useGenerationStore } from '../../../store/generation.store'
import { useRembgStore } from '../../../store/models/rembg.store'
import { useApiKeyStore } from '../../../store/apiKey.store'
import { removeBackground, RunwareApiError } from '../../../lib/runware/client'
import { Tooltip } from '../../Tooltip'
import { UpscaleImageInput } from '../upscale/UpscaleImageInput'
import type { RemoveBackgroundModelDefinition } from '../../../lib/models'

export function RembgForm({ model }: { model: RemoveBackgroundModelDefinition }) {
  const apiKey = useApiKeyStore((s) => s.apiKey)
  const modelId = useGenerationStore((s) => s.modelId)

  const addJob = useGenerationStore((s) => s.addJob)
  const updateJob = useGenerationStore((s) => s.updateJob)
  const resetToDefault = useGenerationStore((s) => s.resetToDefault)

  const {
    variantId,
    inputImage,
    alphaMatting,
    postProcessMask,
    setVariantId,
    setInputImage,
    setAlphaMatting,
    setPostProcessMask,
  } = useRembgStore()

  const variants = model.variants ?? []
  const activeVariant = variants.find((v) => v.id === variantId) ?? variants[0]
  const supportsSettings = activeVariant?.supportsSettings ?? model.supportsSettings

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!apiKey || !inputImage) return

    const jobId = crypto.randomUUID()
    const createdAt = Date.now()
    addJob({
      kind: 'removeBackground',
      id: jobId,
      status: 'pending',
      modelId,
      variantId,
      inputImage,
      alphaMatting,
      postProcessMask,
      outputFormat: 'PNG',
      createdAt,
    })

    const startedAt = performance.now()
    try {
      const { data: results, request, response } = await removeBackground(apiKey, {
        model: variantId,
        inputs: { image: inputImage },
        settings: supportsSettings ? { alphaMatting, postProcessMask } : undefined,
        outputFormat: 'PNG',
        includeCost: true,
      })
      const elapsedMs = Math.round(performance.now() - startedAt)
      const result = results[0]
      if (result) {
        updateJob(jobId, {
          status: 'success',
          result,
          elapsedMs,
          apiRequest: request,
          apiResponse: response,
        })
      } else {
        updateJob(jobId, { status: 'error', errorMessage: 'No image returned.' })
      }
    } catch (err) {
      const message =
        err instanceof RunwareApiError ? err.message : 'Something went wrong contacting Runware.'
      const apiRequest = err instanceof RunwareApiError ? err.request : undefined
      const apiResponse = err instanceof RunwareApiError ? err.response : undefined
      updateJob(jobId, { status: 'error', errorMessage: message, apiRequest, apiResponse })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        {variants.length > 1 && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-5">Variant</label>
            <div className="flex overflow-hidden rounded-md border border-neutral-70">
              {variants.map((variant) => (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => setVariantId(variant.id)}
                  className={`flex-1 px-3 py-1.5 text-sm font-medium transition-colors ${
                    variantId === variant.id
                      ? 'bg-neutral-5 text-neutral-100'
                      : 'bg-input text-neutral-30 hover:bg-neutral-80'
                  } ${variant !== variants[0] ? 'border-l border-neutral-70' : ''}`}
                >
                  {variant.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <UpscaleImageInput value={inputImage} onChange={setInputImage} />

        <p className="text-xs text-neutral-40">
          Output is always a PNG with a transparent background.
        </p>

        {supportsSettings ? (
          <div className="flex flex-col gap-3">
            <ToggleRow
              label="Alpha matting"
              tooltip="Refines foreground edges for a cleaner cutout, at the cost of extra processing."
              enabled={alphaMatting}
              onChange={setAlphaMatting}
            />
            <ToggleRow
              label="Post-process mask"
              tooltip="Applies additional cleanup to the generated mask to improve accuracy."
              enabled={postProcessMask}
              onChange={setPostProcessMask}
            />
          </div>
        ) : (
          <p className="text-xs text-neutral-40">This variant has no configurable settings.</p>
        )}
      </div>

      <div className="flex items-center gap-2 border-t border-neutral-70 bg-card p-3">
        <button
          type="submit"
          disabled={!inputImage}
          className="flex-1 rounded-md bg-brand-green px-4 py-2.5 text-sm font-semibold text-on-brand transition hover:bg-brand-green-mid disabled:cursor-not-allowed disabled:opacity-50"
        >
          Remove background
        </button>
        <button
          type="button"
          onClick={resetToDefault}
          title="Reset settings to defaults"
          aria-label="Reset settings to defaults"
          className="rounded-md border border-neutral-70 bg-input p-2.5 text-neutral-30 transition-colors hover:bg-neutral-80 hover:text-neutral-5"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>
    </form>
  )
}

function ToggleRow({
  label,
  tooltip,
  enabled,
  onChange,
}: {
  label: string
  tooltip: string
  enabled: boolean
  onChange: (enabled: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between rounded-md border border-neutral-70 bg-input p-2.5">
      <span className="flex items-center gap-1 text-xs font-medium text-neutral-5">
        {label}
        <Tooltip text={tooltip} />
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => onChange(!enabled)}
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
          enabled ? 'bg-brand-green' : 'bg-neutral-70'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-neutral-5 transition-transform ${
            enabled ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  )
}
