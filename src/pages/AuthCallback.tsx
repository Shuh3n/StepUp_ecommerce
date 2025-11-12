import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('[AUTH_CALLBACK] 🔄 Procesando callback de autenticación...');

        // Obtener la sesión actual después del OAuth
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('[AUTH_CALLBACK] ❌ Error obteniendo sesión:', sessionError);
          throw new Error(`Error de sesión: ${sessionError.message}`);
        }

        if (!session || !session.user) {
          console.error('[AUTH_CALLBACK] ❌ No hay sesión válida');
          toast({
            title: "Error de autenticación",
            description: "No se pudo obtener la sesión del usuario.",
            variant: "destructive",
          });
          navigate('/login');
          return;
        }

        const user = session.user;
        console.log('[AUTH_CALLBACK] ✅ Usuario autenticado:', user.id, user.email);

        // Verificar si el usuario existe en admins primero
        const { data: adminData, error: adminError } = await supabase
          .from('admins')
          .select('auth_id, email, name')
          .eq('auth_id', user.id)
          .maybeSingle();

        console.log('[AUTH_CALLBACK] 👑 Verificación admin:', { adminData, adminError: adminError?.message });

        if (adminError && adminError.code !== 'PGRST116') {
          console.error('[AUTH_CALLBACK] ❌ Error verificando admin:', adminError);
        }

        // Si es admin, redirigir a admin
        if (adminData) {
          console.log('[AUTH_CALLBACK] ✅ Es admin, redirigiendo...');
          toast({
            title: "✅ Bienvenido Admin",
            description: `Hola ${adminData.name || 'Administrador'}`,
          });
          navigate('/admin');
          return;
        }

        console.log('[AUTH_CALLBACK] 👤 No es admin, verificando en tabla users...');

        // Verificar si existe en users
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('auth_id, estado, full_name, email, created_at')
          .eq('auth_id', user.id)
          .maybeSingle();

        console.log('[AUTH_CALLBACK] 👤 Verificación usuario:', { 
          userData, 
          userError: userError?.message,
          userErrorCode: userError?.code 
        });

        if (userError && userError.code !== 'PGRST116') {
          console.error('[AUTH_CALLBACK] ❌ Error verificando usuario:', userError);
          throw new Error(`Error consultando usuario: ${userError.message}`);
        }

        // Si el usuario no existe en la tabla users, crear perfil
        if (!userData) {
          console.log('[AUTH_CALLBACK] ⚠️ Usuario no existe, creando perfil desde Google...');
          
          // Intentar crear automáticamente con datos de Google
          const googleName = user.user_metadata?.full_name || 
                            user.user_metadata?.name || 
                            user.email?.split('@')[0] || 
                            'Usuario';
          
          // Generar identificación temporal (se puede cambiar después)
          const tempIdentification = `TEMP_${Date.now()}`;

          try {
            const { error: insertError } = await supabase
              .from('users')
              .insert({
                auth_id: user.id,
                email: user.email,
                full_name: googleName,
                phone: user.user_metadata?.phone || null,
                identification: tempIdentification,
                estado: true,
                email_verified: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });

            if (insertError) {
              console.error('[AUTH_CALLBACK] ❌ Error creando perfil automático:', insertError);
              // Si falla la creación automática, redirigir a completar perfil
              toast({
                title: "Completar registro",
                description: "Necesitamos algunos datos adicionales para completar tu registro.",
                variant: "default",
              });
              navigate('/complete-profile');
              return;
            }

            console.log('[AUTH_CALLBACK] ✅ Perfil creado automáticamente');
            toast({
              title: "✅ Bienvenido",
              description: `Hola ${googleName}, tu cuenta ha sido creada exitosamente.`,
            });
            navigate('/profile');
            return;

          } catch (createError) {
            console.error('[AUTH_CALLBACK] ❌ Error en creación automática:', createError);
            navigate('/complete-profile');
            return;
          }
        }

        // Usuario existe, verificar estado
        console.log('[AUTH_CALLBACK] 🔍 Verificando estado usuario:', {
          estado: userData.estado,
          tipo: typeof userData.estado
        });

        if (userData.estado !== true) {
          console.log('[AUTH_CALLBACK] 🚫 Cuenta inhabilitada');
          await supabase.auth.signOut();
          toast({
            title: "Cuenta inhabilitada",
            description: "Tu cuenta se encuentra inhabilitada. Por favor contacta soporte.",
            variant: "destructive",
            duration: 8000,
          });
          navigate('/login');
          return;
        }

        // Usuario válido, actualizar last_login
        console.log('[AUTH_CALLBACK] ✅ Usuario válido, actualizando last_login...');
        
        try {
          const { error: updateError } = await supabase
            .from('users')
            .update({ 
              last_login: new Date().toISOString(),
              login_count: (userData.login_count || 0) + 1
            })
            .eq('auth_id', user.id);

          if (updateError) {
            console.warn('[AUTH_CALLBACK] ⚠️ Error actualizando last_login:', updateError);
          }
        } catch (updateErr) {
          console.warn('[AUTH_CALLBACK] ⚠️ Error en actualización:', updateErr);
        }

        toast({
          title: "✅ Inicio de sesión exitoso",
          description: `Bienvenido ${userData.full_name || userData.email}`,
        });

        console.log('[AUTH_CALLBACK] 🏠 Redirigiendo a /profile');
        navigate('/profile');

      } catch (error) {
        console.error('[AUTH_CALLBACK] 💥 Error procesando callback:', error);
        toast({
          title: "Error de autenticación",
          description: "Hubo un problema procesando tu inicio de sesión con Google.",
          variant: "destructive",
        });
        navigate('/login');
      } finally {
        setIsProcessing(false);
      }
    };

    handleAuthCallback();
  }, [navigate, toast]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <Card className="glass border-white/20 shadow-floating">
          <CardContent className="p-8 text-center">
            <div className="space-y-6">
              <div className="mx-auto">
                <h1 className="text-3xl font-bold gradient-text">Step Up</h1>
              </div>
              
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto"></div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Procesando autenticación...</h3>
                    <p className="text-muted-foreground text-sm">
                      Verificando tu cuenta y configurando tu sesión
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="h-12 w-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                    <div className="h-6 w-6 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">¡Autenticación completada!</h3>
                    <p className="text-muted-foreground text-sm">
                      Redirigiendo...
                    </p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthCallback;