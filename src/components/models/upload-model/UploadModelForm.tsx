import { useState } from 'react'
import { ExternalLink, Loader2, TriangleAlert } from 'lucide-react'
import { useApiKeyStore } from '../../../store/apiKey.store'
import { uploadModel, RunwareApiError } from '../../../lib/runware/client'
import type { ModelUploadCategory, ModelUploadResult } from '../../../lib/runware/types'
import {
  UPLOAD_MODEL_ARCHITECTURES,
  UPLOAD_MODEL_CATEGORY_LABELS,
} from '../../../lib/models/uploadModelArchitectures'

const CATEGORIES = Object.keys(UPLOAD_MODEL_CATEGORY_LABELS) as ModelUploadCategory[]

export function UploadModelForm() {
  const apiKey = useApiKeyStore((s) => s.apiKey)

  const [category, setCategory] = useState<ModelUploadCategory>('checkpoint')
  const [architecture, setArchitecture] = useState(UPLOAD_MODEL_ARCHITECTURES.checkpoint[0])
  const [name, setName] = useState('')
  const [version, setVersion] = useState('v1')
  const [downloadURL, setDownloadURL] = useState('')
  const [isPrivate, setIsPrivate] = useState(true)
  const [tags, setTags] = useState('')
  const [triggerWords, setTriggerWords] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [result, setResult] = useState<ModelUploadResult | null>(null)

  const architectureOptions = UPLOAD_MODEL_ARCHITECTURES[category]

  function handleCategoryChange(next: ModelUploadCategory) {
    setCategory(next)
    setArchitecture(UPLOAD_MODEL_ARCHITECTURES[next][0])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!apiKey || !name.trim() || !downloadURL.trim()) return

    setIsSubmitting(true)
    setErrorMessage(null)
    setResult(null)
    try {
      const { data } = await uploadModel(apiKey, {
        category,
        format: 'safetensors',
        name: name.trim(),
        version: version.trim() || 'v1',
        downloadURL: downloadURL.trim(),
        architecture,
        private: isPrivate,
        tags: tags.trim() ? tags.split(',').map((t) => t.trim()).filter(Boolean) : undefined,
        positiveTriggerWords:
          category === 'lora' || category === 'lycoris' ? triggerWords.trim() || undefined : undefined,
      })
      const uploadResult = data[0]
      if (uploadResult) {
        setResult(uploadResult)
      } else {
        setErrorMessage('No response returned from Runware.')
      }
    } catch (err) {
      setErrorMessage(err instanceof RunwareApiError ? err.message : 'Something went wrong contacting Runware.')
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleReset() {
    setResult(null)
    setErrorMessage(null)
  }

  return (
    <form onSubmit={handleSubmit} className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        <div className="rounded-md border border-neutral-70 bg-input p-3 text-xs text-neutral-30">
          <p className="mb-1.5 font-medium text-neutral-5">Your file needs to be hosted somewhere first</p>
          <p className="mb-2">
            Runware fetches the .safetensors file from a URL you provide — it doesn't accept a direct
            upload from your computer. Host it somewhere with a public (or signed) download link, then
            paste that link below.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="https://huggingface.co/docs/hub/en/models-uploading"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-brand-green-text hover:underline"
            >
              Host on Hugging Face
              <ExternalLink className="h-3 w-3" />
            </a>
            <a
              href="https://docs.aws.amazon.com/AmazonS3/latest/userguide/upload-objects.html"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-brand-green-text hover:underline"
            >
              Host on S3
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-5">Category</label>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => handleCategoryChange(c)}
                className={`rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  category === c
                    ? 'border-neutral-5 bg-neutral-5 text-neutral-100'
                    : 'border-neutral-70 bg-input text-neutral-30 hover:bg-neutral-80'
                }`}
              >
                {UPLOAD_MODEL_CATEGORY_LABELS[c]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-5">Base architecture</label>
          <select
            value={architecture}
            onChange={(e) => setArchitecture(e.target.value)}
            className="w-full rounded-md border border-neutral-70 bg-input px-3 py-2 text-sm text-neutral-5 outline-none focus:border-brand-green-text"
          >
            {architectureOptions.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-5">
            Name <span className="text-brand-destructive">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Custom Model"
            className="w-full rounded-md border border-neutral-70 bg-input px-3 py-2 text-sm text-neutral-5 placeholder-neutral-50 outline-none focus:border-brand-green-text"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-5">Version</label>
          <input
            type="text"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            placeholder="v1"
            className="w-full rounded-md border border-neutral-70 bg-input px-3 py-2 text-sm text-neutral-5 placeholder-neutral-50 outline-none focus:border-brand-green-text"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-5">
            Download URL <span className="text-brand-destructive">*</span>
          </label>
          <input
            type="url"
            value={downloadURL}
            onChange={(e) => setDownloadURL(e.target.value)}
            placeholder="https://huggingface.co/.../model.safetensors"
            className="w-full rounded-md border border-neutral-70 bg-input px-3 py-2 text-sm text-neutral-5 placeholder-neutral-50 outline-none focus:border-brand-green-text"
          />
        </div>

        {(category === 'lora' || category === 'lycoris') && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-5">Trigger words</label>
            <input
              type="text"
              value={triggerWords}
              onChange={(e) => setTriggerWords(e.target.value)}
              placeholder="e.g. in the style of..."
              className="w-full rounded-md border border-neutral-70 bg-input px-3 py-2 text-sm text-neutral-5 placeholder-neutral-50 outline-none focus:border-brand-green-text"
            />
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-5">Tags</label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="comma, separated, tags"
            className="w-full rounded-md border border-neutral-70 bg-input px-3 py-2 text-sm text-neutral-5 placeholder-neutral-50 outline-none focus:border-brand-green-text"
          />
        </div>

        <div className="flex items-center justify-between rounded-md border border-neutral-70 bg-input p-2.5">
          <span className="text-xs font-medium text-neutral-5">Private</span>
          <button
            type="button"
            role="switch"
            aria-checked={isPrivate}
            onClick={() => setIsPrivate((v) => !v)}
            className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
              isPrivate ? 'bg-brand-green' : 'bg-neutral-70'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-neutral-5 transition-transform ${
                isPrivate ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {errorMessage && (
          <p className="flex items-start gap-2 rounded-md border border-brand-destructive/30 bg-brand-destructive/10 p-3 text-sm text-brand-destructive">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            {errorMessage}
          </p>
        )}

        {result && (
          <div
            className={`rounded-md border p-3 text-sm ${
              result.status === 'failed'
                ? 'border-brand-destructive/30 bg-brand-destructive/10 text-brand-destructive'
                : 'border-brand-green-text/30 bg-brand-green/10 text-brand-green-text'
            }`}
          >
            <p className="font-medium">Status: {result.status}</p>
            {result.message && <p className="mt-1 text-neutral-20">{result.message}</p>}
            {result.air && <p className="mt-1 font-mono text-xs text-neutral-30">AIR: {result.air}</p>}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 border-t border-neutral-70 bg-card p-3">
        <button
          type="submit"
          disabled={!name.trim() || !downloadURL.trim() || isSubmitting}
          className="flex flex-1 items-center justify-center gap-2 rounded-md bg-brand-green px-4 py-2.5 text-sm font-semibold text-on-brand transition hover:bg-brand-green-mid disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSubmitting ? 'Uploading…' : 'Upload model'}
        </button>
        {result && (
          <button
            type="button"
            onClick={handleReset}
            className="rounded-md border border-neutral-70 bg-input px-3 py-2.5 text-sm text-neutral-30 transition-colors hover:bg-neutral-80 hover:text-neutral-5"
          >
            Upload another
          </button>
        )}
      </div>
    </form>
  )
}
