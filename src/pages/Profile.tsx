import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { User, Package, Heart, Edit, Trash2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

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

      // 1. Obtener el usuario autenticado
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

      // 2. Buscar los datos extendidos en la tabla `users`
      const { data: dbUser, error: dbError } = await supabase
        .from("users")
        .select("*")
        .eq("auth_id", user.id)   // 👈 clave foránea
        .maybeSingle();

      if (dbError) {
        console.error("Error obteniendo datos de users:", dbError);
      }

      // 3. Combinar info de auth y tabla users
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
    
    // Validación de campos vacíos
    if (!profileData.full_name.trim()) {
      toast({ 
        title: "Error", 
        description: "El nombre no puede estar vacío", 
        variant: "destructive" 
      });
      return;
    }

    if (!profileData.phone.trim() || !/^\d{10}$/.test(profileData.phone)) {
      toast({ 
        title: "Error", 
        description: "El teléfono debe tener exactamente 10 números", 
        variant: "destructive" 
      });
      return;
    }

    if (!profileData.address.trim()) {
      toast({ 
        title: "Error", 
        description: "La dirección no puede estar vacía", 
        variant: "destructive" 
      });
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

  const handleDeleteAccount = async () => {
    if (window.confirm("¿Estás seguro de que deseas eliminar tu cuenta? Esta acción no se puede deshacer.")) {
      try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;

        // Aquí podrías agregar la lógica para eliminar los datos del usuario de tu tabla users

        toast({ title: "Cuenta eliminada", description: "Tu cuenta ha sido eliminada exitosamente" });
        navigate('/');
      } catch (error) {
        console.error("Error eliminando cuenta:", error);
        toast({ title: "Error", description: "No se pudo eliminar la cuenta", variant: "destructive" });
      }
    }
  };

  if (loading) return <p className="text-center mt-20">Cargando perfil...</p>;

  return (
    <div className="w-[70vw] mx-auto">
      <Navbar cartItems={0} onCartClick={() => { } } onContactClick={function (): void {
        throw new Error("Function not implemented.");
      } } onFavoritesClick={function (): void {
        throw new Error("Function not implemented.");
      } } />
      <main className="pt-24 px-4 sm:px-6 lg:px-8 pb-16">
        <Tabs defaultValue={activeTab} className="space-y-8">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
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
            <Card className="glass border-white/20">
              <CardHeader>
                <CardTitle>Información Personal</CardTitle>
                <CardDescription>Tu información de perfil</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Nombre completo *</Label>
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
                        <p className="text-foreground/80 pt-2">{profileData.full_name}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Cédula</Label>
                      <p className="text-foreground/80 pt-2">{profileData.identification}</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Correo electrónico</Label>
                      <p className="text-foreground/80 pt-2">{profileData.email}</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Teléfono * (10 dígitos)</Label>
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
                        <p className="text-foreground/80 pt-2">{profileData.phone || "No especificado"}</p>
                      )}
                      {isEditing && profileData.phone && !/^\d{10}$/.test(profileData.phone) && (
                        <p className="text-sm text-red-500 mt-1">
                          El teléfono debe tener exactamente 10 números
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Dirección *</Label>
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
                        <p className="text-foreground/80 pt-2">{profileData.address || "No especificada"}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-4 pt-4">
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
                          Eliminar Cuenta
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
