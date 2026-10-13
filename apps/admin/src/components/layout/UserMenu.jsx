import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, LogOut, User } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/utils/cn'

export function UserMenu() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2.5 pl-2 pr-1 py-1 rounded-lg hover:bg-neutral-50 transition-colors"
      >
        <Avatar name={user?.name} src={user?.avatarUrl} size="sm" />
        <div className="hidden sm:block text-left min-w-0">
          <p className="text-sm font-medium truncate max-w-[120px]">{user?.name}</p>
          <p className="text-[11px] text-neutral-400 truncate max-w-[120px]">
            {user?.jobTitle || user?.roleName}
          </p>
        </div>
        <ChevronDown size={14} className={cn('text-neutral-400 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-neutral-200 rounded-xl shadow-lg py-1 z-50">
          <div className="px-3 py-2 border-b border-neutral-100">
            <p className="text-xs text-neutral-400 truncate">{user?.email}</p>
          </div>
          <button
            type="button"
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50"
            onClick={() => {
              setOpen(false)
              navigate('/perfil')
            }}
          >
            <User size={14} />
            Meu perfil
          </button>
          <button
            type="button"
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
            onClick={() => {
              setOpen(false)
              logout()
            }}
          >
            <LogOut size={14} />
            Sair
          </button>
        </div>
      )}
    </div>
  )
}
