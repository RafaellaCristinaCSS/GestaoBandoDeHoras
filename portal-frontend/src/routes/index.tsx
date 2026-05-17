import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { MainLayout } from '@/layouts/MainLayout'
import { FuncionariosPage } from '@/pages/FuncionariosPage'
import { EscalasPage } from '@/pages/EscalasPage'
import { RegistroPontoPage } from '@/pages/RegistroPontoPage'
import { FeriasPage } from '@/pages/FeriasPage'
import { RelatoriosPage } from '@/pages/RelatoriosPage'

export function AppRoutes() {
  return (
    <Router>
      <Routes>
        <Route
          path="/funcionarios"
          element={
            <MainLayout>
              <FuncionariosPage />
            </MainLayout>
          }
        />
        <Route
          path="/escalas"
          element={
            <MainLayout>
              <EscalasPage />
            </MainLayout>
          }
        />
        <Route
          path="/registro-ponto"
          element={
            <MainLayout>
              <RegistroPontoPage />
            </MainLayout>
          }
        />
        <Route
          path="/ferias"
          element={
            <MainLayout>
              <FeriasPage />
            </MainLayout>
          }
        />
        <Route
          path="/relatorios"
          element={
            <MainLayout>
              <RelatoriosPage />
            </MainLayout>
          }
        />
        <Route path="/" element={<MainLayout><FuncionariosPage /></MainLayout>} />
      </Routes>
    </Router>
  )
}
