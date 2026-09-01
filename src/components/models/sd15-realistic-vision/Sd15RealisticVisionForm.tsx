import { useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { useGenerationStore } from '../../../store/generation.store'
import { useSd15RealisticVisionStore, MAX_LORAS } from '../../../store/models/sd15RealisticVision.store'
import { useApiKeyStore } from '../../../store/apiKey.store'
import { SCHEDULERS, type Scheduler } from '../../../lib/runware/types'
import { generateImage, RunwareApiError } from '../../../lib/runware/client'
import type { ImageInferenceModelDefinition } from '../../../lib/models'
import { NumericSlider } from '../../NumericSlider'
import { Select } from '../../Select'
import { PromptTextField } from '../../PromptTextField'
import { AspectRatioPicker } from '../z-image/AspectRatioPicker'
import { ZImageImageInput } from '../z-image/ZImageImageInput'
import { LoraSettings } from '../z-image/LoraSettings'
import { VaeInput } from '../illustrious/VaeInput'

const OUTPUT_FORMATS = ['JPG', 'PNG', 'WEBP'] as const

export function Sd15RealisticVisionForm({ model }: { model: ImageInferenceModelDefinition }) {
  const apiKey = useApiKeyStore((s) => s.apiKey)
  const [showAdvanced, setShowAdvanced] = useState(true)
  const [showLora, setShowLora] = useState(false)

  const modelId = useGenerationStore((s) => s.modelId)

  const addJob = useGenerationStore((s) => s.addJob)
  const updateJob = useGenerationStore((s) => s.updateJob)
  const resetToDefault = useGenerationStore((s) => s.resetToDefault)

  const {
    positivePrompt,
    negativePrompt,
    aspectRatioLabel,
    resolutionTierLabel,
    width,
    height,
    steps,
    cfgScale,
    seed,
    quantity,
    scheduler,
    outputFormat,
    outputQuality,
    inputImage,
    strength,
    maskImage,
    maskMargin,
    outpaint,
    lora,
    vae,
    setField,
    setAspectRatio,
    setResolutionTier,
    setSteps,
    setCfgScale,
    setQuantity,
    setScheduler,
    setOutputFormat,
    setOutputQuality,
    setInputImage,
    setStrength,
    setMaskImage,
    setMaskMargin,
    setOutpaint,
    addLora,
    updateLora,
    removeLora,
  } = useSd15RealisticVisionStore()

  const seedMode = seed !== null ? 'custom' : 'random'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!apiKey || !positivePrompt.trim()) return

    const jobIds = Array.from({ length: quantity }, () => crypto.randomUUID())
    const createdAt = Date.now()
    for (const jobId of jobIds) {
      addJob({
        kind: 'sd15RealisticVision',
        id: jobId,
        status: 'pending',
        modelId,
        positivePrompt,
        negativePrompt,
        width,
        height,
        steps,
        cfgScale,
        seed,
        outputFormat,
        inputImage,
        strength,
        maskImage,
        maskMargin,
        outpaint,
        lora,
        vae,
        createdAt,
      })
    }

    const validLora = lora.filter((l) => l.model.trim().length > 0)

    const startedAt = performance.now()
    try {
      const { data: results, request, response } = await generateImage(apiKey, {
        model: model.id,
        positivePrompt,
        negativePrompt: negativePrompt || undefined,
        width,
        height,
        steps,
        CFGScale: cfgScale,
        seed: seed ?? undefined,
        numberResults: quantity,
        scheduler: scheduler === 'Default' ? undefined : scheduler,
        outputFormat,
        outputQuality,
        includeCost: true,
        inputs: inputImage
          ? { seedImage: inputImage, maskImage: maskImage ?? undefined }
          : undefined,
        strength: inputImage ? strength : undefined,
        maskMargin: inputImage && maskImage ? maskMargin : undefined,
        outpaint: inputImage && outpaint ? outpaint : undefined,
        lora: validLora.length > 0 ? validLora : undefined,
        vae: vae.trim() || undefined,
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
        <ZImageImageInput
          value={inputImage}
          onChange={setInputImage}
          maskValue={maskImage}
          onMaskChange={setMaskImage}
          maskMargin={maskMargin}
          outpaintValue={outpaint}
          onOutpaintChange={setOutpaint}
          model={model}
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

        {model.supportsNegativePrompt && (
          <PromptTextField
            label="Negative prompt"
            value={negativePrompt}
            onChange={(v) => setField('negativePrompt', v)}
            placeholder="Describe what you want to avoid…"
            rows={2}
            field="negative"
            activeEcosystem={model.ecosystem}
          />
        )}

        {outpaint ? (
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-sm font-medium text-neutral-5">Aspect ratio</label>
              <span className="font-mono text-xs text-neutral-40">
                {width}×{height}
              </span>
            </div>
            <p className="rounded-md border border-neutral-70 bg-card px-3 py-2 text-xs text-neutral-40">
              Size is determined by the extended canvas. Use "Extend canvas" on the input image to
              change it.
            </p>
          </div>
        ) : (
          <AspectRatioPicker
            model={model}
            aspectRatioLabel={aspectRatioLabel}
            resolutionTierLabel={resolutionTierLabel}
            width={width}
            height={height}
            onAspectRatioChange={setAspectRatio}
            onResolutionTierChange={setResolutionTier}
          />
        )}

        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-5">
            Output settings
          </label>
          <div className="grid grid-cols-2 gap-2">
            <Select label="Format" value={outputFormat} options={OUTPUT_FORMATS} onChange={setOutputFormat} />
            <Select label="Scheduler" value={scheduler} options={SCHEDULERS} onChange={(v) => setScheduler(v as Scheduler)} />
          </div>
        </div>

        <VaeInput value={vae} onChange={(v) => setField('vae', v)} />

        <button
          type="button"
          onClick={() => setShowLora((v) => !v)}
          className="flex w-full items-center justify-between rounded-md border border-neutral-70 bg-card px-3 py-2 text-sm font-medium text-neutral-5"
        >
          LoRA{lora.length > 0 ? ` (${lora.length})` : ''}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`h-3.5 w-3.5 text-neutral-40 transition-transform ${showLora ? 'rotate-180' : ''}`}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
          </svg>
        </button>
        {showLora && (
          <div className="rounded-md border border-neutral-70 bg-card p-3">
            <LoraSettings
              value={lora}
              max={MAX_LORAS}
              onAdd={addLora}
              onUpdate={updateLora}
              onRemove={removeLora}
            />
          </div>
        )}

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
            {inputImage && (
              <NumericSlider
                label="Denoise"
                tooltip="How much the generation deviates from the input image. 0 keeps the image essentially unchanged; 1 ignores the input image almost entirely and generates from the prompt alone."
                value={strength}
                min={0}
                max={1}
                step={0.01}
                onChange={setStrength}
              />
            )}
            {inputImage && maskImage && (
              <NumericSlider
                label="Mask margin"
                tooltip="Extra context pixels included around the masked region, so the model can blend the edit smoothly into the surrounding image. Runware requires a value between 32 and 128."
                value={maskMargin}
                min={32}
                max={128}
                onChange={setMaskMargin}
              />
            )}
            <NumericSlider
              label="CFG Scale"
              value={cfgScale}
              min={0}
              max={model.maxCFGScale}
              step={0.1}
              onChange={setCfgScale}
            />
            <NumericSlider
              label="Steps"
              value={steps}
              min={1}
              max={model.maxSteps}
              onChange={setSteps}
            />
            {outputFormat !== 'PNG' && (
              <NumericSlider
                label="Output quality"
                value={outputQuality}
                min={20}
                max={99}
                onChange={setOutputQuality}
              />
            )}

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
