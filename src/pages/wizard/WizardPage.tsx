import { FC } from 'react'
import { useParams, Link } from 'react-router-dom'

export const WizardPage: FC = () => {
  const { projectId, step } = useParams()
  
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← Retour
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Projet: {projectId}</span>
          {step && <span className="text-sm text-muted-foreground">Étape {step}/13</span>}
        </div>
      </header>
      
      <main className="container mx-auto p-4">
        <div className="rounded-lg border p-6">
          <h1 className="text-xl font-semibold mb-4">Wizard DPE</h1>
          <p className="text-muted-foreground">
            Le wizard avec les 13 étapes sera bientôt disponible.
          </p>
          <div className="mt-4 flex gap-2">
            {Array.from({ length: 13 }, (_, i) => (
              <Link
                key={i + 1}
                to={`/wizard/${projectId}/${i + 1}`}
                className={`h-8 w-8 rounded-full flex items-center justify-center text-sm ${
                  step === String(i + 1)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {i + 1}
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}