import { Navigate, useLocation } from 'react-router-dom'
import { useAuth, homeFor } from '../context/AuthContext'

export default function ProtectedRoute({ roles, children }) {
  const { user } = useAuth()
  const loc = useLocation()
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname + loc.search }} />
  if (roles && !roles.includes(user.role)) return <Navigate to={homeFor(user)} replace />
  return children
}