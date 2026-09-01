import { RotateCcw } from 'lucide-react'
import { useGenerationStore } from '../../../store/generation.store'
import { useSeedream45Store } from '../../../store/models/seedream45.store'
import { useApiKeyStore } from '../../../store/apiKey.store'
import { generateImage, RunwareApiError } from '../../../lib/runware/client'
import type { ImageInferenceModelDefinition } from '../../../lib/models'
import { NumericSlider } from '../../NumericSlider'
import { Select } from '../../Select'
import { PromptTextField } from '../../PromptTextField'
import { AspectRatioPicker } from '../z-image/AspectRatioPicker'
import { ReferenceMediaList } from '../minimax-h3/ReferenceMediaList'

const OUTPUT_FORMATS = ['JPG', 'PNG', 'WEBP'] as const

export function Seedream45Form({ model }: { model: ImageInferenceModelDefinition }) {
  const apiKey = useApiKeyStore((s) => s.apiKey)

  const modelId = useGenerationStore((s) => s.modelId)
  const addJob = useGenerationStore((s) => s.addJob)
  const updateJob = useGenerationStore((s) => s.updateJob)
  const resetToDefault = useGenerationStore((s) => s.resetToDefault)

  const {
    positivePrompt,
    aspectRatioLabel,
    resolutionTierLabel,
    width,
    height,
    seed,
    quantity,
    outputFormat,
    outputQuality,
    referenceImages,
    setField,
    setAspectRatio,
    setResolutionTier,
    setQuantity,
    setOutputFormat,
    setOutputQuality,
    addReferenceImage,
    removeReferenceImage,
    updateReferenceImage,
  } = useSeedream45Store()

  const seedMode = seed !== null ? 'custom' : 'random'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!apiKey || !positivePrompt.trim()) return

    const jobIds = Array.from({ length: quantity }, () => crypto.randomUUID())
    const createdAt = Date.now()
    for (const jobId of jobIds) {
      addJob({
        kind: 'seedream45',
        id: jobId,
        status: 'pending',
        modelId,
        positivePrompt,
        width,
        height,
        seed,
        outputFormat,
        referenceImages,
        createdAt,
      })
    }

    const startedAt = performance.now()
    try {
      const { data: results, request, response } = await generateImage(apiKey, {
        model: model.id,
        positivePrompt,
        width,
        height,
        seed: seed ?? undefined,
        numberResults: quantity,
        outputFormat,
        outputQuality,
        includeCost: true,
        inputs: referenceImages.length > 0 ? { referenceImages } : undefined,
      })
      const elapsedMs = Math.round(performance.now() - startedAt)
      jobIds.forEach((jobId, i) => {
        const result = results[i]
        if (result) {
          updateJob(jobId, {
            status: 'success',
            result,
            elapsedMs,
            apiRequest: request,
            apiResponse: response,
          })
        } else {
          updateJob(jobId, { status: 'error', errorMessage: 'No image returned for this slot.' })
        }
      })
    } catch (err) {
      const message =
        err instanceof RunwareApiError ? err.message : 'Something went wrong contacting Runware.'
      const apiRequest = err instanceof RunwareApiError ? err.request : undefined
      const apiResponse = err instanceof RunwareApiError ? err.response : undefined
      for (const jobId of jobIds) {
        updateJob(jobId, { status: 'error', errorMessage: message, apiRequest, apiResponse })
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        <ReferenceMediaList
          label="Reference images"
          kind="image"
          accept="image/*"
          value={referenceImages}
          max={model.maxReferenceImages ?? 14}
          onAdd={addReferenceImage}
          onRemove={removeReferenceImage}
          onUpdate={updateReferenceImage}
        />

        <PromptTextField
          label="Prompt"
          required
          value={positivePrompt}
          onChange={(v) => setField('positivePrompt', v)}
          placeholder="Describe what you want to see…"
          rows={4}
          field="positive"
          activeEcosystem={model.ecosystem}
        />

        <AspectRatioPicker
          model={model}
          aspectRatioLabel={aspectRatioLabel}
          resolutionTierLabel={resolutionTierLabel}
          width={width}
          height={height}
          onAspectRatioChange={setAspectRatio}
          onResolutionTierChange={setResolutionTier}
        />

        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-5">
            Output settings
          </label>
          <div className="flex flex-col gap-2">
            <Select label="Format" value={outputFormat} options={OUTPUT_FORMATS} onChange={setOutputFormat} />
            {outputFormat !== 'PNG' && (
              <NumericSlider
                label="Output quality"
                value={outputQuality}
                min={20}
                max={99}
                onChange={setOutputQuality}
              />
            )}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-neutral-20">Seed</label>
          <div className="flex flex-wrap gap-2">
            <div className="flex shrink-0 overflow-hidden rounded-md border border-neutral-70">
              <button
                type="button"
                onClick={() => setField('seed', null)}
                className={`px-2.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                  seedMode === 'random'
                    ? 'bg-neutral-5 text-neutral-100'
                    : 'bg-input text-neutral-30 hover:bg-neutral-80'
                }`}
              >
                Random
              </button>
              <button
                type="button"
                onClick={() => setField('seed', seed ?? 0)}
                className={`border-l border-neutral-70 px-2.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                  seedMode === 'custom'
                    ? 'bg-neutral-5 text-neutral-100'
                    : 'bg-input text-neutral-30 hover:bg-neutral-80'
                }`}
              >
                Custom
              </button>
            </div>
            <input
              type="number"
              disabled={seedMode === 'random'}
              placeholder="Random"
              value={seed ?? ''}
              onChange={(e) =>
                setField('seed', e.target.value === '' ? null : Number(e.target.value))
              }
              className="min-w-0 flex-1 rounded-md border border-neutral-70 bg-input px-2.5 py-1.5 text-sm text-neutral-5 placeholder-neutral-50 outline-none focus:border-brand-green-text disabled:opacity-40"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 border-t border-neutral-70 bg-card p-3">
        <div className="flex items-center rounded-md border border-neutral-70 bg-input">
          <button
            type="button"
            onClick={() => setQuantity(quantity - 1)}
            className="px-2.5 py-2 text-neutral-30 hover:text-neutral-5"
          >
            −
          </button>
          <span className="w-6 text-center font-mono text-sm text-neutral-5">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity(quantity + 1)}
            className="px-2.5 py-2 text-neutral-30 hover:text-neutral-5"
          >
            +
          </button>
        </div>
        <button
          type="submit"
          disabled={!positivePrompt.trim()}
          className="flex-1 rounded-md bg-brand-green px-4 py-2.5 text-sm font-semibold text-on-brand transition hover:bg-brand-green-mid disabled:cursor-not-allowed disabled:opacity-50"
        >
          Generate
        </button>
        <button
          type="button"
          onClick={resetToDefault}
          title="Reset generation settings to defaults"
          aria-label="Reset generation settings to defaults"
          className="rounded-md border border-neutral-70 bg-input p-2.5 text-neutral-30 transition-colors hover:bg-neutral-80 hover:text-neutral-5"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>
    </form>
  )
}
