import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { User, Package, Heart, ShoppingBag, MapPin, Phone, Mail } from "lucide-react";
import Navbar from "@/components/Navbar";
import { supabase } from '../lib/supabase';

const Profile = () => {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState("profile");

    // Estados para el perfil
    const [profileData, setProfileData] = useState({
        name: "Usuario",
        email: "usuario@example.com",
        phone: "+57 300 123 4567",
        address: "Calle Principal #123"
    });

    // Estado simulado para los pedidos
    const orders = [
        {
            id: "ORD-001",
            date: "2025-08-28",
            status: "Entregado",
            total: 150000,
            items: [
                { name: "Camiseta Urban Orange", quantity: 1, price: 25000 },
                { name: "Hoodie Fire Edition", quantity: 1, price: 75000 }
            ]
        },
        {
            id: "ORD-002",
            date: "2025-08-25",
            status: "En proceso",
            total: 85000,
            items: [
                { name: "Jeans Black Edition", quantity: 1, price: 85000 }
            ]
        }
    ];

    const handleUpdateProfile = (e: React.FormEvent) => {
        e.preventDefault();
        toast({
            title: "Perfil actualizado",
            description: "Los cambios han sido guardados correctamente",
        });
    };

    return (
        <div className="w-[70vw] mx-auto">
            <Navbar cartItems={0} onCartClick={function (): void {
                throw new Error("Function not implemented.");
            } }/>
            <main className="pt-24 px-4 sm:px-6 lg:px-8 pb-16">
                <div className="max-w-7xl mx-auto">
                    {/* Background decoration */}
                    <div className="absolute inset-0 overflow-hidden -z-10">
                        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl"></div>
                        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl"></div>
                    </div>

                    <div className="mb-8">
                        <h1 className="text-4xl font-bold">
                            <span className="gradient-text">Mi</span> Cuenta
                        </h1>
                        <p className="text-muted-foreground mt-2">
                            Gestiona tu información personal y revisa tus pedidos
                        </p>
                    </div>

                    <Tabs defaultValue={activeTab} className="space-y-8">
                        <TabsList className="grid grid-cols-3 w-full max-w-md">
                            <TabsTrigger value="profile" onClick={() => setActiveTab("profile")}>
                                <User className="h-4 w-4 mr-2" />
                                Mi Perfil
                            </TabsTrigger>
                            <TabsTrigger value="orders" onClick={() => setActiveTab("orders")}>
                                <Package className="h-4 w-4 mr-2" />
                                Pedidos
                            </TabsTrigger>
                            <TabsTrigger value="favorites" onClick={() => setActiveTab("favorites")}>
                                <Heart className="h-4 w-4 mr-2" />
                                Favoritos
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="profile" className="space-y-6">
                            <Card className="glass border-white/20">
                                <CardHeader>
                                    <CardTitle>Información Personal</CardTitle>
                                    <CardDescription>
                                        Actualiza tus datos personales y de contacto
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleUpdateProfile} className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label htmlFor="name">Nombre completo</Label>
                                                <Input
                                                    id="name"
                                                    value={profileData.name}
                                                    onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                                                    className="glass border-white/20"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="email">Correo electrónico</Label>
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    value={profileData.email}
                                                    onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                                                    className="glass border-white/20"
                                                    disabled
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="phone">Teléfono</Label>
                                                <Input
                                                    id="phone"
                                                    type="tel"
                                                    value={profileData.phone}
                                                    onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                                                    className="glass border-white/20"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="address">Dirección</Label>
                                                <Input
                                                    id="address"
                                                    value={profileData.address}
                                                    onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                                                    className="glass border-white/20"
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

                        <TabsContent value="orders">
                            <div className="space-y-6">
                                {orders.map((order) => (
                                    <Card key={order.id} className="glass border-white/20">
                                        <CardHeader>
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <CardTitle className="flex items-center gap-2">
                                                        <ShoppingBag className="h-5 w-5" />
                                                        Pedido {order.id}
                                                    </CardTitle>
                                                    <CardDescription>{order.date}</CardDescription>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-4">
                                                {order.items.map((item, index) => (
                                                    <div key={index} className="flex justify-between items-center">
                                                        <div>
                                                            <p className="font-medium">{item.name}</p>
                                                            <p className="text-sm text-muted-foreground">
                                                                Cantidad: {item.quantity}
                                                            </p>
                                                        </div>
                                                        <p className="font-medium">
                                                            ${item.price.toLocaleString()}
                                                        </p>
                                                    </div>
                                                ))}
                                                <div className="pt-4 border-t border-border">
                                                    <div className="flex justify-between items-center">
                                                        <p className="font-semibold">Total</p>
                                                        <p className="font-semibold">
                                                            ${order.total.toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </TabsContent>

                        <TabsContent value="favorites">
                            <Card className="glass border-white/20">
                                <CardHeader>
                                    <CardTitle>Mis Favoritos</CardTitle>
                                    <CardDescription>
                                        Productos que has marcado como favoritos
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {/* Aquí puedes integrar el componente FavoritesModal o crear una nueva vista de favoritos */}
                                        {/* Por ahora mostraremos un mensaje */}
                                        <p className="text-muted-foreground col-span-full text-center py-8">
                                            Tus productos favoritos aparecerán aquí
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </main>
        </div>
    );
};

export default Profile;
