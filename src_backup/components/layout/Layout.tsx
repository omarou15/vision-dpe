import { Home, FileText, Settings, User, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation, Outlet } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { Button } from '../ui/Button'

export function Layout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const location = useLocation()
  const { user, logout } = useAuthStore()

  const navigation = [
    { name: 'Tableau de bord', href: '/dashboard', icon: Home },
    { name: 'Nouveau DPE', href: '/dpe', icon: FileText },
    { name: 'Paramètres', href: '/settings', icon: Settings },
  ]

  const isActive = (path: string) => {
    if (path === '/dpe') {
      return location.pathname.startsWith('/dpe')
    }
    return location.pathname === path
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex">
            <Link to="/dashboard" className="mr-6 flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">S</span>
              </div>
              <span className="font-bold text-lg hidden sm:inline-block">SHIELD</span>
            </Link>
          </div>
          
          <div className="flex flex-1 items-center justify-end space-x-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {user?.email}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="sm:hidden"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
        {/* Sidebar */}
        <aside className={`
          fixed inset-y-0 left-0 z-40 w-64 transform border-r bg-background transition-transform duration-200 ease-in-out md:relative md:translate-x-0 md:w-full md:bg-transparent
          ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="flex h-full flex-col pt-16 md:pt-6">
            <nav className="flex-1 space-y-1 px-3">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`
                      flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors
                      ${isActive(item.href)
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      }
                    `}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
            
            <div className="border-t p-4">
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={logout}
              >
                <User className="h-4 w-4" />
                Déconnexion
              </Button>
            </div>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {isMenuOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 md:hidden"
            onClick={() => setIsMenuOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex w-full flex-col overflow-hidden py-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
