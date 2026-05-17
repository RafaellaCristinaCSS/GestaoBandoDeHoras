export function Header() {
  const today = new Date()
  const dateStr = today.toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <header className="bg-white border-b border-slate-200 shadow-sm">
      <div className="px-8 py-4 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Sistema de Gestão</h2>
          <p className="text-sm text-slate-600">{dateStr}</p>
        </div>
      </div>
    </header>
  )
}
