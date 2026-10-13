import { useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Camera, Trash2, Loader2 } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { profileService } from '@/services/settingsService'
import { ApiError } from '@/services/api'

export function AvatarUploader({ user, onUpdated, disabled }) {
  const inputRef = useRef(null)
  const [error, setError] = useState('')

  const uploadMutation = useMutation({
    mutationFn: (file) => profileService.uploadAvatar(file),
    onSuccess: (data) => {
      setError('')
      onUpdated?.(data.user)
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : 'Não foi possível enviar a foto.')
    },
  })

  const removeMutation = useMutation({
    mutationFn: () => profileService.removeAvatar(),
    onSuccess: (data) => {
      setError('')
      onUpdated?.(data.user)
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : 'Não foi possível remover a foto.')
    },
  })

  function handleFileChange(event) {
    const file = event.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Use JPG, PNG ou WebP (máx. 2 MB).')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('A imagem deve ter no máximo 2 MB.')
      return
    }

    uploadMutation.mutate(file)
    event.target.value = ''
  }

  const busy = uploadMutation.isPending || removeMutation.isPending

  return (
    <div className="flex flex-col sm:flex-row items-center gap-5">
      <div className="relative">
        <Avatar name={user?.name} src={user?.avatarUrl} size="lg" className="w-24 h-24 text-lg" />
        {!disabled && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="absolute bottom-0 right-0 p-2 rounded-full bg-[#003d7a] text-white shadow-md hover:bg-[#002d5a] disabled:opacity-50"
            aria-label="Alterar foto"
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      <div className="text-center sm:text-left space-y-2">
        <p className="text-sm font-medium text-neutral-900">Foto de perfil</p>
        <p className="text-xs text-neutral-500 max-w-xs">
          JPG, PNG ou WebP. Recomendado quadrado, mínimo 200×200 px.
        </p>
        {!disabled && user?.avatarUrl && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => removeMutation.mutate()}
            disabled={busy}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 size={14} />
            Remover foto
          </Button>
        )}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    </div>
  )
}
