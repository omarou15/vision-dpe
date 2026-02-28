import { useEffect, useState } from 'react'
import { Plus, FileText, Clock, CheckCircle, AlertCircle, TrendingUp, Building2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { useAuthStore } from '../../store/authStore'

// Mock data - will be replaced with IndexedDB data
const mockRecentDPEs = [
  { id: '1', address: '12 Rue de Paris, 75001 Paris', status: 'completed', date: '2024-02-20', label: 'D' },
  { id: '2', address: '45 Avenue Lyon, 69002 Lyon', status: 'in_progress', date: '2024-02-19', label: null },
  { id: '3', address: '8 Boulevard Marseille, 13001 Marseille', status: 'draft', date: '2024-02-18', label: null },
]

const stats = [
  { name: 'DPE complétés', value: '24', icon: CheckCircle, change: '+12%' },
  { name: 'En cours', value: '3', icon: Clock, change: '+1' },
  { name: 'Brouillons', value: '5', icon: FileText, change: '0' },
  { name: 'Moyenne étiquette', value: 'C', icon: TrendingUp, change: '-0.5' },
]

export function Dashboard() {
  const { user } = useAuthStore()
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'in_progress':
        return <Clock className="h-4 w-4 text-amber-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-slate-400" />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Terminé'
      case 'in_progress':
        return 'En cours'
      default:
        return 'Brouillon'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Bonjour, {user?.name || 'Utilisateur'}
          </h1>
          <p className="text-muted-foreground">
            Voici un aperçu de votre activité DPE
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
            isOnline 
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
          }`}>
            <div className={`h-2 w-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-amber-500'}`} />
            {isOnline ? 'En ligne' : 'Hors ligne'}
          </div>
          
          <Button asChild>
            <Link to="/dpe">
              <Plus className="mr-2 h-4 w-4" />
              Nouveau DPE
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.name}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.name}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  <span className={stat.change.startsWith('+') ? 'text-green-600' : 'text-slate-600'}>
                    {stat.change}
                  </span>
                  {' '}vs mois dernier
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Recent DPEs */}
      <Card>
        <CardHeader>
          <CardTitle>DPE récents</CardTitle>
          <CardDescription>
            Vos derniers diagnostics énergétiques
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockRecentDPEs.map((dpe) => (
              <Link
                key={dpe.id}
                to={`/dpe/${dpe.id}`}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{dpe.address}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {getStatusIcon(dpe.status)}
                      <span className="text-xs text-muted-foreground">
                        {getStatusLabel(dpe.status)} • {dpe.date}
                      </span>
                    </div>
                  </div>
                </div>
                
                {dpe.label && (
                  <div className={`
                    h-8 w-8 rounded flex items-center justify-center text-sm font-bold
                    ${dpe.label === 'A' ? 'bg-green-500 text-white' : ''}
                    ${dpe.label === 'B' ? 'bg-green-400 text-white' : ''}
                    ${dpe.label === 'C' ? 'bg-green-300 text-slate-900' : ''}
                    ${dpe.label === 'D' ? 'bg-yellow-400 text-slate-900' : ''}
                    ${dpe.label === 'E' ? 'bg-orange-400 text-white' : ''}
                    ${dpe.label === 'F' ? 'bg-orange-500 text-white' : ''}
                    ${dpe.label === 'G' ? 'bg-red-500 text-white' : ''}
                  `}>
                    {dpe.label}
                  </div>
                )}
              </Link>
            ))}
            
            {mockRecentDPEs.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Aucun DPE pour le moment</p>
                <Button asChild variant="outline" className="mt-4">
                  <Link to="/dpe">Créer votre premier DPE</Link>
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
