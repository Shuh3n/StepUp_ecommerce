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
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        navigate('/login');
        return;
      }

      // Verificar si el usuario se registró con Google
      const isGoogleUser = session.user.app_metadata.provider === 'google';
      
      // Obtener datos del usuario
      const { data: userData } = await supabase
        .from('users')
        .select('phone, identification')
        .eq('auth_id', session.user.id)
        .single();

      // Si no es usuario de Google o ya tiene datos registrados, redirigir a profile
      if (!isGoogleUser || userData) {
        navigate('/profile');
        return;
      }
    };

    checkUser();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        toast({
          title: "Error de autenticación",
          description: "Por favor, inicia sesión nuevamente",
          variant: "destructive",
        });
        navigate('/login');
        return;
      }

      const { error } = await supabase
        .from('users')
        .upsert(
          {
            auth_id: session.user.id,
            phone: phoneNumber.toString(),
            identification: identification,
            email: session.user.email,
            name: session.user.user_metadata?.name || '',
            last_updated: new Date().toISOString(),
          },
          { onConflict: 'auth_id' }
        );

      if (error) {
        console.error('Error updating user:', error);
        throw error;
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
                onChange={(e) => setIdentification(e.target.value)}
                className="glass border-white/20"
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Número de teléfono</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 234 567 8900"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="glass border-white/20"
                required
                disabled={loading}
              />
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
                identification === ""
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