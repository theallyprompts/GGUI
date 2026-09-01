import {
  Image as ImageIcon,
  Clapperboard,
  Wand2,
  FolderOpen,
  BookText,
  Settings,
  CircleDollarSign,
  Sparkles,
  ArrowRight,
} from 'lucide-react'
import { useGenerationStore } from '../../../store/generation.store'
import { useAppChromeStore } from '../../../store/appChrome.store'
import { DEFAULT_MODEL } from '../../../lib/models'

interface FeatureItem {
  icon: typeof ImageIcon
  title: string
  description: string
  action: () => void
  actionLabel: string
}

function useFeatureItems(): FeatureItem[] {
  const setModelId = useGenerationStore((s) => s.setModelId)
  const setMainView = useGenerationStore((s) => s.setMainView)
  const openMyModels = useAppChromeStore((s) => s.openMyModels)
  const openSettings = useAppChromeStore((s) => s.openSettings)
  const openStats = useAppChromeStore((s) => s.openStats)
  const openBrowseModels = useAppChromeStore((s) => s.openBrowseModels)

  return [
    {
      icon: ImageIcon,
      title: 'Generate images',
      description: 'Pick a model from the dropdown above — Z-Image, FLUX, Seedream, SDXL/Pony, and more.',
      action: () => openBrowseModels('Image'),
      actionLabel: 'Browse image models',
    },
    {
      icon: Clapperboard,
      title: 'Generate video',
      description: 'Switch the Model dropdown to the Video category for text-to-video and image-to-video.',
      action: () => openBrowseModels('Video'),
      actionLabel: 'Browse video models',
    },
    {
      icon: Wand2,
      title: 'Utilities',
      description: 'Upscale, remove backgrounds, extract metadata from saved images, or upload your own models.',
      action: () => openBrowseModels('Utilities'),
      actionLabel: 'See utilities',
    },
    {
      icon: FolderOpen,
      title: 'Manage Media',
      description: 'Upload images you use often so they can be inserted anywhere as input, without re-uploading.',
      action: () => setModelId('utility:manage-media'),
      actionLabel: 'Open Manage Media',
    },
    {
      icon: BookText,
      title: 'Prompt Studio',
      description: 'Save whole prompts or reusable fragments, tagged by ecosystem, for quick reuse later.',
      action: () => setMainView('promptStudio'),
      actionLabel: 'Open Prompt Studio',
    },
    {
      icon: FolderOpen,
      title: 'My uploaded models',
      description: 'View and manage the checkpoints/LoRAs you\'ve registered with Runware via Upload Model.',
      action: openMyModels,
      actionLabel: 'View my models',
    },
    {
      icon: CircleDollarSign,
      title: 'Monitor usage & spend',
      description: 'Track your account balance, session spend, and set alerts before you hit a limit.',
      action: openStats,
      actionLabel: 'View usage & spend',
    },
    {
      icon: Settings,
      title: 'Settings',
      description: 'Set your API key, theme, default model, spend caps, and backup/restore your data.',
      action: openSettings,
      actionLabel: 'Open Settings',
    },
  ]
}

export function IntroductionForm() {
  const setModelId = useGenerationStore((s) => s.setModelId)
  const items = useFeatureItems()

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        <div>
          <h2 className="text-base font-semibold text-neutral-5">Welcome</h2>
          <p className="mt-1 text-sm text-neutral-40">
            Here's a quick tour of what you can do in this interface.
          </p>
        </div>

        <div className="space-y-2">
          {items.map((item) => (
            <button
              key={item.title}
              type="button"
              onClick={item.action}
              className="group flex w-full items-start gap-3 rounded-md border border-neutral-70 bg-input p-3 text-left transition-colors hover:border-brand-green-text hover:bg-brand-green/5"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-neutral-80 text-brand-green-text">
                <item.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-neutral-5">{item.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-neutral-40">{item.description}</p>
                <span className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-brand-green-text opacity-0 transition-opacity group-hover:opacity-100">
                  {item.actionLabel}
                  <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="shrink-0 border-t border-neutral-70 p-4">
        <button
          type="button"
          onClick={() => setModelId(DEFAULT_MODEL.id)}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-brand-green px-4 py-3 text-sm font-semibold text-on-brand transition hover:bg-brand-green-mid"
        >
          <Sparkles className="h-4 w-4" />
          Start Creating
        </button>
      </div>
    </div>
  )
}
