import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from '../lib/supabase';

const PhoneRequest = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [confirmPhoneNumber, setConfirmPhoneNumber] = useState("");
  const [identification, setIdentification] = useState("");
  const [loading, setLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [identificationError, setIdentificationError] = useState("");
  const [userSession, setUserSession] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
          navigate('/login');
          return;
        }

        if (!session?.user) {
          navigate('/login');
          return;
        }

        setUserSession(session);

        // Check if user is Google user
        const isGoogleUser = session.user.app_metadata?.provider === 'google';
        
        if (!isGoogleUser) {
          navigate('/profile');
          return;
        }

        // Get user data with better error handling
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('phone, identification')
          .eq('auth_id', session.user.id)
          .maybeSingle(); // Use maybeSingle instead of single

        if (userError) {
          console.error('User data error:', userError);
          // Don't redirect on error, let user complete profile
          return;
        }

        // If user already has phone, redirect to profile
        if (userData?.phone) {
          navigate('/profile');
          return;
        }

      } catch (error) {
        console.error('Error in checkUser:', error);
        // Don't redirect on error, let user complete profile
      }
    };

    checkUser();
  }, [navigate]);

  // Verificar si la cédula ya existe
  const checkIdentificationExists = async (id: string) => {
    if (!id) return false;
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('identification')
        .eq('identification', id)
        .maybeSingle();

      if (error) {
        console.error('Error checking identification:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Exception checking identification:', error);
      return false;
    }
  };

  // Verificar si el teléfono ya existe
  const checkPhoneExists = async (phone: string) => {
    if (!phone) return false;
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('phone')
        .eq('phone', phone)
        .maybeSingle();

      if (error) {
        console.error('Error checking phone:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Exception checking phone:', error);
      return false;
    }
  };

  // Validar cédula en tiempo real
  const validateIdentification = async (id: string) => {
    if (!id) {
      setIdentificationError("");
      return;
    }

    // Validar formato básico de cédula (solo números)
    if (!/^\d+$/.test(id)) {
      setIdentificationError("La cédula debe contener solo números");
      return;
    }

    setIsChecking(true);
    try {
      const exists = await checkIdentificationExists(id);
      if (exists) {
        setIdentificationError("Esta cédula ya está registrada");
      } else {
        setIdentificationError("");
      }
    } catch (error) {
      console.error('Validation error:', error);
      setIdentificationError("Error al verificar la cédula");
    } finally {
      setIsChecking(false);
    }
  };

  // Validar teléfono en tiempo real
  const validatePhone = async (phone: string) => {
    if (!phone) {
      setPhoneError("");
      return;
    }

    // Validar formato básico de teléfono
    if (!/^[\d\s\+\-\(\)]+$/.test(phone)) {
      setPhoneError("Formato de teléfono inválido");
      return;
    }

    setIsChecking(true);
    try {
      const exists = await checkPhoneExists(phone);
      if (exists) {
        setPhoneError("Este número de teléfono ya está registrado");
      } else {
        setPhoneError("");
      }
    } catch (error) {
      console.error('Validation error:', error);
      setPhoneError("Error al verificar el teléfono");
    } finally {
      setIsChecking(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones básicas
    if (phoneNumber !== confirmPhoneNumber) {
      toast({
        title: "Error",
        description: "Los números de teléfono no coinciden",
        variant: "destructive",
      });
      return;
    }

    if (!identification) {
      toast({
        title: "Error",
        description: "Por favor, ingresa tu cédula",
        variant: "destructive",
      });
      return;
    }

    // Verificar errores de validación
    if (identificationError || phoneError) {
      toast({
        title: "Error",
        description: "Por favor, corrige los errores en el formulario",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Verificar una última vez que los datos no existen
      const [idExists, phoneExists] = await Promise.all([
        checkIdentificationExists(identification),
        checkPhoneExists(phoneNumber)
      ]);

      if (idExists) {
        toast({
          title: "Error",
          description: "Esta cédula ya está registrada",
          variant: "destructive",
        });
        return;
      }

      if (phoneExists) {
        toast({
          title: "Error",
          description: "Este número de teléfono ya está registrado",
          variant: "destructive",
        });
        return;
      }

      // Si todo está bien, proceder con el guardado
      if (!userSession?.user) {
        toast({
          title: "Error de autenticación",
          description: "Por favor, inicia sesión nuevamente",
          variant: "destructive",
        });
        navigate('/login');
        return;
      }

      // Use update instead of upsert for better control
      const { error } = await supabase
        .from('users')
        .update({
          phone: phoneNumber.toString(),
          identification: identification,
          updated_at: new Date().toISOString(),
        })
        .eq('auth_id', userSession.user.id);

      if (error) {
        console.error('Error updating user:', error);
        
        // If update fails, try insert
        if (error.code === 'PGRST116') { // Record not found
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              auth_id: userSession.user.id,
              phone: phoneNumber.toString(),
              identification: identification,
              email: userSession.user.email,
              full_name: userSession.user.user_metadata?.name || '',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });

          if (insertError) {
            throw insertError;
          }
        } else {
          throw error;
        }
      }

      toast({
        title: "¡Perfil completado!",
        description: "Tu número de teléfono y cédula han sido guardados correctamente.",
      });

      navigate('/profile');
    } catch (error: any) {
      console.error('Error in handleSubmit:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar la información. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold gradient-text">Completa tu perfil</h1>
          <p className="text-muted-foreground mt-2">
            Por favor, ingresa tu número de teléfono y cédula para continuar
          </p>
        </div>

        <div className="bg-card rounded-lg p-6 glass border-white/20">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="identification">Cédula</Label>
              <Input
                id="identification"
                type="text"
                placeholder="Ej: 12345678"
                value={identification}
                onChange={(e) => {
                  setIdentification(e.target.value);
                  validateIdentification(e.target.value);
                }}
                onBlur={() => validateIdentification(identification)}
                className="glass border-white/20"
                required
                disabled={loading}
              />
              {identificationError && (
                <p className="text-red-500 text-sm">{identificationError}</p>
              )}
              {isChecking && (
                <p className="text-blue-500 text-sm">Verificando cédula...</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Número de teléfono</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 234 567 8900"
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value);
                  validatePhone(e.target.value);
                }}
                onBlur={() => validatePhone(phoneNumber)}
                className="glass border-white/20"
                required
                disabled={loading}
              />
              {phoneError && (
                <p className="text-red-500 text-sm">{phoneError}</p>
              )}
              {isChecking && (
                <p className="text-blue-500 text-sm">Verificando teléfono...</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirm-phone">Confirmar número de teléfono</Label>
              <Input
                id="confirm-phone"
                type="tel"
                placeholder="+1 234 567 8900"
                value={confirmPhoneNumber}
                onChange={(e) => setConfirmPhoneNumber(e.target.value)}
                className="glass border-white/20"
                required
                disabled={loading}
              />
            </div>
            
            {phoneNumber !== "" && confirmPhoneNumber !== "" && phoneNumber !== confirmPhoneNumber && (
              <p className="text-red-500 text-sm">
                Los números de teléfono no coinciden.
              </p>
            )}
            
            <Button
              type="submit"
              variant="hero"
              className="w-full"
              disabled={
                loading ||
                phoneNumber === "" ||
                confirmPhoneNumber === "" ||
                phoneNumber !== confirmPhoneNumber ||
                identification === "" ||
                !!identificationError ||
                !!phoneError ||
                isChecking
              }
            >
              {loading ? "Guardando..." : "Guardar y Continuar"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PhoneRequest;