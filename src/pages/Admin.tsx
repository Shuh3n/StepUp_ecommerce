    import React, { useState, useEffect } from "react";
    import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
    import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
    import { Button } from "@/components/ui/button";
    import { useToast } from "@/hooks/use-toast";
    import { BarChart, Users, Package } from "lucide-react";
    import Navbar from "@/components/Navbar";
    import { supabase } from '../lib/supabase';

    interface User {
    auth_id: string;
    identification: string;
    full_name: string;
    email: string;
    phone: string;
    created_at: string;
    updated_at: string;
    last_login: string;
    email_verified: boolean;
    login_count: number;
    order_count: number;
    }

    // Si quieres también puedes definir Order aquí...

    const Admin = () => {
        const { toast } = useToast();
        const [activeTab, setActiveTab] = useState("users");

        const [userData, setUserData] = useState<User[]>([]);
    // const [ordersData, setOrdersData] = useState<any[]>([]);
        const [siteStats, setSiteStats] = useState({ totalUsers: 0, totalOrders: 0 });
        const [editingUserId, setEditingUserId] = useState<string | null>(null);
        const [editForm, setEditForm] = useState<Partial<User>>({});

        // Fetch users: Obtiene la lista de usuarios desde Supabase
        const fetchUserData = async () => {
            const { data, error } = await supabase.from("users").select("*");
            if (!error) setUserData(data as User[]);
        };

        // Fetch orders
    /* const fetchOrdersData = async () => {
            const { data, error } = await supabase.from("orders").select("*");
            if (!error) setOrdersData(data || []);
        };
    */
        // Fetch stats
        const fetchSiteStats = async () => {
            const { count: userCount } = await supabase.from("users").select("*", { count: "exact", head: true });
            const { count: orderCount } = await supabase.from("orders").select("*", { count: "exact", head: true });
            setSiteStats({
                totalUsers: userCount || 0,
                totalOrders: orderCount || 0,
            });
        };

        //Edit user
        const startEditUser = (user: User) => {
        setEditingUserId(user.auth_id);
        setEditForm({
            full_name: user.full_name,
            email: user.email,
        phone: user.phone,
    });
    };

        useEffect(() => {
            fetchUserData();
            fetchSiteStats();

            // Suscripción en tiempo real a la tabla users
            const channel = supabase
                .channel('users-changes')
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'users' },
                    () => {
                        fetchUserData();
                    }
                )
                .subscribe();

            // Limpieza al desmontar
            return () => {
                supabase.removeChannel(channel);
            };
        }, []);

        // Delete user
        const handleDeleteUser = async (auth_id: string) => {
            await supabase.from("users").delete().eq("auth_id", auth_id );
            toast({ title: "Usuario eliminado" });
            fetchUserData();
            fetchSiteStats();
        };

        // Save user edits
        const saveEditUser = async (auth_id: string) => {
        const { error } = await supabase
            .from("users")
            .update(editForm)
            .eq("auth_id", auth_id);
        
        if (!error) {
            toast({ title: "Usuario actualizado" });
            setEditingUserId(null);
            setEditForm({});
            fetchUserData();
        } else {
            toast({ title: "Error al actualizar", description: error.message, variant: "destructive" });
        }
        };

        // Update order status
        /*const handleUpdateOrderStatus = async (id: string, status: string) => {
            await supabase.from("orders").update({ status }).eq("id", id);
            toast({ title: "Estado actualizado" });
            fetchOrdersData();
        };*/

        return (
            <div className="min-h-screen bg-background">
                <Navbar cartItems={0} onCartClick={() => {}} />
                <main className="pt-24 px-4 sm:px-6 lg:px-8 pb-16">
                    <div className="w-[70vw] mx-auto">
                        <div className="mb-8">
                            <h1 className="text-4xl font-bold">
                                <span className="gradient-text">Panel</span> de Administración
                            </h1>
                            <p className="text-muted-foreground mt-2">
                                Gestiona usuarios, pedidos y estadísticas del sitio
                            </p>
                        </div>

                        <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="space-y-8">
                            <TabsList className="grid grid-cols-3 w-full max-w-md">
                                <TabsTrigger value="users">
                                    <Users className="h-4 w-4 mr-2" />
                                    Usuarios
                                </TabsTrigger>
                                <TabsTrigger value="orders">
                                    <Package className="h-4 w-4 mr-2" />
                                    Pedidos
                                </TabsTrigger>
                                <TabsTrigger value="stats">
                                    <BarChart className="h-4 w-4 mr-2" />
                                    Estadísticas
                                </TabsTrigger>
                            </TabsList>

                            {/* Usuarios */}
                            <TabsContent value="users" className="space-y-6">
                                <Card className="glass border-white/20">
                                    <CardHeader>
                                        <CardTitle>Gestión de Usuarios</CardTitle>
                                        <CardDescription>
                                            Administra la información de los usuarios
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full text-sm">
                                                <thead>
                                                    <tr>
                                                        <th className="px-2 py-1">Nombre</th>
                                                        <th className="px-2 py-1">Email</th>
                                                        <th className="px-2 py-1">Acciones</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {userData.map((user) => (
                                                        <tr key={user.auth_id}>

                                                            <td className="px-2 py-1">{user.full_name}</td>
                                                            <td className="px-2 py-1">{user.email}</td>
                                                            <td className="px-2 py-1">
                                                                <Button size="sm" variant="destructive" onClick={() => handleDeleteUser(user.auth_id)}>
                                                                    Eliminar
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Pedidos */}
                            {/*<TabsContent value="orders" className="space-y-6">
                                <Card className="glass border-white/20">
                                    <CardHeader>
                                        <CardTitle>Gestión de Pedidos</CardTitle>
                                        <CardDescription>
                                            Visualiza y gestiona todos los pedidos
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full text-sm">
                                                <thead>
                                                    <tr>
                                                        <th className="px-2 py-1">ID</th>
                                                        <th className="px-2 py-1">Usuario</th>
                                                        <th className="px-2 py-1">Estado</th>
                                                        <th className="px-2 py-1">Total</th>
                                                        <th className="px-2 py-1">Acciones</th>
                                                    </tr>
                                                </thead>
                                                {<tbody>
                                                    {ordersData.map((order) => (
                                                        <tr key={order.id}>
                                                            <td className="px-2 py-1">{order.id}</td>
                                                            <td className="px-2 py-1">{order.user_id}</td>
                                                            <td className="px-2 py-1">{order.status}</td>
                                                            <td className="px-2 py-1">{order.total}</td>
                                                            <td className="px-2 py-1">
                                                                <Button size="sm" onClick={() => handleUpdateOrderStatus(order.id, "Entregado")}>
                                                                    Marcar como Entregado
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody> }
                                            </table>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent> */}

                            {/* Estadísticas */}
                            <TabsContent value="stats" className="space-y-6">
                                <Card className="glass border-white/20">
                                    <CardHeader>
                                        <CardTitle>Estadísticas del Sitio</CardTitle>
                                        <CardDescription>
                                            Visualiza estadísticas relevantes del sitio
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex flex-col gap-4">
                                            <div>Total de usuarios: <b>{siteStats.totalUsers}</b></div>
                                            <div>Total de pedidos: <b>{siteStats.totalOrders}</b></div>
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

    export default Admin;