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
  const { toast } = useToast();
  const navigate = useNavigate();

  // Verificar si el usuario tiene un perfil completo en nuestra base de datos
  const checkUserProfileExists = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('auth_id')
        .eq('auth_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error verificando existencia de perfil de usuario:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Excepción verificando existencia de perfil de usuario:', error);
      return false;
    }
  };

  // Manejar la redirección después del login exitoso
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          try {
            // Verificar si el usuario existe en admins primero
            const { data: adminData, error: adminError } = await supabase
              .from('admins')
              .select('auth_id')
              .eq('auth_id', session.user.id)
              .maybeSingle();

            console.log('[LOGIN] session.user.id:', session.user.id, typeof session.user.id);
            console.log('[LOGIN] Resultado consulta admins:', adminData, typeof adminData?.auth_id);
            if (adminData) {
              console.log('[LOGIN] Comparando:', adminData.auth_id, '===', session.user.id, adminData.auth_id === session.user.id);
            }
            if (adminError) {
              console.error('[LOGIN] Error buscando usuario en admins:', adminError);
            }

            if (adminData && adminData.auth_id === session.user.id) {
              console.log('[LOGIN] Usuario detectado como admin, redirigiendo a /admin');
              navigate('/admin');
              return;
            } else {
              console.log('[LOGIN] Usuario NO es admin, comprobando en users...');
            }

            // Si no es admin, verificar si existe en users
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('auth_id')
              .eq('auth_id', session.user.id)
              .maybeSingle();

            console.log('[LOGIN] Resultado consulta users:', userData);
            if (userError) {
              console.error('[LOGIN] Error buscando usuario en users:', userError);
              navigate('/complete-profile');
              return;
            }

            if (userData) {
              console.log('[LOGIN] Usuario detectado como normal, redirigiendo a /profile');
              navigate('/profile');
            } else {
              console.log('[LOGIN] Usuario sin perfil, redirigiendo a /complete-profile');
              navigate('/complete-profile');
            }
          } catch (error) {
            console.error('Error manejando cambios de estado de auth:', error);
            navigate('/complete-profile');
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      // El redireccionamiento se manejará automáticamente en el useEffect
      // a través del listener onAuthStateChange

    } catch (error) {
      console.error('Error iniciando sesión:', error);
      const raw = error instanceof Error ? error.message : String(error);
      const message = translateAuthError(raw) || 'No se pudo iniciar sesión. Intenta nuevamente.';
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth-callback`
        }
      });
      
      if (error) throw error;
    } catch (error) {
      console.error('Error iniciando sesión con Google:', error);
      const raw = error instanceof Error ? error.message : String(error);
      const message = translateAuthError(raw) || 'No se pudo iniciar sesión con Google. Intenta nuevamente.';
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  // translateAuthError ahora se importa desde src/lib/authErrors.ts

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
                Ingresa a tu cuenta para continuar
              </CardDescription>
            </div>
          </CardHeader>
         
          {/* Social Login Section */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center mb-6">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-4 text-muted-foreground">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2 mt-1 mb-6"
                    onClick={handleGoogleLogin}
                  >
                    <img
                      src="https://www.svgrepo.com/show/475656/google-color.svg"
                      alt="Google"
                      className="h-5 w-5"
                    />
                    Iniciar sesión con Google
                  </Button>
                </span>
              </div>
            </div>
          </div>

          <CardContent className="px-8 pb-8">
            <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass border-white/20"
                  required
                  autoComplete="off"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Tu contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="glass border-white/20 pr-10"
                    required
                    autoComplete="new-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
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
                <Link
                  to="/forgot-password"
                  className="text-sm text-primary hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              <Button type="submit" variant="hero" className="w-full">
                Iniciar Sesión
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-muted-foreground">
                ¿No tienes cuenta?{" "}
                <Link
                  to="/register"
                  className="text-primary hover:underline font-medium"
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