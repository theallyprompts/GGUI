import { useEffect, useState } from 'react'
import { ImageOff, Search, X } from 'lucide-react'

interface ShowcaseItem {
  /** Filename this slot expects under public/screenshots/ — drop a real screenshot in with this
   *  name and it renders automatically in place of the placeholder. */
  imageSrc: string
  title: string
  description: string
}

function ShowcaseLightbox({ item, onClose }: { item: ShowcaseItem; onClose: () => void }) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-6"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100/60 text-neutral-5 hover:bg-neutral-100/90"
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex max-h-full max-w-4xl flex-col items-center gap-3">
        <img
          src={item.imageSrc}
          alt={item.title}
          onClick={(e) => e.stopPropagation()}
          className="max-h-[80vh] max-w-full rounded-lg object-contain"
        />
        <p className="text-center text-sm text-neutral-30">{item.title}</p>
      </div>
    </div>
  )
}

const SHOWCASE_ITEMS: ShowcaseItem[] = [
  {
    imageSrc: '/screenshots/model-picker.png',
    title: 'Choose a model',
    description: 'The Model dropdown groups everything by Image, Video, and Utilities — search to filter.',
  },
  {
    imageSrc: '/screenshots/generation-form.png',
    title: 'Set up your generation',
    description: 'Each model has its own form — prompt, dimensions, reference images, and advanced settings.',
  },
  {
    imageSrc: '/screenshots/prompt-studio.png',
    title: 'Prompt Studio',
    description: 'Save full prompts or reusable fragments, and load them back into any compatible model.',
  },
  {
    imageSrc: '/screenshots/manage-media.png',
    title: 'Manage Media',
    description: 'Upload images you reuse often so they\'re one click away as input, anywhere in the app.',
  },
  {
    imageSrc: '/screenshots/settings.png',
    title: 'Settings',
    description: 'Your API key, theme, default model, spend caps, and backup/restore all live here.',
  },
]

function ShowcaseSlot({ item, reversed }: { item: ShowcaseItem; reversed: boolean }) {
  const [imageFailed, setImageFailed] = useState(false)
  const [showLightbox, setShowLightbox] = useState(false)
  const clickable = !imageFailed

  return (
    <div className={`flex flex-col gap-4 sm:flex-row sm:items-center ${reversed ? 'sm:flex-row-reverse' : ''}`}>
      <button
        type="button"
        onClick={() => clickable && setShowLightbox(true)}
        disabled={!clickable}
        aria-label={clickable ? `Enlarge screenshot: ${item.title}` : item.title}
        className={`group relative flex aspect-video w-full shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-input transition-all sm:w-72 ${
          clickable
            ? 'cursor-zoom-in border-neutral-70 hover:border-brand-green-text hover:shadow-[0_0_16px_rgba(175,255,159,0.35)]'
            : 'cursor-default border-neutral-70'
        }`}
      >
        {!imageFailed && (
          <img
            src={item.imageSrc}
            alt={item.title}
            className="h-full w-full object-cover"
            onError={() => setImageFailed(true)}
          />
        )}
        {imageFailed && (
          <div className="flex flex-col items-center gap-1.5 text-neutral-50">
            <ImageOff className="h-6 w-6" />
            <span className="text-[11px]">Screenshot coming soon</span>
          </div>
        )}
        {clickable && (
          <span className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-md bg-neutral-100/60 text-neutral-5 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
            <Search className="h-3.5 w-3.5" />
          </span>
        )}
      </button>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-neutral-5">{item.title}</p>
        <p className="mt-1 text-sm leading-relaxed text-neutral-40">{item.description}</p>
      </div>

      {showLightbox && <ShowcaseLightbox item={item} onClose={() => setShowLightbox(false)} />}
    </div>
  )
}

export function IntroductionShowcase() {
  return (
    <div className="mx-auto max-w-2xl space-y-8 p-6 sm:p-10">
      <div className="text-center">
        <h1 className="text-xl font-semibold text-neutral-5">Where things live</h1>
        <p className="mt-1.5 text-sm text-neutral-40">
          A quick look at the main parts of the interface before you dive in.
        </p>
      </div>

      <div className="space-y-8">
        {SHOWCASE_ITEMS.map((item, i) => (
          <ShowcaseSlot key={item.title} item={item} reversed={i % 2 === 1} />
        ))}
      </div>
    </div>
  )
}
