// AdminRoute.tsx
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface Props {
  children: React.ReactNode;
}

const AdminRoute: React.FC<Props> = ({ children }) => {
  console.log('AdminRoute montado');
  const [loading, setLoading] = useState(true);
  const [admin, setAdmin] = useState<any>(null);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Resultado de getSession:', session);
      if (!session) {
        console.warn('No hay sesión activa.');
        setAdmin(null);
        setLoading(false);
        return;
      }

      const { data: adminData, error } = await supabase
        .from('admins')
        .select('*')
        .eq('auth_id', session.user.id)
        .maybeSingle();

      if (error) console.error('Error verificando admin:', error);
      // Logs detallados para depuración
      console.log('auth_id sesión:', session.user.id);
      console.log('Resultado completo de consulta admins:', adminData);
      if (adminData) {
        console.log('Usuario es admin. auth_id:', adminData.auth_id);
      } else {
        console.warn('Usuario NO es admin o no se encontró en la tabla admins.');
      }

      setAdmin(adminData);
      setLoading(false);
    };

    checkAdmin();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  }

  if (!admin) {
    return <Navigate to="/profile" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;
