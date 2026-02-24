import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  ChevronLeft, 
  ChevronRight, 
  Save, 
  Send,
  Home,
  Thermometer,
  Zap,
  Wind,
  FileCheck,
  Settings
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { Progress } from '../../components/ui/Progress'
import { useToast } from '../../hooks/useToast'

// Wizard steps configuration
const steps = [
  { id: 1, name: 'Adresse', icon: Home, description: 'Adresse et localisation du bien' },
  { id: 2, name: 'Bâtiment', icon: Home, description: 'Type et caractéristiques du bâtiment' },
  { id: 3, name: 'Parois', icon: Settings, description: 'Murs, toiture, planchers' },
  { id: 4, name: 'Menuiseries', icon: Settings, description: 'Fenêtres et portes' },
  { id: 5, name: 'Ventilation', icon: Wind, description: 'Système de ventilation' },
  { id: 6, name: 'Chauffage', icon: Thermometer, description: 'Système de chauffage' },
  { id: 7, name: 'ECS', icon: Thermometer, description: 'Eau chaude sanitaire' },
  { id: 8, name: 'Climatisation', icon: Thermometer, description: 'Refroidissement' },
  { id: 9, name: 'Éclairage', icon: Zap, description: 'Éclairage et auxiliaires' },
  { id: 10, name: 'Énergies', icon: Zap, description: 'Consommations énergétiques' },
  { id: 11, name: 'Recul', icon: Settings, description: 'Données de recul' },
  { id: 12, name: 'Validation', icon: FileCheck, description: 'Vérification des données' },
  { id: 13, name: 'Génération', icon: Send, description: 'Génération du XML' },
]

// Step 1: Address
function StepAddress() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        <div>
          <label className="text-sm font-medium">Adresse</label>
          <input 
            type="text" 
            placeholder="Numéro et rue"
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Code postal</label>
            <input 
              type="text" 
              placeholder="75000"
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Ville</label>
            <input 
              type="text" 
              placeholder="Paris"
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>
        
        <div>
          <label className="text-sm font-medium">Département</label>
          <select className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option>Sélectionner un département</option>
            <option value="75">75 - Paris</option>
            <option value="77">77 - Seine-et-Marne</option>
            <option value="78">78 - Yvelines</option>
            <option value="91">91 - Essonne</option>
            <option value="92">92 - Hauts-de-Seine</option>
            <option value="93">93 - Seine-Saint-Denis</option>
            <option value="94">94 - Val-de-Marne</option>
            <option value="95">95 - Val-d'Oise</option>
          </select>
        </div>
        
        <div>
          <label className="text-sm font-medium">Zone climatique</label>
          <select className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option>Sélectionner une zone</option>
            <option value="H1">H1 - Très froide</option>
            <option value="H2">H2 - Froide</option>
            <option value="H3">H3 - Modérée</option>
          </select>
        </div>
      </div>
    </div>
  )
}

// Step 2: Building
function StepBuilding() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        <div>
          <label className="text-sm font-medium">Type de bâtiment</label>
          <select className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option>Sélectionner un type</option>
            <option value="maison">Maison individuelle</option>
            <option value="appartement">Appartement</option>
            <option value="immeuble">Immeuble collectif</option>
          </select>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Surface habitable (m²)</label>
            <input 
              type="number" 
              placeholder="100"
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Année de construction</label>
            <input 
              type="number" 
              placeholder="2000"
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>
        
        <div>
          <label className="text-sm font-medium">Nombre de niveaux</label>
          <input 
            type="number" 
            placeholder="2"
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        
        <div>
          <label className="text-sm font-medium">Hauteur sous plafond (m)</label>
          <input 
            type="number" 
            step="0.1"
            placeholder="2.5"
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
      </div>
    </div>
  )
}

// Placeholder steps
function StepWalls() {
  return (
    <div className="text-center py-8 text-muted-foreground">
      <p>Configuration des parois opaques</p>
      <p className="text-sm mt-2">Murs, toiture, planchers bas</p>
    </div>
  )
}

function StepWindows() {
  return (
    <div className="text-center py-8 text-muted-foreground">
      <p>Configuration des menuiseries</p>
      <p className="text-sm mt-2">Fenêtres, portes-fenêtres, baies vitrées</p>
    </div>
  )
}

