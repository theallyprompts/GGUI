import { useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { useGenerationStore } from '../../../store/generation.store'
import { useMinimaxH3Store } from '../../../store/models/minimaxH3.store'
import { useApiKeyStore } from '../../../store/apiKey.store'
import { generateVideo, RunwareApiError } from '../../../lib/runware/client'
import type { VideoInferenceModelDefinition } from '../../../lib/models'
import { NumericSlider } from '../../NumericSlider'
import { Select } from '../../Select'
import { PromptTextField } from '../../PromptTextField'
import { VideoResolutionPicker } from './VideoResolutionPicker'
import { MinimaxH3InputSection } from './MinimaxH3InputSection'

const OUTPUT_FORMATS = ['MP4', 'WEBM', 'MOV'] as const

export function MinimaxH3Form({ model }: { model: VideoInferenceModelDefinition }) {
  const apiKey = useApiKeyStore((s) => s.apiKey)
  const [showAdvanced, setShowAdvanced] = useState(true)

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
    duration,
    seed,
    quantity,
    outputFormat,
    inputMode,
    frameImages,
    referenceImages,
    referenceVideos,
    referenceAudios,
    setField,
    setAspectRatio,
    setResolutionTier,
    setDuration,
    setQuantity,
    setOutputFormat,
    setInputMode,
    setFrameImage,
    addReferenceImage,
    removeReferenceImage,
    addReferenceVideo,
    removeReferenceVideo,
    addReferenceAudio,
    removeReferenceAudio,
  } = useMinimaxH3Store()

  const seedMode = seed !== null ? 'custom' : 'random'
  const hasFrameImages = frameImages.length > 0
  const hasReferences = referenceImages.length > 0 || referenceVideos.length > 0 || referenceAudios.length > 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!apiKey || !positivePrompt.trim()) return

    const jobIds = Array.from({ length: quantity }, () => crypto.randomUUID())
    const createdAt = Date.now()
    for (const jobId of jobIds) {
      addJob({
        kind: 'videoInference',
        id: jobId,
        status: 'pending',
        modelId,
        positivePrompt,
        aspectRatioLabel,
        resolutionTierLabel,
        width,
        height,
        duration,
        seed,
        outputFormat,
        inputMode,
        frameImages,
        referenceImages,
        referenceVideos,
        referenceAudios,
        createdAt,
      })
    }

    const inputs =
      inputMode === 'frames'
        ? hasFrameImages
          ? { frameImages: frameImages.map((f) => ({ image: f.image, frame: f.frame })) }
          : undefined
        : hasReferences
          ? {
              referenceImages: referenceImages.length > 0 ? referenceImages : undefined,
              referenceVideos: referenceVideos.length > 0 ? referenceVideos : undefined,
              referenceAudios: referenceAudios.length > 0 ? referenceAudios : undefined,
            }
          : undefined

    const startedAt = performance.now()
    try {
      const { data: results, request, response } = await generateVideo(
        apiKey,
        {
          model: model.id,
          positivePrompt,
          width: inputs?.frameImages ? undefined : width,
          height: inputs?.frameImages ? undefined : height,
          duration,
          seed: seed ?? undefined,
          numberResults: quantity,
          outputFormat,
          includeCost: true,
          inputs,
        },
        (progress) => {
          for (const jobId of jobIds) updateJob(jobId, { progress })
        },
      )
      const elapsedMs = Math.round(performance.now() - startedAt)
      jobIds.forEach((jobId, i) => {
        const result = results[i]
        if (result) {
          updateJob(jobId, {
            status: 'success',
            result,
            elapsedMs,
            progress: undefined,
            apiRequest: request,
            apiResponse: response,
          })
        } else {
          updateJob(jobId, { status: 'error', errorMessage: 'No video returned for this slot.' })
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
        <MinimaxH3InputSection
          model={model}
          inputMode={inputMode}
          onInputModeChange={setInputMode}
          frameImages={frameImages}
          onFrameImageChange={setFrameImage}
          referenceImages={referenceImages}
          onAddReferenceImage={addReferenceImage}
          onRemoveReferenceImage={removeReferenceImage}
          referenceVideos={referenceVideos}
          onAddReferenceVideo={addReferenceVideo}
          onRemoveReferenceVideo={removeReferenceVideo}
          referenceAudios={referenceAudios}
          onAddReferenceAudio={addReferenceAudio}
          onRemoveReferenceAudio={removeReferenceAudio}
        />

        <PromptTextField
          label="Prompt"
          required
          value={positivePrompt}
          onChange={(v) => setField('positivePrompt', v)}
          placeholder="Describe the video you want to see…"
          rows={4}
          field="positive"
          activeEcosystem={model.ecosystem}
        />

        {inputMode === 'frames' && hasFrameImages ? (
          <p className="rounded-md border border-neutral-70 bg-card px-3 py-2 text-xs text-neutral-40">
            Size is determined by the frame images and can't be set manually.
          </p>
        ) : (
          <VideoResolutionPicker
            model={model}
            aspectRatioLabel={aspectRatioLabel}
            resolutionTierLabel={resolutionTierLabel}
            width={width}
            height={height}
            onAspectRatioChange={setAspectRatio}
            onResolutionTierChange={setResolutionTier}
          />
        )}

        <NumericSlider
          label="Duration (seconds)"
          value={duration}
          min={model.minDuration}
          max={model.maxDuration}
          onChange={setDuration}
        />

        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-5">Output settings</label>
          <Select label="Format" value={outputFormat} options={OUTPUT_FORMATS} onChange={setOutputFormat} />
        </div>

        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="flex w-full items-center justify-between rounded-md border border-neutral-70 bg-card px-3 py-2 text-sm font-medium text-neutral-5"
        >
          Advanced
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`h-3.5 w-3.5 text-neutral-40 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
          </svg>
        </button>

        {showAdvanced && (
          <div className="flex flex-col gap-4 rounded-md border border-neutral-70 bg-card p-3">
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
        )}
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
