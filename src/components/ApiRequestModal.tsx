import { useState } from 'react'
import { Check, Copy, ExternalLink } from 'lucide-react'
import { Modal } from './Modal'

interface ApiRequestModalProps {
  request: unknown
  response: unknown
  errorMessage?: string
  onClose: () => void
}

export function ApiRequestModal({ request, response, errorMessage, onClose }: ApiRequestModalProps) {
  return (
    <Modal title="API request" onClose={onClose} widthClassName="max-w-2xl">
      <div className="space-y-4">
        {errorMessage && (
          <div className="rounded-md border border-brand-destructive/30 bg-brand-destructive/10 p-3">
            <p className="mb-2 text-sm text-brand-destructive">{errorMessage}</p>
            <a
              href="https://runware.ai/contact?type=support"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-brand-destructive hover:underline"
            >
              Contact Runware support
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
        <CodeBlock label="Request" value={request} />
        <CodeBlock label="Response" value={response} />
      </div>
    </Modal>
  )
}

function CodeBlock({ label, value }: { label: string; value: unknown }) {
  const [copied, setCopied] = useState(false)
  const text = value !== undefined ? JSON.stringify(value, null, 2) : 'Not available for this generation.'

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard access denied or unavailable — nothing more we can do.
    }
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-40">{label}</p>
        <button
          onClick={handleCopy}
          disabled={value === undefined}
          title={`Copy ${label.toLowerCase()}`}
          aria-label={`Copy ${label.toLowerCase()}`}
          className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs text-neutral-40 transition-colors hover:bg-neutral-80 hover:text-neutral-5 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-brand-green-text" /> Copied
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" /> Copy
            </>
          )}
        </button>
      </div>
      <pre className="max-h-80 overflow-auto rounded-md border border-neutral-70 bg-input p-3 text-xs text-neutral-20">
        <code>{text}</code>
      </pre>
    </div>
  )
}
