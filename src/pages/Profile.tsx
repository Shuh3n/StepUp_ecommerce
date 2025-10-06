import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { User, Package, Heart } from "lucide-react";
import Navbar from "@/components/Navbar";
import { supabase } from "../lib/supabase";

const Profile = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState({
  full_name: "Usuario",
    email: "usuario@example.com",
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
        phone: dbUser?.phone || user.user_metadata?.phone || "",
        address: dbUser?.address || ""
      });

      setLoading(false);
    };

    fetchUserData();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    // Actualizar en tu tabla users
    const { error } = await supabase
      .from("users")
      .update({
  full_name: profileData.full_name,
        phone: profileData.phone,
        address: profileData.address,
      })
      .eq("email", profileData.email);

    if (error) {
      console.error("Error actualizando perfil:", error);
      toast({ title: "Error", description: "No se pudo actualizar", variant: "destructive" });
    } else {
      toast({ title: "Perfil actualizado", description: "Cambios guardados con éxito" });
    }
  };

  if (loading) return <p className="text-center mt-20">Cargando perfil...</p>;

  return (
    <div className="w-[70vw] mx-auto">
      <Navbar cartItems={0} onCartClick={() => {}} onContactClick={() => {}} onFavoritesClick={() => {}} />
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
                <CardDescription>Actualiza tus datos personales y de contacto</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Nombre completo</Label>
                      <Input
                        id="full_name"
                        value={profileData.full_name}
                        onChange={(e) =>
                          setProfileData({ ...profileData, full_name: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Correo electrónico</Label>
                      <Input id="email" type="email" value={profileData.email} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Teléfono</Label>
                      <Input
                        id="phone"
                        value={profileData.phone}
                        onChange={(e) =>
                          setProfileData({ ...profileData, phone: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Dirección</Label>
                      <Input
                        id="address"
                        value={profileData.address}
                        onChange={(e) =>
                          setProfileData({ ...profileData, address: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <Button type="submit" variant="hero">
                    Guardar Cambios
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Profile;
