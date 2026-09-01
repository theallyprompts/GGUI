import { RotateCcw } from 'lucide-react'
import { useGenerationStore } from '../../../store/generation.store'
import { useUpscaleStore } from '../../../store/models/upscale.store'
import { useApiKeyStore } from '../../../store/apiKey.store'
import { upscaleImage, RunwareApiError } from '../../../lib/runware/client'
import { Select } from '../../Select'
import { NumericSlider } from '../../NumericSlider'
import { UpscaleImageInput } from './UpscaleImageInput'
import { UpscaleSettings } from './UpscaleSettings'
import type { UpscaleModelDefinition } from '../../../lib/models'

const OUTPUT_FORMATS = ['JPG', 'PNG', 'WEBP'] as const

export function UpscaleForm({ model }: { model: UpscaleModelDefinition }) {
  const apiKey = useApiKeyStore((s) => s.apiKey)
  const modelId = useGenerationStore((s) => s.modelId)

  const addJob = useGenerationStore((s) => s.addJob)
  const updateJob = useGenerationStore((s) => s.updateJob)
  const resetToDefault = useGenerationStore((s) => s.resetToDefault)

  const {
    inputImage,
    mode,
    upscaleFactor,
    targetMegapixels,
    enhanceDetails,
    realism,
    outputFormat,
    outputQuality,
    setInputImage,
    setMode,
    setUpscaleFactor,
    setTargetMegapixels,
    setEnhanceDetails,
    setRealism,
    setOutputFormat,
    setOutputQuality,
  } = useUpscaleStore()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!apiKey || !inputImage) return

    const jobId = crypto.randomUUID()
    const createdAt = Date.now()
    addJob({
      kind: 'upscale',
      id: jobId,
      status: 'pending',
      modelId,
      inputImage,
      upscaleFactor: mode === 'factor' ? upscaleFactor : undefined,
      targetMegapixels: mode === 'megapixels' ? targetMegapixels : undefined,
      enhanceDetails,
      realism,
      outputFormat,
      outputQuality,
      createdAt,
    })

    const startedAt = performance.now()
    try {
      const { data: results, request, response } = await upscaleImage(apiKey, {
        model: model.id,
        inputs: { image: inputImage },
        upscaleFactor: mode === 'factor' ? upscaleFactor : undefined,
        targetMegapixels: mode === 'megapixels' ? targetMegapixels : undefined,
        settings: { enhanceDetails, realism },
        outputFormat,
        outputQuality,
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
        <UpscaleImageInput value={inputImage} onChange={setInputImage} />

        <UpscaleSettings
          mode={mode}
          upscaleFactor={upscaleFactor}
          targetMegapixels={targetMegapixels}
          enhanceDetails={enhanceDetails}
          realism={realism}
          onModeChange={setMode}
          onUpscaleFactorChange={setUpscaleFactor}
          onTargetMegapixelsChange={setTargetMegapixels}
          onEnhanceDetailsChange={setEnhanceDetails}
          onRealismChange={setRealism}
        />

        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-5">
            Output settings
          </label>
          <div className="grid grid-cols-2 gap-2">
            <Select label="Format" value={outputFormat} options={OUTPUT_FORMATS} onChange={setOutputFormat} />
          </div>
          {outputFormat !== 'PNG' && (
            <div className="mt-2">
              <NumericSlider label="Output quality" value={outputQuality} min={20} max={99} onChange={setOutputQuality} />
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 border-t border-neutral-70 bg-card p-3">
        <button
          type="submit"
          disabled={!inputImage}
          className="flex-1 rounded-md bg-brand-green px-4 py-2.5 text-sm font-semibold text-on-brand transition hover:bg-brand-green-mid disabled:cursor-not-allowed disabled:opacity-50"
        >
          Upscale
        </button>
        <button
          type="button"
          onClick={resetToDefault}
          title="Reset upscale settings to defaults"
          aria-label="Reset upscale settings to defaults"
          className="rounded-md border border-neutral-70 bg-input p-2.5 text-neutral-30 transition-colors hover:bg-neutral-80 hover:text-neutral-5"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>
    </form>
  )
}
