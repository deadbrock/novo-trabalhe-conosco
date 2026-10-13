import { Upload } from 'lucide-react'
import { cn } from '@/utils/cn'

const ACCEPT = '.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'

export function ResumeFilePicker({ file, onChange, error, disabled }) {
  return (
    <div>
      <label
        className={cn(
          'flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-8 text-center cursor-pointer transition-colors',
          error ? 'border-brand-red-300 bg-brand-red-50/30' : 'border-neutral-200 hover:border-brand-blue-300 hover:bg-brand-blue-50/30',
          disabled && 'opacity-60 pointer-events-none',
        )}
      >
        <Upload className="text-neutral-400" size={24} aria-hidden="true" />
        <div>
          <p className="text-sm font-medium text-neutral-800">
            {file ? file.name : 'Clique para selecionar seu currículo'}
          </p>
          <p className="text-xs text-neutral-500 mt-1">PDF, DOC ou DOCX · máx. 5MB</p>
        </div>
        <input
          type="file"
          accept={ACCEPT}
          className="sr-only"
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={error ? 'resume-error' : undefined}
          onChange={(event) => onChange(event.target.files?.[0] || null)}
        />
      </label>
      {error && (
        <p id="resume-error" className="mt-1 text-xs text-brand-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
