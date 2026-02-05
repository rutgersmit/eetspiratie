'use client'

type SortOption = 'newest' | 'oldest' | 'title-asc' | 'title-desc'

interface SortMenuProps {
  value: SortOption
  onChange: (value: SortOption) => void
}

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Nieuwste' },
  { value: 'oldest', label: 'Oudste' },
  { value: 'title-asc', label: 'Titel A–Z' },
  { value: 'title-desc', label: 'Titel Z–A' },
]

export default function SortMenu({ value, onChange }: SortMenuProps) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SortOption)}
        className="input appearance-none pr-10 cursor-pointer bg-white min-w-[140px]"
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
        <svg
          className="h-5 w-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 9l4-4 4 4m0 6l-4 4-4-4"
          />
        </svg>
      </div>
    </div>
  )
}
