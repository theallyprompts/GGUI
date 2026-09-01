import { ApiKeyGate } from './components/ApiKeyGate'
import { Header } from './components/Header'
import { GenerationForm } from './components/GenerationForm'
import { ResultsFeed } from './components/ResultsFeed'
import { ResizableSidebar } from './components/ResizableSidebar'
import { ManageMediaGallery } from './components/models/manage-media/ManageMediaGallery'
import { IntroductionShowcase } from './components/models/introduction/IntroductionShowcase'
import { PromptStudioView } from './components/PromptStudioView'
import { SpendAlerts } from './components/SpendAlerts'
import { useGenerationStore } from './store/generation.store'
import { MANAGE_MEDIA_MODEL, INTRODUCTION_MODEL } from './lib/models'

function App() {
  const mobileTab = useGenerationStore((s) => s.mobileTab)
  const setMobileTab = useGenerationStore((s) => s.setMobileTab)
  const modelId = useGenerationStore((s) => s.modelId)
  const mainView = useGenerationStore((s) => s.mainView)
  const isManagingMedia = modelId === MANAGE_MEDIA_MODEL.id
  const isIntroduction = modelId === INTRODUCTION_MODEL.id

  return (
    <ApiKeyGate>
      <div className="flex h-dvh flex-col overflow-x-hidden bg-bg">
        <SpendAlerts />
        <Header />

        <div className="flex shrink-0 border-b border-neutral-70 bg-card md:hidden">
          <MobileTabButton
            label="Generator"
            active={mobileTab === 'generator'}
            onClick={() => setMobileTab('generator')}
          />
          <MobileTabButton
            label={mainView === 'promptStudio' ? 'Saved Prompts' : 'Results'}
            active={mobileTab === 'results'}
            onClick={() => setMobileTab('results')}
          />
        </div>

        <div className="flex flex-1 overflow-hidden">
          <ResizableSidebar className={mobileTab === 'generator' ? 'block' : 'hidden md:block'}>
            <GenerationForm />
          </ResizableSidebar>
          <main
            className={`min-w-0 flex-1 overflow-y-auto ${mobileTab === 'results' ? 'block' : 'hidden md:block'}`}
          >
            {mainView === 'promptStudio' ? (
              <PromptStudioView />
            ) : isIntroduction ? (
              <IntroductionShowcase />
            ) : isManagingMedia ? (
              <ManageMediaGallery />
            ) : (
              <ResultsFeed />
            )}
          </main>
        </div>
      </div>
    </ApiKeyGate>
  )
}

function MobileTabButton({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
        active
          ? 'border-brand-green text-neutral-5'
          : 'border-transparent text-neutral-40 hover:text-neutral-20'
      }`}
    >
      {label}
    </button>
  )
}

export default App
