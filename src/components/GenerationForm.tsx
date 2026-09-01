import { useGenerationStore } from '../store/generation.store'
import { findModel } from '../lib/models'
import { ModelSelector } from './ModelSelector'
import { ModelCard } from './ModelCard'
import { ModelForm } from './models/registry'

export function GenerationForm() {
  const modelId = useGenerationStore((s) => s.modelId)
  const setModelId = useGenerationStore((s) => s.setModelId)
  const model = findModel(modelId)
  const isIntroduction = model.taskType === 'introduction'

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 space-y-2 p-4 pb-0">
        <label className="mb-1.5 block text-sm font-medium text-neutral-5">Model</label>
        <ModelSelector value={modelId} onChange={setModelId} />
        {!isIntroduction && <ModelCard model={model} />}
      </div>
      <div className="min-h-0 flex-1">
        <ModelForm model={model} />
      </div>
    </div>
  )
}
