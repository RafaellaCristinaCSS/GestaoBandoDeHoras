import { NavLink } from 'react-router-dom'
import { Users, Clock, Calendar, FileText } from 'lucide-react'

export function Sidebar() {
  const menuItems = [
    {
      label: 'Funcionários',
      icon: Users,
      href: '/funcionarios',
    },
    {
      label: 'Escalas',
      icon: Clock,
      href: '/escalas',
    },
    {
      label: 'Registro de Ponto',
      icon: Clock,
      href: '/registro-ponto',
    },
    {
      label: 'Férias',
      icon: Calendar,
      href: '/ferias',
    },
    {
      label: 'Relatórios',
      icon: FileText,
      href: '/relatorios',
    },
  ]

  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen">
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-8">Gestão de Horas</h1>
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
