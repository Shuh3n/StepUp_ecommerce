import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Phone, ArrowLeft } from 'lucide-react';

const PhoneRequest = () => {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phone.trim()) {
      toast({
        title: "Campo requerido",
        description: "Por favor ingresa tu número de teléfono",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("Usuario no autenticado");
      }

      // Actualizar el teléfono del usuario
      const { error } = await supabase
        .from('users')
        .update({ phone: phone.trim() })
        .eq('auth_id', user.id);

      if (error) throw error;

      toast({
        title: "Teléfono actualizado",
        description: "Tu número de teléfono ha sido guardado exitosamente",
      });

      // Redirigir al perfil
      navigate('/profile');
    } catch (error: any) {
      console.error('Error updating phone:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el teléfono. Inténtalo de nuevo.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md glass border border-white/20 shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4">
            <Phone className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">
            Agregar Teléfono
          </CardTitle>
          <p className="text-white/70">
            Para completar tu perfil, necesitamos tu número de teléfono
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-white">
                Número de Teléfono
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Ej: +57 300 123 4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-white/10 border-white/30 text-white placeholder:text-white/50"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/80 hover:to-secondary/80"
              >
                {loading ? "Guardando..." : "Guardar Teléfono"}
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate('/profile')}
                className="w-full text-white/70 hover:text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Saltar por ahora
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PhoneRequest;