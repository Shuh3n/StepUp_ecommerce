// src/pages/VerifyEmail.jsx
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const VerifyEmail = () => {
  const [countdown, setCountdown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState({ message: '', type: '' });
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || '';
  const identification = location.state?.identification || '';

  useEffect(() => {
    if (!email) {
      navigate('/register');
      return;
    }

    // Iniciar el contador solo si es mayor a 0
    if (countdown > 0) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [email, navigate, countdown]);

  const handleResend = async () => {
    if (countdown > 0) return;
    
    setIsResending(true);
    setResendStatus({ message: '', type: '' });
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) {
        throw error;
      }

      setResendStatus({ 
        message: 'Email de verificación reenviado con éxito.', 
        type: 'success' 
      });
      setCountdown(30); // Iniciar cuenta regresiva de 30 segundos
    } catch (error) {
      console.error('Error al reenviar email:', error);
      setResendStatus({ 
        message: error.message || 'Error al reenviar el email. Intenta nuevamente.', 
        type: 'error' 
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      {/* Background decoration matching login page */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="mb-6 text-muted-foreground hover:text-foreground"
          onClick={() => navigate('/register')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al registro
        </Button>

        <Card className="glass border-white/20 shadow-floating">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto">
              <h1 className="text-3xl font-bold gradient-text">Step Up</h1>
            </div>
            <div>
              <CardTitle className="text-2xl">Verifica tu email</CardTitle>
              <CardDescription>
                Hemos enviado un enlace de verificación a
              </CardDescription>
              <p className="text-primary font-medium mt-2">{email}</p>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Mostrar mensaje de estado */}
            {resendStatus.message && (
              <div className={`p-3 rounded-lg text-center text-sm ${
                resendStatus.type === 'success' 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {resendStatus.message}
              </div>
            )}
            
            {/* Datos de la cuenta - Estilo consistente */}
            <div className="border border-border rounded-lg p-4 bg-background">
              <h4 className="font-medium text-foreground text-sm mb-3">
                Datos de tu cuenta
              </h4>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Cédula:</span>
                  <span className="text-foreground font-medium">{identification}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="text-foreground font-medium">{email}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Estado:</span>
                  <span className="text-amber-500 font-medium">Pendiente</span>
                </div>
              </div>
            </div>

            <p className="text-muted-foreground text-center text-sm">
              Revisa tu bandeja de entrada y haz clic en el enlace para activar tu cuenta.
            </p>
            
            <div className="text-center">
              <Button 
                variant="outline" 
                onClick={handleResend}
                disabled={countdown > 0 || isResending}
                className="w-full border-border text-foreground hover:bg-accent"
              >
                {isResending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : countdown > 0 ? (
                  `Reenviar en ${countdown}s`
                ) : (
                  'Reenviar email'
                )}
              </Button>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-amber-700 text-xs text-center">
                ⏰ El enlace de verificación expira en 24 horas
              </p>
            </div>

            <Button 
              type="button"
              variant="hero" 
              className="w-full"
              onClick={() => navigate('/login')}
            >
              Ir a iniciar sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VerifyEmail;