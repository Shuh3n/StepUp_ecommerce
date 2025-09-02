import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiresAuth?: boolean;
  requiresNewUser?: boolean;
}

const ProtectedRoute = ({ 
  children, 
  requiresAuth = true,
  requiresNewUser = false 
}: ProtectedRouteProps) => {
  const { isAuthenticated, loading } = useAuth();
  const [hasUserData, setHasUserData] = useState(false);
  const [isNewGoogleUser, setIsNewGoogleUser] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkUserStatus = async () => {
      if (isAuthenticated) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // Verificar si es usuario de Google
          const isGoogleUser = session.user.app_metadata.provider === 'google';

          // Buscar datos del usuario
          const { data: userData } = await supabase
            .from('users')
            .select('phone, identification')
            .eq('auth_id', session.user.id)
            .single();

          // Es un nuevo usuario de Google si usa Google y no tiene datos
          setIsNewGoogleUser(isGoogleUser && !userData);
          setHasUserData(!!userData);
        }
      }
    };

    checkUserStatus();
  }, [isAuthenticated]);

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>;
  }

  // Si no está autenticado y la ruta requiere autenticación
  if (requiresAuth && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si está en complete-profile y no es un nuevo usuario de Google
  if (location.pathname === '/complete-profile' && !isNewGoogleUser) {
    return <Navigate to="/profile" replace />;
  }

  // Si es un nuevo usuario de Google y no está en complete-profile
  if (isNewGoogleUser && location.pathname !== '/complete-profile') {
    return <Navigate to="/complete-profile" replace />;
  }

  // Si la ruta es /verifyEmail y no está autenticado, redirigir a login
  if (location.pathname === '/verifyEmail' && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si requiere autenticación y tiene datos, permitir acceso
  if (requiresAuth && hasUserData) {
    return <>{children}</>;
  }

  return <>{children}</>;
};

export default ProtectedRoute;