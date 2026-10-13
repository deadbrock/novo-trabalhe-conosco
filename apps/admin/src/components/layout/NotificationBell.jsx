import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Bell } from 'lucide-react'
import { notificationsService } from '@/services/notificationsService'

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  const { data, isFetching } = useQuery({
    queryKey: ['admin-notifications'],
    queryFn: () => notificationsService.list({ limit: 10 }),
    refetchInterval: 60_000,
  })

  const notifications = data?.notifications || []
  const unreadCount = data?.unreadCount || 0

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative p-2 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
        aria-label="Notificações"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-semibold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-neutral-200 bg-white shadow-lg z-50">
          <div className="px-4 py-3 border-b border-neutral-100">
            <p className="text-sm font-semibold text-neutral-900">Notificações</p>
            <p className="text-xs text-neutral-500 mt-0.5">Documentação aguardando validação</p>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {isFetching && notifications.length === 0 ? (
              <p className="px-4 py-6 text-sm text-neutral-400 text-center">Carregando...</p>
            ) : notifications.length === 0 ? (
              <p className="px-4 py-6 text-sm text-neutral-400 text-center">Nenhuma notificação no momento.</p>
            ) : (
              notifications.map((notification) => (
                <Link
                  key={notification.id}
                  to={notification.linkPath}
                  onClick={() => setOpen(false)}
                  className="block px-4 py-3 border-b border-neutral-50 hover:bg-neutral-50 transition-colors"
                >
                  <p className="text-sm font-medium text-neutral-900">{notification.title}</p>
                  <p className="text-xs text-neutral-600 mt-0.5">{notification.message}</p>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
