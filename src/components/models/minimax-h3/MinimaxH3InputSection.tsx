import type { VideoInferenceModelDefinition } from '../../../lib/models'
import type { FrameImageEntry, MinimaxH3InputMode } from '../../../store/models/minimaxH3.store'
import { FrameImagesInput } from './FrameImagesInput'
import { ReferenceMediaList } from './ReferenceMediaList'

interface MinimaxH3InputSectionProps {
  model: VideoInferenceModelDefinition
  inputMode: MinimaxH3InputMode
  onInputModeChange: (mode: MinimaxH3InputMode) => void
  frameImages: FrameImageEntry[]
  onFrameImageChange: (frame: 'first' | 'last', image: string | null) => void
  referenceImages: string[]
  onAddReferenceImage: (image: string) => void
  onRemoveReferenceImage: (index: number) => void
  referenceVideos: string[]
  onAddReferenceVideo: (video: string) => void
  onRemoveReferenceVideo: (index: number) => void
  referenceAudios: string[]
  onAddReferenceAudio: (audio: string) => void
  onRemoveReferenceAudio: (index: number) => void
}

export function MinimaxH3InputSection({
  model,
  inputMode,
  onInputModeChange,
  frameImages,
  onFrameImageChange,
  referenceImages,
  onAddReferenceImage,
  onRemoveReferenceImage,
  referenceVideos,
  onAddReferenceVideo,
  onRemoveReferenceVideo,
  referenceAudios,
  onAddReferenceAudio,
  onRemoveReferenceAudio,
}: MinimaxH3InputSectionProps) {
  const canAddAudio = referenceImages.length > 0 || referenceVideos.length > 0

  return (
    <div>
      <div className="mb-2 flex overflow-hidden rounded-md border border-neutral-70">
        <button
          type="button"
          onClick={() => onInputModeChange('frames')}
          className={`flex-1 px-3 py-1.5 text-xs font-medium transition-colors ${
            inputMode === 'frames'
              ? 'bg-neutral-5 text-neutral-100'
              : 'bg-input text-neutral-30 hover:bg-neutral-80'
          }`}
        >
          Frame images
        </button>
        <button
          type="button"
          onClick={() => onInputModeChange('references')}
          className={`flex-1 border-l border-neutral-70 px-3 py-1.5 text-xs font-medium transition-colors ${
            inputMode === 'references'
              ? 'bg-neutral-5 text-neutral-100'
              : 'bg-input text-neutral-30 hover:bg-neutral-80'
          }`}
        >
          References
        </button>
      </div>

      {inputMode === 'frames' ? (
        <FrameImagesInput value={frameImages} onChange={onFrameImageChange} />
      ) : (
        <div className="flex flex-col gap-3">
          <ReferenceMediaList
            label="Reference images"
            kind="image"
            accept="image/*"
            value={referenceImages}
            max={model.maxReferenceImages}
            onAdd={onAddReferenceImage}
            onRemove={onRemoveReferenceImage}
          />
          <ReferenceMediaList
            label="Reference videos"
            kind="video"
            accept="video/*"
            value={referenceVideos}
            max={model.maxReferenceVideos}
            onAdd={onAddReferenceVideo}
            onRemove={onRemoveReferenceVideo}
          />
          <ReferenceMediaList
            label="Reference audio"
            kind="audio"
            accept="audio/*"
            value={referenceAudios}
            max={model.maxReferenceAudios}
            disabled={!canAddAudio}
            disabledHint="Add a reference image or video first."
            onAdd={onAddReferenceAudio}
            onRemove={onRemoveReferenceAudio}
          />
        </div>
      )}
    </div>
  )
}
