import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from '../lib/supabase';

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    identification: "",
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: ""
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  // Función para verificar datos únicos
  const checkUniqueData = async () => {
    try {
      const checks = [];

      // Verificar si la cédula ya existe
      if (formData.identification) {
        checks.push(
          supabase
            .from('users')
            .select('identification')
            .eq('identification', formData.identification)
            .maybeSingle()
        );
      }

      // Verificar si el email ya existe
      if (formData.email) {
        checks.push(
          supabase
            .from('users')
            .select('email')
            .eq('email', formData.email)
            .maybeSingle()
        );
      }

      // Verificar si el teléfono ya existe (si se proporcionó)
      if (formData.phone) {
        checks.push(
          supabase
            .from('users')
            .select('phone')
            .eq('phone', formData.phone)
            .maybeSingle()
        );
      }

      // Ejecutar todas las verificaciones
      const results = await Promise.all(checks);
      
      const errors = [];

      results.forEach((result, index) => {
        if (result.data) {
          if (index === 0) errors.push('cédula');
          if (index === 1) errors.push('email');
          if (index === 2) errors.push('teléfono');
        }
      });

      return errors;
    } catch (error) {
      console.error('Error checking unique data:', error);
      return [];
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validaciones básicas
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Error",
        description: "La contraseña debe tener al menos 6 caracteres",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    if (!formData.identification) {
      toast({
        title: "Error",
        description: "La cédula es obligatoria",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    try {
      // 1. Verificar datos únicos antes de crear el usuario
      const duplicateErrors = await checkUniqueData();
      
      if (duplicateErrors.length > 0) {
        const errorMessage = duplicateErrors.length === 1 
          ? `La ${duplicateErrors[0]} ya está registrada.`
          : `Los siguientes datos ya están registrados: ${duplicateErrors.join(', ')}.`;
        
        throw new Error(errorMessage);
      }

      // 2. Crear usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            phone: formData.phone,
            full_name: formData.name,
            identification: formData.identification
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (authError) {
        console.error('Auth error details:', authError);
        throw authError;
      }

      // 3. Crear perfil del usuario en la tabla 'users' - CORREGIDO
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            auth_id: authData.user.id, // ← CAMBIO IMPORTANTE: usar auth_id en lugar de id
            identification: formData.identification,
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            created_at: new Date().toISOString(),
            last_updated: new Date().toISOString()
          });

        if (profileError) {
          console.error('Profile error details:', profileError);
          
          // Manejar error específico de tipo de dato
          if (profileError.message.includes('biginL') || profileError.message.includes('bigint')) {
            throw new Error('Error en el tipo de dato del ID. Contacta al administrador.');
          }
          
          if (profileError.code === '23505') {
            throw new Error('duplicate_key');
          }
          
          throw profileError;
        }
      }

      toast({
        title: "¡Cuenta creada exitosamente!",
        description: "Revisa tu email para confirmar tu cuenta.",
      });

      // Redirigir a la página de verificación
      navigate('/verify-email', { 
        state: { 
          email: formData.email,
          identification: formData.identification
        } 
      });

    } catch (error: any) {
      console.error('Registration error details:', error);
      
      let errorMessage = 'Error al crear la cuenta. Intenta nuevamente.';
      
      // Manejo específico de errores
      if (error.message.includes('cédula ya está registrada') || error.message === 'duplicate_key') {
        errorMessage = 'Esta cédula ya está registrada en el sistema.';
      } else if (error.message.includes('email ya está registrado')) {
        errorMessage = 'Este email ya está registrado en el sistema.';
      } else if (error.message.includes('teléfono ya está registrado')) {
        errorMessage = 'Este teléfono ya está registrado en el sistema.';
      } else if (error.message.includes('already registered') || error.code === 'user_already_exists') {
        errorMessage = 'Este email ya está registrado.';
      } else if (error.message.includes('invalid email') || error.code === 'invalid_email') {
        errorMessage = 'El formato del email es inválido.';
      } else if (error.code === '23505') {
        errorMessage = 'Los datos ingresados ya existen en el sistema.';
      } else if (error.message.includes('biginL') || error.message.includes('bigint')) {
        errorMessage = 'Error técnico. Por favor contacta al administrador.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
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
          onClick={() => navigate(-1)}
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
              <CardTitle className="text-2xl">Crear Cuenta</CardTitle>
              <CardDescription>
                Únete a Step Up y encuentra tu estilo
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="identification">
                  Cédula de Identidad *
                </Label>
                <Input
                  id="identification"
                  name="identification"
                  type="text"
                  placeholder="Tu número de cédula"
                  value={formData.identification}
                  onChange={handleChange}
                  className="glass border-white/20"
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Nombre completo *</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Tu nombre completo"
                  value={formData.name}
                  onChange={handleChange}
                  className="glass border-white/20"
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="glass border-white/20"
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Número de teléfono *</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="Tu número de teléfono"
                  value={formData.phone}
                  onChange={handleChange}
                  className="glass border-white/20"
                  required
                  disabled={loading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 6 caracteres"
                    value={formData.password}
                    onChange={handleChange}
                    className="glass border-white/20 pr-10"
                    required
                    disabled={loading}
                    minLength={6}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Mínimo 6 caracteres</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar contraseña *</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirma tu contraseña"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="glass border-white/20 pr-10"
                    required
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={loading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <Button 
                type="submit" 
                variant="hero" 
                className="w-full"
                disabled={loading}
              >
                {loading ? "Creando cuenta..." : "Crear Cuenta"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-muted-foreground">
                ¿Ya tienes cuenta?{" "}
                <a
                  href="/login"
                  className="text-primary hover:underline font-medium"
                >
                  Inicia sesión aquí
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;