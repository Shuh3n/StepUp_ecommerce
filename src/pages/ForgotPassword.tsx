import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '../lib/supabase';
import { useNavigate, Link } from "react-router-dom";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setEmailSent(true);
      toast({
        title: "Correo enviado",
        description: "Revisa tu bandeja de entrada para restablecer tu contraseña",
      });

    } catch (error: any) {
      console.error('Error sending reset email:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar el correo de recuperación",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
          onClick={() => navigate("/login")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al inicio de sesión
        </Button>

        <Card className="glass border-white/20 shadow-floating">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto">
              <h1 className="text-3xl font-bold gradient-text">Step Up</h1>
            </div>
            <div>
              <CardTitle className="text-2xl">¿Olvidaste tu contraseña?</CardTitle>
              <CardDescription>
                {emailSent 
                  ? "Revisa tu correo para continuar" 
                  : "Ingresa tu correo y te enviaremos un enlace para recuperarla"}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="px-8 pb-8">
            {!emailSent ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="glass border-white/20 pl-10"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  variant="hero" 
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Enviando..." : "Enviar enlace de recuperación"}
                </Button>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="text-center py-6">
                  <div className="mx-auto w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                    <Mail className="h-8 w-8 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Hemos enviado un enlace de recuperación a <strong>{email}</strong>
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Si no lo encuentras, revisa tu carpeta de spam.
                  </p>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate("/login")}
                >
                  Volver al inicio de sesión
                </Button>
              </div>
            )}

            {!emailSent && (
              <div className="mt-6 text-center">
                <p className="text-muted-foreground">
                  ¿Recordaste tu contraseña?{" "}
                  <Link
                    to="/login"
                    className="text-primary hover:underline font-medium"
                  >
                    Inicia sesión aquí
                  </Link>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
