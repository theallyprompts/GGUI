import { useState } from 'react'
import { ArrowLeft, CheckCircle2, DollarSign, Info, ShieldCheck, Sparkles } from 'lucide-react'
import { useApiKeyStore } from '../store/apiKey.store'
import { validateApiKey } from '../lib/runware/client'
import { Modal } from './Modal'

export function ApiKeyGate({ children }: { children: React.ReactNode }) {
  const apiKey = useApiKeyStore((s) => s.apiKey)
  const [step, setStep] = useState<'intro' | 'key'>('intro')

  if (apiKey) return <>{children}</>
  if (step === 'intro') return <IntroStep onContinue={() => setStep('key')} />
  return <ApiKeyStep onBack={() => setStep('intro')} />
}

function IntroStep({ onContinue }: { onContinue: () => void }) {
  const [showLegal, setShowLegal] = useState(false)

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(60% 50% at 50% 0%, rgba(175,255,159,0.16), transparent 70%), radial-gradient(40% 40% at 85% 90%, rgba(144,247,124,0.10), transparent 70%)',
        }}
      />

      <div className="relative w-full max-w-2xl">
        <div className="mb-3 flex items-center gap-3">
          <span className="text-base font-medium text-neutral-30">Generic Generative UI</span>
        </div>

        <p className="mb-6 text-xs text-neutral-30">
          This is an independent personal project and is not officially affiliated with, endorsed
          by, or built by Runware.
        </p>

        <div className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-brand-green-text/30 bg-brand-green/10 px-3 py-1 text-xs font-medium text-brand-green-text">
          <Sparkles className="h-3.5 w-3.5" />
          Step 1 of 2 — What is this?
        </div>

        <h1 className="mb-4 text-3xl leading-tight font-bold text-neutral-5 sm:text-4xl">
          A visual front-end for{' '}
          <span
            className="bg-gradient-to-r from-brand-green to-brand-green-mid bg-clip-text text-transparent"
          >
            Runware's
          </span>{' '}
          image generation API
        </h1>

        <p className="mb-8 max-w-xl text-sm leading-relaxed text-neutral-20 sm:text-base">
          Runware is a B2B API provider — they host the models, and inference happens over API,
          built for developers to add generation into their own apps. This interface has no
          generation capability of its own. It's purely a visual way to build and fire off calls to
          Runware's API.
          <br />
          If you've used Civitai's Generator, this will feel familiar.
        </p>

        <div className="mb-8 grid gap-3 sm:grid-cols-2">
          <FeatureCard
            icon={<DollarSign className="h-4 w-4" />}
            title="Up to 99% cheaper"
            description="1K Z-Image Turbo generations start from $0.0006 — a fraction of most competitors' rates."
          />
          <FeatureCard
            icon={<ShieldCheck className="h-4 w-4" />}
            title="This app takes no money"
            description="A personal project, not affiliated with Runware or a commercial product. Your key, your Runware wallet, your account. Billing goes straight to Runware; this app never touches your funds."
          />
          <FeatureCard
            icon={<CheckCircle2 className="h-4 w-4" />}
            title="Familiar layout"
            description="Modelled closely after Civitai's Generator, so the controls should feel immediately familiar."
          />
          <button type="button" onClick={() => setShowLegal(true)} className="text-left">
            <FeatureCard
              icon={<Info className="h-4 w-4" />}
              title="Third-party client — read more"
              description="This app is an independent third-party interface for the Runware.ai API. Tap for details on responsibility and terms."
            />
          </button>
        </div>

        {showLegal && <LegalModal onClose={() => setShowLegal(false)} />}

        <div className="mb-8 rounded-lg border border-neutral-70 bg-card p-4">
          <p className="mb-2 text-sm font-semibold text-neutral-5">Before you continue, you'll need:</p>
          <ol className="space-y-1.5 text-sm text-neutral-20">
            <li className="flex gap-2">
              <span className="text-brand-green-text">1.</span>
              <span>
                A Runware account —{' '}
                <a
                  href="https://runware.ai/signup"
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand-green-text hover:underline"
                >
                  sign up here
                </a>
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-brand-green-text">2.</span>
              <span>
                A Runware API key —{' '}
                <a
                  href="https://runware.ai/api-keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand-green-text hover:underline"
                >
                  create one here
                </a>
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-brand-green-text">3.</span>
              <span>
                Funds in your Runware wallet —{' '}
                <a
                  href="https://runware.ai/wallet"
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand-green-text hover:underline"
                >
                  add credit here
                </a>{' '}
                (all major credit cards accepted)
              </span>
            </li>
          </ol>
        </div>

        <button
          onClick={onContinue}
          className="w-full rounded-md bg-gradient-to-r from-brand-green to-brand-green-mid px-4 py-3 text-sm font-semibold text-neutral-100 shadow-lg shadow-brand-green/10 transition hover:brightness-105 sm:w-auto sm:px-8"
        >
          Continue to API key →
        </button>
      </div>
    </div>
  )
}

function LegalModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="Third-party client disclosure" onClose={onClose}>
      <div className="space-y-3 text-sm leading-relaxed text-neutral-20">
        <p>
          This application is an independent third-party interface for the Runware.ai API. It is
          not operated by or affiliated with Runware.
        </p>
        <p>
          Users provide their own Runware API credentials and are responsible for their Runware
          account, API usage, prompts, inputs, and generated outputs.
        </p>
        <p>
          This application does not process payments for AI generation and does not add a markup
          or fee to Runware services.
        </p>
        <p>
          Generation requests are submitted directly to Runware using the user's credentials and
          are subject to Runware's{' '}
          <a
            href="https://runware.ai/terms"
            target="_blank"
            rel="noreferrer"
            className="text-brand-green-text hover:underline"
          >
            Terms of Service
          </a>{' '}
          and applicable model-specific rules.
        </p>
        <p>
          Users are responsible for ensuring that their use of the application and generated
          content complies with applicable laws and the terms governing the models they use.
        </p>
      </div>
    </Modal>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: React.ReactNode
}) {
  return (
    <div className="rounded-lg border border-neutral-70 bg-card p-3.5">
      <div className="mb-1.5 flex items-center gap-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-brand-green/15 text-brand-green-text">
          {icon}
        </span>
        <p className="text-sm font-semibold text-neutral-5">{title}</p>
      </div>
      <p className="text-xs leading-relaxed text-neutral-30">{description}</p>
    </div>
  )
}

function ApiKeyStep({ onBack }: { onBack: () => void }) {
  const setApiKey = useApiKeyStore((s) => s.setApiKey)
  const [value, setValue] = useState('')
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed) return

    setChecking(true)
    setError(null)
    try {
      const valid = await validateApiKey(trimmed)
      if (!valid) {
        setError('That API key was rejected by Runware. Double-check it and try again.')
        return
      }
      setApiKey(trimmed)
    } catch {
      setError('Could not reach Runware right now. Please try again in a moment.')
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-md rounded-lg border border-neutral-70 bg-card p-8 shadow-xl">
        <button
          onClick={onBack}
          className="mb-6 flex items-center gap-1.5 text-xs font-medium text-neutral-40 hover:text-neutral-20"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </button>

        <div className="mb-6 flex items-center gap-3">
          <span className="text-base font-medium text-neutral-30">Generic Generative UI</span>
        </div>

        <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-brand-green-text/30 bg-brand-green/10 px-3 py-1 text-xs font-medium text-brand-green-text">
          Step 2 of 2 — Connect your key
        </div>

        <h1 className="mb-2 text-lg font-semibold text-neutral-5">Enter your Runware API key</h1>
        <p className="mb-6 text-sm leading-relaxed text-neutral-20">
          This is an independent personal project, not officially affiliated with Runware. It's an
          unofficial UI that talks directly to Runware's API from your browser. We never see or
          store your key on a server — it stays in this browser only. This app takes no money of
          its own; all usage is billed directly by Runware to your account.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="password"
            autoComplete="off"
            spellCheck={false}
            placeholder="rw_..."
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full rounded-md border border-neutral-70 bg-input px-3 py-2 text-sm text-neutral-5 placeholder-neutral-50 outline-none focus:border-brand-green-text"
          />
          {error && <p className="text-sm text-brand-destructive">{error}</p>}
          <button
            type="submit"
            disabled={checking || !value.trim()}
            className="w-full rounded-md bg-brand-green px-3 py-2 text-sm font-semibold text-on-brand transition hover:bg-brand-green-mid disabled:cursor-not-allowed disabled:opacity-50"
          >
            {checking ? 'Checking…' : 'Continue'}
          </button>
        </form>

        <p className="mt-6 text-xs text-neutral-30">
          Don't have a key yet?{' '}
          <a
            href="https://runware.ai/api-keys"
            target="_blank"
            rel="noreferrer"
            className="text-brand-green-text hover:underline"
          >
            Create one at Runware
          </a>{' '}
          — you'll need to{' '}
          <a
            href="https://runware.ai/wallet"
            target="_blank"
            rel="noreferrer"
            className="text-brand-green-text hover:underline"
          >
            add credits
          </a>{' '}
          there to generate images.
        </p>
      </div>
    </div>
  )
}
