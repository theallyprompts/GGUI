import { ImagePlus, Images } from 'lucide-react'
import { Modal } from '../../Modal'

interface UseAsInputModalProps {
  image: string
  onClose: () => void
  onSelect: (target: 'first' | 'last' | 'reference') => void
}

export function UseAsInputModal({ image, onClose, onSelect }: UseAsInputModalProps) {
  return (
    <Modal title="Add image to MiniMax H3" onClose={onClose}>
      <div className="flex flex-col gap-3">
        <div className="flex justify-center">
          <img src={image} alt="Selected" className="max-h-40 rounded-md border border-neutral-70 object-contain" />
        </div>
        <p className="text-xs text-neutral-40">
          Where should this image be used? Setting a frame or reference clears any existing input in
          the other mode.
        </p>

        <button
          type="button"
          onClick={() => onSelect('first')}
          className="flex items-center gap-3 rounded-md border border-neutral-70 bg-input px-3 py-2.5 text-left transition-colors hover:bg-neutral-80"
        >
          <ImagePlus className="h-4 w-4 shrink-0 text-neutral-30" />
          <span>
            <span className="block text-sm font-medium text-neutral-5">First frame</span>
            <span className="block text-xs text-neutral-40">Guides how the video begins</span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => onSelect('last')}
          className="flex items-center gap-3 rounded-md border border-neutral-70 bg-input px-3 py-2.5 text-left transition-colors hover:bg-neutral-80"
        >
          <ImagePlus className="h-4 w-4 shrink-0 rotate-180 text-neutral-30" />
          <span>
            <span className="block text-sm font-medium text-neutral-5">Last frame</span>
            <span className="block text-xs text-neutral-40">Guides how the video ends</span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => onSelect('reference')}
          className="flex items-center gap-3 rounded-md border border-neutral-70 bg-input px-3 py-2.5 text-left transition-colors hover:bg-neutral-80"
        >
          <Images className="h-4 w-4 shrink-0 text-neutral-30" />
          <span>
            <span className="block text-sm font-medium text-neutral-5">Reference image</span>
            <span className="block text-xs text-neutral-40">
              Guides style/subject without pinning a timeline position
            </span>
          </span>
        </button>
      </div>
    </Modal>
  )
}
