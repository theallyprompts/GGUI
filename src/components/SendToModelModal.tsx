import { useState } from 'react'
import { ChevronLeft, ImagePlus, Images } from 'lucide-react'
import { Modal } from './Modal'
import { findModel, MINIMAX_H3_MODEL } from '../lib/models'
import { useGenerationStore } from '../store/generation.store'
import {
  isMinimaxH3Model,
  setInputImageForModel,
  setMinimaxH3Input,
  IMAGE_INPUT_MODEL_IDS,
  type MinimaxH3InputTarget,
} from '../store/models/dispatch'

interface SendToModelModalProps {
  image: string
  onClose: () => void
  /** Called after the image has been placed. */
  onSent?: (modelId: string) => void
}

/** Model picker for "use as input image" actions — lists every model that accepts an
 *  externally-sourced image, then (for models with more than one input slot, e.g. MiniMax H3's
 *  first/last frame vs reference) asks which slot to fill. */
export function SendToModelModal({ image, onClose, onSent }: SendToModelModalProps) {
  const [pendingMinimax, setPendingMinimax] = useState(false)
  const setModelId = useGenerationStore((s) => s.setModelId)

  function handlePickModel(modelId: string) {
    if (isMinimaxH3Model(modelId)) {
      setPendingMinimax(true)
      return
    }
    setInputImageForModel(modelId, image)
    setModelId(modelId)
    onSent?.(modelId)
    onClose()
  }

  function handlePickMinimaxTarget(target: MinimaxH3InputTarget) {
    setMinimaxH3Input(image, target)
    setModelId(MINIMAX_H3_MODEL.id)
    onSent?.(MINIMAX_H3_MODEL.id)
    onClose()
  }

  if (pendingMinimax) {
    return (
      <Modal title="Add image to MiniMax H3" onClose={onClose}>
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => setPendingMinimax(false)}
            className="flex items-center gap-1 self-start text-xs text-neutral-40 transition-colors hover:text-neutral-5"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Back
          </button>

          <div className="flex justify-center">
            <img src={image} alt="Selected" className="max-h-40 rounded-md border border-neutral-70 object-contain" />
          </div>
          <p className="text-xs text-neutral-40">
            Where should this image be used? Setting a frame or reference clears any existing input
            in the other mode.
          </p>

          <SlotButton
            icon={<ImagePlus className="h-4 w-4 shrink-0 text-neutral-30" />}
            title="First frame"
            description="Guides how the video begins"
            onClick={() => handlePickMinimaxTarget('first')}
          />
          <SlotButton
            icon={<ImagePlus className="h-4 w-4 shrink-0 rotate-180 text-neutral-30" />}
            title="Last frame"
            description="Guides how the video ends"
            onClick={() => handlePickMinimaxTarget('last')}
          />
          <SlotButton
            icon={<Images className="h-4 w-4 shrink-0 text-neutral-30" />}
            title="Reference image"
            description="Guides style/subject without pinning a timeline position"
            onClick={() => handlePickMinimaxTarget('reference')}
          />
        </div>
      </Modal>
    )
  }

  return (
    <Modal title="Send image to model" onClose={onClose}>
      <div className="flex flex-col gap-3">
        <div className="flex justify-center">
          <img src={image} alt="Selected" className="max-h-40 rounded-md border border-neutral-70 object-contain" />
        </div>
        <p className="text-xs text-neutral-40">Choose which model to send this image to as input.</p>

        <div className="flex flex-col gap-1.5">
          {IMAGE_INPUT_MODEL_IDS.map((modelId) => {
            const model = findModel(modelId)
            return (
              <button
                key={modelId}
                type="button"
                onClick={() => handlePickModel(modelId)}
                className="flex items-center gap-3 rounded-md border border-neutral-70 bg-input px-3 py-2.5 text-left transition-colors hover:bg-neutral-80"
              >
                <ImagePlus className="h-4 w-4 shrink-0 text-neutral-30" />
                <span className="text-sm font-medium text-neutral-5">{model.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </Modal>
  )
}

function SlotButton({
  icon,
  title,
  description,
  onClick,
}: {
  icon: React.ReactNode
  title: string
  description: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 rounded-md border border-neutral-70 bg-input px-3 py-2.5 text-left transition-colors hover:bg-neutral-80"
    >
      {icon}
      <span>
        <span className="block text-sm font-medium text-neutral-5">{title}</span>
        <span className="block text-xs text-neutral-40">{description}</span>
      </span>
    </button>
  )
}
