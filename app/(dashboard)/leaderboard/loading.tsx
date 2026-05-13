export default function Loading() {
  return (
    <div className="container mx-auto p-6">
      <div className="glass-card rounded-3xl p-8 animate-pulse">
        <div className="h-8 w-48 bg-muted rounded mb-4" />
        <div className="space-y-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-20 bg-muted rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  )
}
