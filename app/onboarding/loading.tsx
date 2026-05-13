import { Loader2 } from "lucide-react"

export default function OnboardingLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground font-[Alegreya]">Loading onboarding...</p>
      </div>
    </div>
  )
}
