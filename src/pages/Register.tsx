import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { supabase } from '../lib/supabase';

export default function Register() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    identification: "",
    full_name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [fieldErrors, setFieldErrors] = useState({
    identification: "",
    email: "",
    phone: "",
    password: ""
  });

  // Validación en tiempo real
  const validateField = (name: string, value: string) => {
    const newErrors = { ...fieldErrors };

    switch (name) {
      case 'identification':
        if (!value.trim()) {
          newErrors.identification = 'La cédula es obligatoria';
        } else if (!/^\d{6,12}$/.test(value)) {
          newErrors.identification = 'La cédula debe tener entre 6 y 12 dígitos';
        } else {
          newErrors.identification = '';
        }
        break;

      case 'email':
        if (!value.trim()) {
          newErrors.email = 'El email es obligatorio';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newErrors.email = 'El formato del email es inválido';
        } else {
          newErrors.email = '';
        }
        break;

      case 'phone':
        if (value && !/^[\d\s+\-()]{10,15}$/.test(value)) {
          newErrors.phone = 'El teléfono debe tener entre 10 y 15 caracteres';
        } else {
          newErrors.phone = '';
        }
        break;

      case 'password':
        if (value.length < 6) {
          newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
        } else {
          newErrors.password = '';
        }
        break;
    }

    setFieldErrors(newErrors);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  // Verificar datos únicos antes del registro
  const checkUniqueData = async () => {
    try {
      const checks = [];

      // Verificar identificación
      if (formData.identification) {
        checks.push(
          supabase
            .from('users')
            .select('identification')
            .eq('identification', formData.identification)
            .maybeSingle()
        );
      }

      // Verificar email
      if (formData.email) {
        checks.push(
          supabase
            .from('users')
            .select('email')
            .eq('email', formData.email)
            .maybeSingle()
        );
      }

      // Verificar teléfono (si se proporcionó)
      if (formData.phone) {
        checks.push(
          supabase
            .from('users')
            .select('phone')
            .eq('phone', formData.phone)
            .maybeSingle()
        );
      }

      const results = await Promise.all(checks);
      const duplicateFields = [];

      results.forEach((result, index) => {
        if (result.data && !result.error) {
          if (index === 0) duplicateFields.push('cédula');
          if (index === 1) duplicateFields.push('email');
          if (index === 2) duplicateFields.push('teléfono');
        }
      });

      return duplicateFields;
    } catch (error) {
      console.error('Error checking unique data:', error);
      return [];
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validaciones finales
    Object.keys(formData).forEach(key => {
      if (key !== 'phone' && key !== 'confirmPassword') {
        validateField(key, formData[key as keyof typeof formData]);
      }
    });

    // Verificar si hay errores
    if (Object.values(fieldErrors).some(error => error !== '')) {
      toast({
        title: "Error de validación",
        description: "Por favor, corrige los errores en el formulario",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    try {
      // 1. Verificar datos únicos
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
            full_name: formData.full_name,
            phone: formData.phone,
            identification: formData.identification
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (authError) {
        console.error('Auth error:', authError);
        
        if (authError.message?.includes('already registered') || 
            authError.message?.includes('user_exists')) {
          throw new Error('Este email ya está registrado en el sistema.');
        }
        
        throw authError;
      }

      const user = authData.user;
      if (!user) throw new Error("No se pudo crear el usuario en Auth");

      // 3. Insertar en la tabla users
      const { error: insertError } = await supabase.from("users").insert({
        auth_id: user.id,
        identification: formData.identification,
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone || null,
        created_at: new Date().toISOString(),
        email_verified: false,
        login_count: 0,
        order_count: 0
      });

      if (insertError) {
  console.error('Insert error details:', insertError);
  
  // Manejo mejorado de errores de duplicados
  if (insertError.code === '23505') {
    // Verificar EXACTAMENTE qué campo causó el error
    let duplicateField = 'datos';
    
    // Patrones más específicos para cada campo
    if (insertError.message.includes('auth_users_identification_key') || 
        insertError.message.includes('identification') ||
        /duplicate.*identification|identification.*duplicate/i.test(insertError.message)) {
      duplicateField = 'cédula';
    } 
    else if (insertError.message.includes('auth_users_email_key') || 
             insertError.message.includes('email') ||
             /duplicate.*email|email.*duplicate/i.test(insertError.message)) {
      duplicateField = 'email';
    }
    else if (insertError.message.includes('auth_users_phone_key') || 
             insertError.message.includes('phone') ||
             /duplicate.*phone|phone.*duplicate/i.test(insertError.message)) {
      duplicateField = 'teléfono';
    }
    else if (insertError.message.includes('auth_users_auth_id_key') || 
             insertError.message.includes('auth_id')) {
      duplicateField = 'usuario';
    }
    
    // Mensajes personalizados para cada campo
    const errorMessages: { [key: string]: string } = {
      'cédula': '❌ Esta cédula ya está registrada en nuestro sistema.',
      'email': '❌ Este correo electrónico ya tiene una cuenta asociada.',
      'teléfono': '❌ Este número de teléfono ya está en uso.',
      'usuario': '❌ Este usuario ya existe en el sistema.',
      'datos': '❌ Los datos ingresados ya existen en nuestro sistema.'
    };
    
    throw new Error(errorMessages[duplicateField]);
  }
  
  // Para otros errores de base de datos
  if (insertError.code && insertError.code.startsWith('23')) {
    throw new Error('Error de base de datos. Por favor, contacta al soporte.');
  }
  
  throw insertError;
}

      toast({
        title: "¡Cuenta creada exitosamente!",
        description: "Revisa tu email para confirmar tu cuenta.",
      });

      navigate('/verify-email', { 
        state: { 
          email: formData.email,
          identification: formData.identification,
          full_name: formData.full_name
        } 
      });

    } catch (err: any) {
      console.error('Registration error:', err);
      
      let errorMessage = 'Error al crear la cuenta. Intenta nuevamente.';
      
      if (err.message.includes('cédula ya está registrada')) {
        errorMessage = 'Esta cédula ya está registrada en el sistema.';
      } 
      else if (err.message.includes('email ya está registrado')) {
        errorMessage = 'Este email ya está registrado en el sistema.';
      }
      else if (err.message.includes('teléfono ya está registrado')) {
        errorMessage = 'Este teléfono ya está registrado en el sistema.';
      }
      else if (err.message.includes('already registered')) {
        errorMessage = 'Este email ya tiene una cuenta registrada.';
      }
      else if (err.code === '23505') {
        errorMessage = 'Los datos ingresados ya existen en el sistema.';
      }
      else if (err.code === '42501') {
        errorMessage = 'Error de permisos. Contacta al administrador.';
      }
      else if (err.message) {
        errorMessage = err.message;
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

  const isFormValid = () => {
    return (
      formData.identification.trim() !== '' &&
      formData.full_name.trim() !== '' &&
      formData.email.trim() !== '' &&
      formData.password.trim() !== '' &&
      formData.confirmPassword.trim() !== '' &&
      Object.values(fieldErrors).every(error => error === '') &&
      formData.password === formData.confirmPassword
    );
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
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
              {/* Identification */}
              <div className="space-y-2">
                <Label htmlFor="identification">Cédula de Identidad *</Label>
                <Input
                  id="identification"
                  name="identification"
                  type="text"
                  placeholder="Tu número de cédula"
                  value={formData.identification}
                  onChange={handleChange}
                  className={`glass border-white/20 ${fieldErrors.identification ? 'border-red-500' : ''}`}
                  required
                  disabled={loading}
                />
                {fieldErrors.identification && (
                  <p className="text-red-500 text-sm">{fieldErrors.identification}</p>
                )}
              </div>

              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="full_name">Nombre completo *</Label>
                <Input
                  id="full_name"
                  name="full_name"
                  type="text"
                  placeholder="Tu nombre completo"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="glass border-white/20"
                  required
                  disabled={loading}
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  className={`glass border-white/20 ${fieldErrors.email ? 'border-red-500' : ''}`}
                  required
                  disabled={loading}
                />
                {fieldErrors.email && (
                  <p className="text-red-500 text-sm">{fieldErrors.email}</p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">Número de teléfono</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="Tu número de teléfono (opcional)"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`glass border-white/20 ${fieldErrors.phone ? 'border-red-500' : ''}`}
                  disabled={loading}
                />
                {fieldErrors.phone && (
                  <p className="text-red-500 text-sm">{fieldErrors.phone}</p>
                )}
              </div>

              {/* Password */}
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
                    className={`glass border-white/20 pr-10 ${fieldErrors.password ? 'border-red-500' : ''}`}
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
                {fieldErrors.password && (
                  <p className="text-red-500 text-sm">{fieldErrors.password}</p>
                )}
              </div>

              {/* Confirm Password */}
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

              {/* Submit */}
              <Button
                type="submit"
                variant="hero"
                className="w-full"
                disabled={loading || !isFormValid()}
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
}