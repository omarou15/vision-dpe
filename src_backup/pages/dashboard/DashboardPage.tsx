import { FC } from 'react'
import { Link } from 'react-router-dom'

export const DashboardPage: FC = () => {
  return (
    <div className="container mx-auto p-4">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Vision DPE</h1>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-green-500" title="Connecté" />
        </div>
      </header>
      
      <div className="grid gap-4">
        <div className="rounded-lg border p-4">
          <h2 className="text-lg font-semibold mb-2">Projets DPE</h2>
          <p className="text-muted-foreground">
            Aucun projet pour le moment. Le dashboard sera bientôt disponible.
          </p>
        </div>
        
        <Link 
          to="/wizard/new" 
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Nouveau projet
        </Link>
      </div>
    </div>
  )
}