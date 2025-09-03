import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase'; // Asegúrate de que la ruta sea correcta
import { useToast } from '@/hooks/use-toast';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleAuthCallback = async () => {
      // Intenta obtener la sesión de Supabase
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Error al procesar el callback de autenticación:', error);
        toast({
          title: 'Error de autenticación',
          description: 'No pudimos verificar tu sesión. Intenta iniciar sesión.',
          variant: 'destructive',
        });
        navigate('/login'); // Redirige a la página de inicio de sesión
        return;
      }

      if (data.session) {
        // La sesión ha sido verificada con éxito
        toast({
          title: '¡Email confirmado!',
          description: 'Tu cuenta ha sido verificada. ¡Bienvenido!',
        });
        // Redirige al usuario a la página de inicio o a donde sea necesario
        navigate('/profile', { replace: true });
      } else {
        // La sesión no es válida, redirigir a un login
        navigate('/login');
      }
    };

    handleAuthCallback();
  }, [navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Verificando tu email...</p>
    </div>
  );
};

export default AuthCallback;