function StepVentilation() {
  return (
    <div className="text-center py-8 text-muted-foreground">
      <p>Configuration de la ventilation</p>
      <p className="text-sm mt-2">Type de système, débits, installation</p>
    </div>
  )
}

function StepHeating() {
  return (
    <div className="text-center py-8 text-muted-foreground">
      <p>Configuration du chauffage</p>
      <p className="text-sm mt-2">Générateurs, émetteurs, distribution</p>
    </div>
  )
}

function StepECS() {
  return (
    <div className="text-center py-8 text-muted-foreground">
      <p>Configuration de l'eau chaude sanitaire</p>
      <p className="text-sm mt-2">Générateurs, stockage, solaire</p>
    </div>
  )
}

function StepCooling() {
  return (
    <div className="text-center py-8 text-muted-foreground">
      <p>Configuration du refroidissement</p>
      <p className="text-sm mt-2">Climatisation, surventilation nocturne</p>
    </div>
  )
}

function StepLighting() {
  return (
    <div className="text-center py-8 text-muted-foreground">
      <p>Configuration de l'éclairage</p>
      <p className="text-sm mt-2">Types d'ampoules, régulation</p>
    </div>
  )
}

function StepEnergy() {
  return (
    <div className="text-center py-8 text-muted-foreground">
      <p>Saisie des consommations énergétiques</p>
      <p className="text-sm mt-2">Factures, relevés, estimations</p>
    </div>
  )
}

function StepRecul() {
  return (
    <div className="text-center py-8 text-muted-foreground">
      <p>Données de recul</p>
      <p className="text-sm mt-2">Justificatifs, contrôles, observations</p>
    </div>
  )
}

function StepValidation() {
  return (
    <div className="text-center py-8 text-muted-foreground">
      <p>Validation des données</p>
      <p className="text-sm mt-2">Vérification de cohérence, alertes, erreurs</p>
    </div>
  )
}

function StepGeneration() {
  return (
    <div className="text-center py-8">
      <p className="text-muted-foreground">Génération du fichier XML</p>
      <div className="mt-6 space-y-3">
        <Button className="w-full">
          <Send className="mr-2 h-4 w-4" />
          Générer et télécharger le XML
        </Button>
        <Button variant="outline" className="w-full">
          <Save className="mr-2 h-4 w-4" />
          Sauvegarder comme brouillon
        </Button>
      </div>
    </div>
  )
}

export function DPEWizard() {
  const [currentStep, setCurrentStep] = useState(1)
  const navigate = useNavigate()
  const { toast } = useToast()

  const progress = ((currentStep - 1) / (steps.length - 1)) * 100

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSave = () => {
    toast({
      title: 'Sauvegarde réussie',
      description: 'Le DPE a été sauvegardé localement'
    })
  }

  const currentStepData = steps[currentStep - 1]
  const StepIcon = currentStepData.icon

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Nouveau DPE</h1>
            <p className="text-sm text-muted-foreground">
              Étape {currentStep} sur {steps.length}
            </p>
          </div>
        </div>
        
        <Button variant="outline" onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" />
          Sauvegarder
        </Button>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Début</span>
          <span>{Math.round(progress)}% complété</span>
          <span>Fin</span>
        </div>
      </div>

      {/* Step content */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <StepIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>{currentStepData.name}</CardTitle>
              <CardDescription>{currentStepData.description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="min-h-[300px]">
            {currentStep === 1 && <StepAddress />}
            {currentStep === 2 && <StepBuilding />}
            {currentStep === 3 && <StepWalls />}
            {currentStep === 4 && <StepWindows />}
            {currentStep === 5 && <StepVentilation />}
            {currentStep === 6 && <StepHeating />}
            {currentStep === 7 && <StepECS />}
            {currentStep === 8 && <StepCooling />}
            {currentStep === 9 && <StepLighting />}
            {currentStep === 10 && <StepEnergy />}
            {currentStep === 11 && <StepRecul />}
            {currentStep === 12 && <StepValidation />}
            {currentStep === 13 && <StepGeneration />}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 1}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Précédent
        </Button>
        
        <Button
          onClick={handleNext}
          disabled={currentStep === steps.length}
        >
          {currentStep === steps.length ? 'Terminer' : 'Suivant'}
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
