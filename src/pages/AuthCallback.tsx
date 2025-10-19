import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useToast } from '@/hooks/use-toast';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Primero, procesar el hash de la URL para completar el flujo de OAuth
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error al obtener la sesión:', sessionError);
          throw sessionError;
        }

        if (!session) {
          throw new Error('No se pudo obtener la sesión de autenticación');
        }

        // Usuario autenticado correctamente
        console.log('Usuario autenticado:', session.user.id);

        // Verificar si el usuario existe en nuestra tabla 'users'
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('auth_id, phone, identification')
          .eq('auth_id', session.user.id)
          .maybeSingle();

        if (userError) {
          console.error('Error al verificar usuario en BD:', userError);
          // Si hay error al verificar, asumimos que no existe y redirigimos a completar perfil
          navigate('/complete-profile', { replace: true });
          return;
        }

        if (userData) {
          // Usuario EXISTE en nuestra BD - verificar si tiene perfil completo
          const hasCompleteProfile = userData.phone && userData.identification;
          
          if (hasCompleteProfile) {
            toast({
              title: '¡Bienvenido de vuelta!',
              description: 'Has iniciado sesión correctamente.',
            });
            navigate('/profile', { replace: true });
          } else {
            toast({
              title: 'Completa tu perfil',
              description: 'Necesitamos más información para continuar.',
            });
            navigate('/complete-profile', { replace: true });
          }
        } else {
          // Usuario NO EXISTE en nuestra BD - crear registro básico y redirigir a completar perfil
          const { user } = session;
          const { id, email, user_metadata } = user;
          const full_name = user_metadata?.full_name || user_metadata?.name || '';
          const provider = user.app_metadata?.provider || '';

          const { error: insertError } = await supabase
            .from('users')
            .insert({
              auth_id: id,
              email,
              full_name,
              provider,
              created_at: new Date().toISOString(),
            });
          if (insertError) {
      console.error('Error creando usuario en users:', insertError);
          } else {
            toast({
              title: '¡Perfil creado!',
              description: 'Tu perfil básico ha sido creado. Completa tu información.',
            });
          }
          navigate('/complete-profile', { replace: true });
        }

      } catch (error) {
        const message = error instanceof Error ? error.message : 'No pudimos completar el inicio de sesión.';
  console.error('Error en el callback de autenticación:', error);
        toast({
          title: 'Error de autenticación',
          description: message,
          variant: 'destructive',
        });
        navigate('/login', { replace: true });
      }
    };

    handleAuthCallback();
  }, [navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Procesando autenticación...</p>
      </div>
    </div>
  );
};

export default AuthCallback;