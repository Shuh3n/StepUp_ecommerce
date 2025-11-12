import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '../lib/supabase';
import { useNavigate, Link } from "react-router-dom";
import { translateAuthError } from '@/lib/authErrors';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Manejar la redirección después del login exitoso - CORREGIDO
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setIsLoading(true);
          try {
            console.log('[LOGIN] session.user.id:', session.user.id, typeof session.user.id);
            
            // Verificar si el usuario existe en admins primero
            const { data: adminData, error: adminError } = await supabase
              .from('admins')
              .select('auth_id')
              .eq('auth_id', session.user.id)
              .maybeSingle();

            console.log('[LOGIN] Resultado consulta admins:', adminData, adminError?.code);

            if (adminError && adminError.code !== 'PGRST116') {
              console.error('[LOGIN] ❌ Error buscando usuario en admins:', adminError);
            }

            // Si es admin, redirigir a admin
            if (adminData && adminData.auth_id === session.user.id) {
              console.log('[LOGIN] ✅ Usuario es admin, redirigiendo a /admin');
              navigate('/admin');
              setIsLoading(false);
              return;
            }

            console.log('[LOGIN] Usuario NO es admin, comprobando en users...');

            // Si no es admin, verificar si existe en users
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('auth_id, estado, full_name, email, login_count')
              .eq('auth_id', session.user.id)
              .maybeSingle();

            console.log('[LOGIN] Resultado consulta users:', userData, userError?.code);

            if (userError && userError.code !== 'PGRST116') {
              console.error('[LOGIN] ❌ Error buscando usuario en users:', userError);
              toast({
                title: "Error de sistema",
                description: "Error al verificar los datos del usuario. Intenta nuevamente.",
                variant: "destructive",
              });
              await supabase.auth.signOut();
              setIsLoading(false);
              return;
            }

            // Si el usuario no existe en la tabla users
            if (!userData) {
              console.log('[LOGIN] ⚠️ Usuario no encontrado en tabla users, redirigiendo a completar perfil');
              navigate('/complete-profile');
              setIsLoading(false);
              return;
            }

            // Verificar el estado del usuario - CORREGIDO
            console.log('[LOGIN] 🔍 Verificando estado usuario:', {
              estado: userData.estado,
              tipoEstado: typeof userData.estado,
              esTrue: userData.estado === true,
              esString: userData.estado === 'true'
            });

            // Verificación más robusta del estado
            const estadoActivo = userData.estado === true || userData.estado === 'true' || userData.estado === 1;
            
            if (!estadoActivo) {
              console.log('[LOGIN] 🚫 Usuario con cuenta inhabilitada');
              await supabase.auth.signOut();
              toast({
                title: "Cuenta inhabilitada",
                description: "Tu cuenta se encuentra inhabilitada. Por favor contacta soporte.",
                variant: "destructive",
                duration: 8000,
              });
              setIsLoading(false);
              return;
            }

            console.log('[LOGIN] ✅ Usuario verificado exitosamente, redirigiendo a perfil');
            
            // Actualizar last_login
            const { error: updateError } = await supabase
              .from('users')
              .update({ 
                last_login: new Date().toISOString(),
                login_count: (userData.login_count || 0) + 1
              })
              .eq('auth_id', session.user.id);

            if (updateError) {
              console.warn('[LOGIN] ⚠️ No se pudo actualizar last_login:', updateError);
            }

            toast({
              title: "✅ Inicio de sesión exitoso",
              description: `Bienvenido ${userData.full_name || userData.email}`,
              variant: "default",
            });

            navigate('/profile');

          } catch (error) {
            console.error('[LOGIN] 💥 Error manejando cambios de estado de auth:', error);
            toast({
              title: "Error inesperado",
              description: "Ocurrió un error al procesar el inicio de sesión.",
              variant: "destructive",
            });
            await supabase.auth.signOut();
          } finally {
            setIsLoading(false);
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  // Función para manejar el envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Evitar que la página se recargue
    
    // Validaciones básicas
    if (!email.trim() || !password.trim()) {
      toast({
        title: "Campos requeridos",
        description: "Por favor ingresa email y contraseña.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('[LOGIN] 🔐 Intentando iniciar sesión con:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });

      if (error) throw error;

      console.log('[LOGIN] ✅ Autenticación exitosa:', data.user?.id);
      // El redireccionamiento se manejará automáticamente en el useEffect
      
    } catch (error) {
      console.error('[LOGIN] ❌ Error iniciando sesión:', error);
      setIsLoading(false);
      
      const raw = error instanceof Error ? error.message : String(error);
      const message = translateAuthError(raw) || 'No se pudo iniciar sesión. Intenta nuevamente.';
      
      toast({
        title: "Error de autenticación",
        description: message,
        variant: "destructive",
      });
    }
  };

  // Función adicional para manejar Enter en campos específicos
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading && email.trim() && password.trim()) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      console.log('[LOGIN] 🌐 Iniciando sesión con Google...');
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth-callback`
        }
      });
      
      if (error) throw error;
      
      // No setear isLoading(false) aquí porque se redirigirá a auth-callback
    
    } catch (error) {
      console.error('[LOGIN] ❌ Error iniciando sesión con Google:', error);
      setIsLoading(false);
      
      const raw = error instanceof Error ? error.message : String(error);
      const message = translateAuthError(raw) || 'No se pudo iniciar sesión con Google. Intenta nuevamente.';
      
      toast({
        title: "Error de autenticación",
        description: message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="mb-6 text-muted-foreground hover:text-foreground"
          onClick={() => navigate("/")}
          disabled={isLoading}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>

        <Card className="glass border-white/20 shadow-floating">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto">
              <h1 className="text-3xl font-bold gradient-text">Step Up</h1>
            </div>
            <div>
              <CardTitle className="text-2xl">Inicio Sesión</CardTitle>
              <CardDescription>
                {isLoading ? "Procesando inicio de sesión..." : "Ingresa a tu cuenta para continuar"}
              </CardDescription>
            </div>
          </CardHeader>
         
          <CardContent className="px-8 pb-8">
            {/* Google Login Button */}
            <Button
              type="button"
              variant="outline"
              className="w-full flex items-center justify-center gap-2 mb-6"
              onClick={handleGoogleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary" />
              ) : (
                <img
                  src="https://www.svgrepo.com/show/475656/google-color.svg"
                  alt="Google"
                  className="h-5 w-5"
                />
              )}
              {isLoading ? 'Conectando...' : 'Iniciar sesión con Google'}
            </Button>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">O</span>
              </div>
            </div>

            {/* Formulario con onSubmit y onKeyDown */}
            <form 
              onSubmit={handleSubmit} 
              onKeyDown={handleKeyDown}
              className="space-y-6" 
              autoComplete="off"
              noValidate
            >
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="glass border-white/20"
                  required
                  disabled={isLoading}
                  autoComplete="username"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Tu contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="glass border-white/20 pr-10"
                    required
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-center">
                  <Button
                    type="button"
                    variant="link"
                    className="text-sm text-muted-foreground"
                    onClick={() => navigate("/forgot-password")}
                    disabled={isLoading}
                  >
                    ¿Olvidaste tu contraseña?
                  </Button>
                </div>
              </div>

              <Button 
                type="submit" 
                variant="hero" 
                className="w-full" 
                disabled={isLoading || !email.trim() || !password.trim()}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Iniciando sesión...
                  </div>
                ) : (
                  'Iniciar Sesión'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-muted-foreground">
                ¿No tienes cuenta?{" "}
                <Link
                  to="/register"
                  className={`text-primary hover:underline font-medium ${isLoading ? 'pointer-events-none opacity-50' : ''}`}
                >
                  Regístrate aquí
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;