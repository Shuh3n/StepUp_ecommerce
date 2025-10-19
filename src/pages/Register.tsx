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
import { ArrowLeft, Eye, EyeOff, CheckCircle, XCircle, Loader } from "lucide-react";
import { supabase } from '../lib/supabase';

export default function Register() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Estados para verificaciones en tiempo real
  const [emailVerifying, setEmailVerifying] = useState(false);
  const [phoneVerifying, setPhoneVerifying] = useState(false);
  const [idVerifying, setIdVerifying] = useState(false);

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
    full_name: "",  
    email: "",
    phone: "",
    password: "",
    confirmPassword: ""
  });

  // Validaciones específicas para contraseña
  const validatePassword = (password: string) => {
    const requirements = {
      length: password.length >= 6,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    const missing = [];
    if (!requirements.length) missing.push("mínimo 6 caracteres");
    if (!requirements.uppercase) missing.push("una mayúscula");
    if (!requirements.lowercase) missing.push("una minúscula");
    if (!requirements.number) missing.push("un número");

    return {
      isValid: requirements.length && requirements.uppercase && requirements.lowercase && requirements.number,
      missing,
      requirements
    };
  };

  // Verificar email en tiempo real
  const checkEmailAvailability = async (email: string) => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    
    setEmailVerifying(true);
    try {
      // Verificar en auth de Supabase primero
      const { data: authCheck } = await supabase.auth.admin.listUsers();
      const emailExists = authCheck?.users?.some(user => user.email === email);
      
      if (emailExists) {
        setFieldErrors(prev => ({ ...prev, email: 'Email ya registrado' }));
        return;
      }

      // Verificar en tabla users
      const { data: userData } = await supabase
        .from('users')
        .select('email')
        .eq('email', email)
        .maybeSingle();

      if (userData) {
        setFieldErrors(prev => ({ ...prev, email: 'Email ya registrado' }));
      } else {
        setFieldErrors(prev => ({ ...prev, email: '' }));
      }
    } catch (error) {
      console.log('Error verificando email:', error);
    } finally {
      setEmailVerifying(false);
    }
  };

  // Verificar teléfono en tiempo real
  const checkPhoneAvailability = async (phone: string) => {
    if (!phone || phone.replace(/\D/g, '').length < 10) return;
    
    setPhoneVerifying(true);
    try {
      const { data: phoneData } = await supabase
        .from('users')
        .select('phone')
        .eq('phone', phone)
        .maybeSingle();

      if (phoneData) {
        setFieldErrors(prev => ({ ...prev, phone: 'Teléfono ya registrado' }));
      } else {
        setFieldErrors(prev => ({ ...prev, phone: '' }));
      }
    } catch (error) {
      console.log('Error verificando teléfono:', error);
    } finally {
      setPhoneVerifying(false);
    }
  };

  // Verificar identificación en tiempo real
  const checkIdAvailability = async (identification: string) => {
    if (!/^\d+$/.test(identification) || identification.length < 6) return;
    
    setIdVerifying(true);
    try {
      const { data: idData } = await supabase
        .from('users')
        .select('identification')
        .eq('identification', identification)
        .maybeSingle();

      if (idData) {
        setFieldErrors(prev => ({ ...prev, identification: 'Cédula ya registrada' }));
      } else {
        setFieldErrors(prev => ({ ...prev, identification: '' }));
      }
    } catch (error) {
      console.log('Error verificando identificación:', error);
    } finally {
      setIdVerifying(false);
    }
  };

  // Validación mejorada en tiempo real
  const validateField = (name: string, value: string) => {
    const newErrors = { ...fieldErrors };

    switch (name) {
      case 'identification':
        if (!value.trim()) {
          newErrors.identification = 'Requerido';
        } else if (!/^\d+$/.test(value)) {
          newErrors.identification = 'Solo números';
        } else if (value.length < 6) {
          newErrors.identification = `Faltan ${6 - value.length} dígitos`;
        } else if (value.length > 12) {
          newErrors.identification = `Máximo 12 dígitos`;
        } else {
          newErrors.identification = '';
          // Verificar disponibilidad después de un delay
          setTimeout(() => checkIdAvailability(value), 500);
        }
        break;

      case 'full_name':
        if (!value.trim()) {
          newErrors.full_name = 'Requerido';
        } else if (value.trim().length < 2) {
          newErrors.full_name = 'Mínimo 2 caracteres';
        } else if (value.trim().length > 100) {
          newErrors.full_name = 'Máximo 100 caracteres';
        } else if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(value)) {
          newErrors.full_name = 'Solo letras y espacios';
        } else if (value.trim().split(' ').length < 2) {
          newErrors.full_name = 'Ingresa nombre y apellido';
        } else if (value.trim().split(' ').some(word => word.length < 2)) {
          newErrors.full_name = 'Cada nombre debe tener al menos 2 letras';
        } else {
          newErrors.full_name = '';
        }
        break;

      case 'email':
        if (!value.trim()) {
          newErrors.email = 'Requerido';
        } else if (!value.includes('@')) {
          newErrors.email = 'Falta @';
        } else if (!value.includes('.')) {
          newErrors.email = 'Falta dominio (.com, .es, etc.)';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newErrors.email = 'Formato inválido';
        } else {
          newErrors.email = '';
          // Verificar disponibilidad después de un delay
          setTimeout(() => checkEmailAvailability(value), 800);
        }
        break;

      case 'phone':
        if (!value.trim()) {
          newErrors.phone = 'Requerido';
        } else if (!/^\d+$/.test(value.replace(/\s/g, ''))) {
          newErrors.phone = 'Solo números';
        } else if (value.replace(/\D/g, '').length !== 10) {
          const currentLength = value.replace(/\D/g, '').length;
          if (currentLength < 10) {
            newErrors.phone = `Faltan ${10 - currentLength} dígitos`;
          } else {
            newErrors.phone = `Debe ser exactamente 10 dígitos`;
          }
        } else {
          newErrors.phone = '';
          // Verificar disponibilidad después de un delay
          setTimeout(() => checkPhoneAvailability(value), 500);
        }
        break;

      case 'password':
        const passwordValidation = validatePassword(value);
        if (!passwordValidation.isValid) {
          if (passwordValidation.missing.length === 1) {
            newErrors.password = `Falta: ${passwordValidation.missing[0]}`;
          } else if (passwordValidation.missing.length === 2) {
            newErrors.password = `Faltan: ${passwordValidation.missing.join(' y ')}`;
          } else {
            newErrors.password = `Faltan: ${passwordValidation.missing.slice(0, -1).join(', ')} y ${passwordValidation.missing.slice(-1)}`;
          }
        } else {
          newErrors.password = '';
        }
        break;

      case 'confirmPassword':
        if (!value) {
          newErrors.confirmPassword = 'Confirma tu contraseña';
        } else if (value !== formData.password) {
          newErrors.confirmPassword = 'No coincide';
        } else {
          newErrors.confirmPassword = '';
        }
        break;
    }

    setFieldErrors(newErrors);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    validateField(name, value);
    
    // Si se cambia la contraseña, revalidar confirmación
    if (name === 'password' && formData.confirmPassword) {
      validateField('confirmPassword', formData.confirmPassword);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validar todos los campos
    Object.keys(formData).forEach(key => {
      validateField(key, formData[key as keyof typeof formData]);
    });

    // Verificar si hay errores
    const hasErrors = Object.values(fieldErrors).some(error => error !== '');
    if (hasErrors) {
      const firstError = Object.entries(fieldErrors).find(([, error]) => error !== '');
      toast({
        title: "Error en el formulario",
        description: firstError ? `${firstError[0]}: ${firstError[1]}` : "Corrige los errores",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    // Verificar que no haya verificaciones en curso
    if (emailVerifying || phoneVerifying || idVerifying) {
      toast({
        title: "Verificando datos",
        description: "Espera mientras verificamos la información",
        variant: "default"
      });
      setLoading(false);
      return;
    }

    try {
      // Crear usuario en Supabase Auth
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
        let errorMessage = 'Error al crear cuenta';
        
        if (authError.message?.includes('already registered')) {
          errorMessage = 'Email ya registrado';
        } else if (authError.message?.includes('invalid email')) {
          errorMessage = 'Email inválido';
        } else if (authError.message?.includes('weak password')) {
          errorMessage = 'Contraseña muy débil';
        } else if (authError.message?.includes('signup disabled')) {
          errorMessage = 'Registro temporalmente deshabilitado';
        }
        
        toast({
          title: "Error de registro",
          description: errorMessage,
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      const user = authData.user;
      if (!user) {
        toast({
          title: "Error",
          description: "No se pudo crear el usuario",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      // Insertar en la tabla users
      const { error: insertError } = await supabase.from("users").insert({
        auth_id: user.id,
        identification: formData.identification,
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        created_at: new Date().toISOString(),
        email_verified: false,
        login_count: 0,
        order_count: 0
      });

      if (insertError) {
        console.error('Insert error:', insertError);
        
        let errorMessage = 'Error al guardar datos';
        
        if (insertError.code === '23505') {
          if (insertError.message.includes('identification')) {
            errorMessage = 'Cédula ya registrada';
          } else if (insertError.message.includes('email')) {
            errorMessage = 'Email ya registrado';
          } else if (insertError.message.includes('phone')) {
            errorMessage = 'Teléfono ya registrado';
          } else {
            errorMessage = 'Datos duplicados';
          }
        }
        
        toast({
          title: "Error de base de datos",
          description: errorMessage,
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      toast({
        title: "✅ Cuenta creada",
        description: "Revisa tu email para confirmar",
      });

      navigate('/verify-email', { 
        state: { 
          email: formData.email,
          identification: formData.identification,
          full_name: formData.full_name
        } 
      });

    } catch (err) {
  console.error('Error en el registro:', err);
      
      toast({
        title: "Error inesperado",
        description: "Intenta de nuevo en unos minutos",
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
      formData.phone.trim() !== '' && // Ahora obligatorio
      formData.password.trim() !== '' &&
      formData.confirmPassword.trim() !== '' &&
      Object.values(fieldErrors).every(error => error === '') &&
      !emailVerifying && !phoneVerifying && !idVerifying
    );
  };

  // Componente para mostrar requisitos de contraseña
  const PasswordRequirements = ({ password }: { password: string }) => {
    const validation = validatePassword(password);
    
    if (!password) return null;

    return (
      <div className="mt-2 text-xs space-y-1">
        <div className="flex items-center gap-1">
          {validation.requirements.length ? (
            <CheckCircle className="w-3 h-3 text-green-500" />
          ) : (
            <XCircle className="w-3 h-3 text-red-500" />
          )}
          <span className={validation.requirements.length ? 'text-green-600' : 'text-red-500'}>
            Mínimo 6 caracteres
          </span>
        </div>
        <div className="flex items-center gap-1">
          {validation.requirements.uppercase ? (
            <CheckCircle className="w-3 h-3 text-green-500" />
          ) : (
            <XCircle className="w-3 h-3 text-red-500" />
          )}
          <span className={validation.requirements.uppercase ? 'text-green-600' : 'text-red-500'}>
            Una mayúscula (A-Z)
          </span>
        </div>
        <div className="flex items-center gap-1">
          {validation.requirements.lowercase ? (
            <CheckCircle className="w-3 h-3 text-green-500" />
          ) : (
            <XCircle className="w-3 h-3 text-red-500" />
          )}
          <span className={validation.requirements.lowercase ? 'text-green-600' : 'text-red-500'}>
            Una minúscula (a-z)
          </span>
        </div>
        <div className="flex items-center gap-1">
          {validation.requirements.number ? (
            <CheckCircle className="w-3 h-3 text-green-500" />
          ) : (
            <XCircle className="w-3 h-3 text-red-500" />
          )}
          <span className={validation.requirements.number ? 'text-green-600' : 'text-red-500'}>
            Un número (0-9)
          </span>
        </div>
      </div>
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
              <CardTitle className="text-2xl">Crear cuenta</CardTitle>
              <CardDescription>
                Únete a Step Up y encuentra tu estilo
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Identification */}
              <div className="space-y-2">
                <Label htmlFor="identification">Cédula *</Label>
                <div className="relative">
                  <Input
                    id="identification"
                    name="identification"
                    type="text"
                    placeholder="12345678"
                    value={formData.identification}
                    onChange={handleChange}
                    className={`glass border-white/20 ${fieldErrors.identification ? 'border-red-500' : ''} ${idVerifying ? 'pr-10' : ''}`}
                    required
                    disabled={loading}
                  />
                  {idVerifying && (
                    <Loader className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                  )}
                </div>
                {fieldErrors.identification && (
                  <p className="text-red-500 text-xs">{fieldErrors.identification}</p>
                )}
              </div>

              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="full_name">Nombre completo *</Label>
                <Input
                  id="full_name"
                  name="full_name"
                  type="text"
                  placeholder="Juan Pérez García"
                  value={formData.full_name}
                  onChange={handleChange}
                  className={`glass border-white/20 ${fieldErrors.full_name ? 'border-red-500' : ''}`}
                  required
                  disabled={loading}
                />
                {fieldErrors.full_name && (
                  <p className="text-red-500 text-xs">{fieldErrors.full_name}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <div className="relative">
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="juan@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    className={`glass border-white/20 ${fieldErrors.email ? 'border-red-500' : ''} ${emailVerifying ? 'pr-10' : ''}`}
                    required
                    disabled={loading}
                  />
                  {emailVerifying && (
                    <Loader className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                  )}
                </div>
                {fieldErrors.email && (
                  <p className="text-red-500 text-xs">{fieldErrors.email}</p>
                )}
              </div>

              {/* Phone - AHORA OBLIGATORIO */}
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono *</Label>
                <div className="relative">
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="3001234567"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`glass border-white/20 ${fieldErrors.phone ? 'border-red-500' : ''} ${phoneVerifying ? 'pr-10' : ''}`}
                    required
                    disabled={loading}
                  />
                  {phoneVerifying && (
                    <Loader className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                  )}
                </div>
                {fieldErrors.phone && (
                  <p className="text-red-500 text-xs">{fieldErrors.phone}</p>
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
                    placeholder="Abc123"
                    value={formData.password}
                    onChange={handleChange}
                    className={`glass border-white/20 pr-10 ${fieldErrors.password ? 'border-red-500' : ''}`}
                    required
                    disabled={loading}
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
                  <p className="text-red-500 text-xs">{fieldErrors.password}</p>
                )}
                <PasswordRequirements password={formData.password} />
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar contraseña *</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Repite tu contraseña"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`glass border-white/20 pr-10 ${fieldErrors.confirmPassword ? 'border-red-500' : ''}`}
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
                {fieldErrors.confirmPassword && (
                  <p className="text-red-500 text-xs">{fieldErrors.confirmPassword}</p>
                )}
              </div>

              {/* Submit */}
              <Button
                type="submit"
                variant="hero"
                className="w-full mt-6"
                disabled={loading || !isFormValid()}
              >
                {loading ? "Creando..." : "Crear Cuenta"}
              </Button>
              
              {/* Estado de verificaciones */}
              {(emailVerifying || phoneVerifying || idVerifying) && (
                <p className="text-xs text-muted-foreground text-center">
                  Verificando disponibilidad...
                </p>
              )}
            </form>

            <div className="mt-4 text-center">
              <p className="text-muted-foreground text-sm">
                ¿Ya tienes cuenta?{" "}
                <a
                  href="/login"
                  className="text-primary hover:underline font-medium"
                >
                  Inicia sesión
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}