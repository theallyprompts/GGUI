import { Tooltip } from './Tooltip'

interface SelectProps<T extends string> {
  label: string
  value: T
  options: readonly T[]
  onChange: (value: T) => void
  tooltip?: string
}

export function Select<T extends string>({ label, value, options, onChange, tooltip }: SelectProps<T>) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1 text-xs font-medium text-neutral-20">
        {label}
        {tooltip && <Tooltip text={tooltip} />}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="w-full rounded-md border border-neutral-70 bg-input px-2.5 py-1.5 text-sm text-neutral-5 outline-none focus:border-brand-green-text"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  )
}
