import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast, toast as toastApi } from "@/hooks/use-toast";
import { User, Package, Heart, Edit, Trash2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

const EDGE_DEACTIVATE_URL = "https://xrflzmovtmlfrjhtoejs.supabase.co/functions/v1/deactivate-user";

const Profile = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: "Usuario",
    email: "usuario@example.com",
    identification: "",
    phone: "",
    address: ""
  });

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error("Error obteniendo usuario auth:", authError);
        setLoading(false);
        return;
      }
      const user = authData?.user;
      if (!user) {
        setLoading(false);
        return;
      }
      const { data: dbUser, error: dbError } = await supabase
        .from("users")
        .select("*")
        .eq("auth_id", user.id)
        .maybeSingle();
      if (dbError) {
        console.error("Error obteniendo datos de users:", dbError);
      }
      setProfileData({
        full_name: dbUser?.full_name || user.user_metadata?.full_name || "Usuario",
        email: user.email || "usuario@example.com",
        identification: dbUser?.identification || user.user_metadata?.identification || "",
        phone: dbUser?.phone || user.user_metadata?.phone || "",
        address: dbUser?.address || ""
      });
      setLoading(false);
    };
    fetchUserData();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileData.full_name.trim()) {
      toast({ title: "Error", description: "El nombre no puede estar vacío", variant: "destructive" });
      return;
    }
    if (!profileData.phone.trim() || !/^\d{10}$/.test(profileData.phone)) {
      toast({ title: "Error", description: "El teléfono debe tener exactamente 10 números", variant: "destructive" });
      return;
    }
    if (!profileData.address.trim()) {
      toast({ title: "Error", description: "La dirección no puede estar vacía", variant: "destructive" });
      return;
    }
    try {
      const { error } = await supabase
        .from("users")
        .update({
          full_name: profileData.full_name.trim(),
          phone: profileData.phone.trim(),
          address: profileData.address.trim(),
        })
        .eq("email", profileData.email);
      if (error) throw error;
      toast({ title: "Perfil actualizado", description: "Cambios guardados con éxito" });
      setIsEditing(false);
    } catch (error) {
      console.error("Error actualizando perfil:", error);
      toast({ title: "Error", description: "No se pudo actualizar", variant: "destructive" });
    }
  };

  // Eliminación lógica usando Edge Function
  const handleDeleteAccount = async () => {
    const confirmationToast = toastApi({
      title: "¿Seguro que deseas cancelar tu cuenta?",
      description: (
        <>
          <span className="block mb-2">
            <strong className="text-destructive">Esta acción es IRREVERSIBLE.</strong>
            <br />
            <span>No podrás volver a ingresar ni recuperar tu cuenta. Se notificará por correo.</span>
          </span>
          <div className="flex gap-2 mt-4">
            <Button
              size="sm"
              variant="outline"
              onClick={() => confirmationToast.dismiss()}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={async () => {
                confirmationToast.dismiss();
                try {
                  // 1. Llamar a la edge function
                  const { data: sessionData } = await supabase.auth.getSession();
                  const access_token = sessionData?.session?.access_token;
                  if (!access_token) throw new Error("Sesión inválida.");
                  const response = await fetch(EDGE_DEACTIVATE_URL, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      "Authorization": `Bearer ${access_token}`,
                    }
                  });
                  const result = await response.json();
                  if (!result.ok) {
                    throw new Error(result.error || "Error desconocido");
                  }
                  await supabase.auth.signOut();
                  toast({
                    title: "Cuenta cancelada",
                    description: "Tu cuenta ha sido desactivada y recibirás un correo de confirmación.",
                    variant: "destructive"
                  });
                  navigate('/');
                } catch (error: any) {
                  toast({
                    title: "Error",
                    description: error?.message || "No se pudo eliminar la cuenta",
                    variant: "destructive"
                  });
                }
              }}
            >
              Sí, cancelar cuenta
            </Button>
          </div>
        </>
      ),
      duration: 12000,
      variant: "destructive"
    });
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center">
      <span className="text-lg text-muted-foreground">Cargando perfil...</span>
    </div>
  );

  return (
    <div className="w-full max-w-3xl mx-auto">
      <Navbar
        cartItems={0}
        onCartClick={() => {}}
        onContactClick={() => {}}
        onFavoritesClick={() => {}}
      />
      <main className="pt-24 px-4 sm:px-6 lg:px-8 pb-16">
        <Tabs defaultValue={activeTab} className="space-y-8">
          <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto mb-6 bg-white/20 rounded-xl shadow">
            <TabsTrigger value="profile" onClick={() => setActiveTab("profile")}>
              <User className="h-4 w-4 mr-2" /> Mi Perfil
            </TabsTrigger>
            <TabsTrigger value="orders" onClick={() => setActiveTab("orders")}>
              <Package className="h-4 w-4 mr-2" /> Pedidos
            </TabsTrigger>
            <TabsTrigger value="favorites" onClick={() => setActiveTab("favorites")}>
              <Heart className="h-4 w-4 mr-2" /> Favoritos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card className="glass border border-orange-200/50 shadow-xl">
              <CardHeader>
                <CardTitle className="text-white text-2xl">Información Personal</CardTitle>
                <CardDescription className="text-white/70">
                  Gestiona tus datos de perfil
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-7">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-white">Nombre completo *</Label>
                      {isEditing ? (
                        <Input
                          required
                          value={profileData.full_name}
                          onChange={(e) =>
                            setProfileData({
                              ...profileData,
                              full_name: e.target.value
                            })
                          }
                          placeholder="Ingresa tu nombre completo"
                          className={!profileData.full_name.trim() ? "border-red-500" : ""}
                        />
                      ) : (
                        <p className="text-white/80 pt-2">{profileData.full_name}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">Cédula</Label>
                      <p className="text-white/80 pt-2">{profileData.identification}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">Correo electrónico</Label>
                      <p className="text-white/80 pt-2">{profileData.email}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">Teléfono * (10 dígitos)</Label>
                      {isEditing ? (
                        <Input
                          required
                          type="tel"
                          maxLength={10}
                          pattern="\d{10}"
                          value={profileData.phone}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                            setProfileData({
                              ...profileData,
                              phone: value
                            });
                          }}
                          placeholder="Ingresa tu teléfono (10 dígitos)"
                          className={
                            !profileData.phone.trim() || !/^\d{10}$/.test(profileData.phone)
                              ? "border-red-500"
                              : ""
                          }
                        />
                      ) : (
                        <p className="text-white/80 pt-2">{profileData.phone || "No especificado"}</p>
                      )}
                      {isEditing && profileData.phone && !/^\d{10}$/.test(profileData.phone) && (
                        <p className="text-sm text-red-500 mt-1">
                          El teléfono debe tener exactamente 10 números
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">Dirección *</Label>
                      {isEditing ? (
                        <Input
                          required
                          value={profileData.address}
                          onChange={(e) =>
                            setProfileData({
                              ...profileData,
                              address: e.target.value
                            })
                          }
                          placeholder="Ingresa tu dirección"
                          className={!profileData.address.trim() ? "border-red-500" : ""}
                        />
                      ) : (
                        <p className="text-white/80 pt-2">{profileData.address || "No especificada"}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col md:flex-row gap-3 pt-8">
                    {isEditing ? (
                      <>
                        <Button onClick={handleUpdateProfile} variant="hero">
                          Guardar Cambios
                        </Button>
                        <Button onClick={() => setIsEditing(false)} variant="outline">
                          Cancelar
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          onClick={() => setIsEditing(true)}
                          variant="outline"
                          className="flex items-center gap-2"
                        >
                          <Edit className="h-4 w-4" />
                          Modificar Información
                        </Button>
                        <Button
                          onClick={handleDeleteAccount}
                          variant="destructive"
                          className="flex items-center gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          Cancelar Cuenta
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Profile;