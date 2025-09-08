import React, { useState, useEffect } from "react";
// ...existing imports...
// Interfaces de inventario
interface Product {
    id: number;
    name: string;
    category: string;
    stock: number;
    stock_minimo: number;
    price: number;
    image_url: string;
    description: string;
}

interface InventoryMovement {
    id: number;
    product_id: number;
    product_name: string;
    tipo: 'venta' | 'devolucion' | 'reposicion';
    cantidad: number;
    fecha: string;
    products?: { name: string };
}
import { toast } from '@/hooks/use-toast';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChartContainer } from "@/components/ui/chart";
import { BarChart as ReBarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Users, Package } from "lucide-react";
import Navbar from "@/components/Navbar";
import { supabase } from '../lib/supabase';
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose
} from "@/components/ui/dialog";

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

interface Product {
    id: number;
    name: string;
    stock: number;
    stock_minimo: number;
}

interface InventoryMovement {
    id: number;
    product_id: number;
    tipo: 'venta' | 'devolucion' | 'reposicion';
    cantidad: number;
    fecha: string;
}

// Si quieres también puedes definir Order aquí...

const Admin = () => {
    // Handler para crear producto
    const handleCreateProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        // Validar nombre único
        const nameExists = products.some(p => p.name === newProduct.name);
        if (nameExists) {
            setNameError('Ya existe un producto con ese nombre');
            return;
        }
        setNameError(null);
        // Validar imagen
        if (!imageFile) {
            setImageError('La imagen es obligatoria');
            return;
        }
        setImageError(null);
        // Subir imagen al bucket 'product-images' en Supabase Storage
        // Subir imagen al bucket 'product-images' en Supabase Storage
        if (!(imageFile instanceof File)) {
            setImageError('Archivo de imagen inválido');
            return;
        }

        const fileName = `product-${newProduct.name.replace(/\s+/g, '-')}-${Date.now()}`;
        const { data, error } = await supabase.storage
            .from('product-images')
            .upload(fileName, imageFile);

        if (error) {
            setImageError(`Error al subir la imagen: ${error.message}`);
            return;
        }
        // Obtener la URL pública de la imagen subida
        const publicUrl = supabase.storage.from('product-images').getPublicUrl(fileName).data.publicUrl;
        // Crear producto en Supabase con la URL pública de la imagen
        const { error: insertError } = await supabase.from('products').insert({
            name: newProduct.name,
            category: newProduct.category,
            stock: newProduct.stock,
            stock_minimo: newProduct.stock_minimo,
            price: newProduct.price,
            image_url: publicUrl, // Usar publicUrl correctamente
            description: newProduct.description
        });
        if (!insertError) {
            toast({ title: 'Producto creado' });
            setShowCreateProductModal(false);
            setNewProduct({ name: '', category: '', stock: 1, stock_minimo: 0, price: 0, image_url: '', description: '' });
            setImageFile(null);
            fetchProducts();
        } else {
            toast({ title: 'Error al crear', description: insertError.message, variant: 'destructive' });
        }
    };

    // Handler para cambio de imagen en creación
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setImageError(null);
        }
    };

    // Handler para eliminar producto
    const handleDeleteProduct = async (product: Product) => {
        const { error } = await supabase.from('products').delete().eq('id', product.id);
        if (!error) {
            toast({ title: 'Producto eliminado' });
            fetchProducts();
        } else {
            toast({ title: 'Error al eliminar', description: error.message, variant: 'destructive' });
        }
    };
    // --- CRUD Productos ---
    // Estado para modal de creación
    const [showCreateProductModal, setShowCreateProductModal] = useState(false);
    // Estado para nuevo producto
    const [newProduct, setNewProduct] = useState({
        name: '',
        category: '',
        stock: 1,
        stock_minimo: 0,
        price: 0,
        image_url: '',
        description: ''
    });
    const [nameError, setNameError] = useState<string | null>(null);
    const [imageError, setImageError] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);

    // Estado para edición de producto
    const [editProduct, setEditProduct] = useState<any | null>(null);
    const [editNameError, setEditNameError] = useState<string | null>(null);
    const [editImageError, setEditImageError] = useState<string | null>(null);
    const [editImageFile, setEditImageFile] = useState<File | null>(null);

    // Handler para abrir modal de edición
    const handleEditProduct = (product: any) => {
        setEditProduct(product);
        setEditNameError(null);
        setEditImageError(null);
        setEditImageFile(null);
    };

    // Handler para cambio de imagen en edición
    const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setEditImageFile(file);
            setEditImageError(null);
        }
    };

    // Handler para actualizar producto
    const handleUpdateProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editProduct) return;
        // Validar nombre único
        const nameExists = products.some(p => p.name === editProduct.name && p.id !== editProduct.id);
        if (nameExists) {
            setEditNameError('Ya existe un producto con ese nombre');
            return;
        }
        setEditNameError(null);
        // Si hay imagen nueva, subirla al bucket 'product-images'
        let imageUrl = editProduct.image_url;
        if (editImageFile) {
            // Obtener extensión del archivo de imagen
            const ext = editImageFile.name.split('.').pop();
            const fileName = `product-${editProduct.id}-${Date.now()}.${ext}`;
            const { data, error } = await supabase.storage.from('product-images').upload(fileName, editImageFile, { upsert: true });
            if (error) {
                setEditImageError('Error al subir la imagen');
                return;
            }
            imageUrl = supabase.storage.from('product-images').getPublicUrl(fileName).data.publicUrl;
        }
        // Actualizar en Supabase
        const { error: updateError } = await supabase.from('products').update({
            name: editProduct.name,
            category: editProduct.category,
            stock: editProduct.stock,
            stock_minimo: editProduct.stock_minimo,
            price: editProduct.price,
            image_url: imageUrl,
            description: editProduct.description
        }).eq('id', editProduct.id);
        if (!updateError) {
            toast({ title: 'Producto actualizado' });
            setEditProduct(null);
            fetchProducts();
        } else {
            toast({ title: 'Error al actualizar', description: updateError.message, variant: 'destructive' });
        }
    };
    // Inventario
    const [products, setProducts] = useState<Product[]>([]);
    const [inventoryMovements, setInventoryMovements] = useState<InventoryMovement[]>([]);
    // Paginación para historial de movimientos
    const [movementPage, setMovementPage] = useState(1);
    const movementsPerPage = 10;
    const totalMovementPages = Math.ceil(inventoryMovements.length / movementsPerPage);
    const paginatedMovements = inventoryMovements.slice((movementPage - 1) * movementsPerPage, movementPage * movementsPerPage);
    const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
    const [movementType, setMovementType] = useState<'venta' | 'devolucion' | 'reposicion'>('venta');
    const [movementQty, setMovementQty] = useState<string>('1');
    const [qtyError, setQtyError] = useState<string | null>(null);
    const [alertStock, setAlertStock] = useState<string | null>(null);
    // Consulta real de productos desde Supabase
    const fetchProducts = async () => {
        const { data, error } = await supabase.from('products').select('*');
        if (!error && data) {
            setProducts(data);
        } else {
            toast({ title: 'Error al cargar productos', description: error?.message, variant: 'destructive' });
        }
    };


    // Actualizar inventario y registrar movimiento
    const handleInventoryMovement = async () => {
        if (!selectedProductId) return toast({ title: 'Selecciona un producto' });
        const prod = products.find(p => p.id === selectedProductId);
        if (!prod) return toast({ title: 'Producto no encontrado' });
        const qtyNum = Number(movementQty);
        if (!movementQty || isNaN(qtyNum) || qtyNum < 1) {
            setQtyError('La cantidad debe ser un número mayor a 0');
            return;
        }
        setQtyError(null);
        let newStock = prod.stock;
        if (movementType === 'venta') newStock -= qtyNum;
        if (movementType === 'devolucion' || movementType === 'reposicion') newStock += qtyNum;
        if (newStock < 0) return toast({ title: 'No se permiten cantidades negativas en inventario', variant: 'destructive' });

        // Actualiza el stock en la tabla products
        const { error: updateError } = await supabase
            .from('products')
            .update({ stock: newStock })
            .eq('id', prod.id);
        if (updateError) {
            toast({ title: 'Error al actualizar stock', description: updateError.message, variant: 'destructive' });
            return;
        }

    // ...existing code...

        // Obtener el nombre del usuario actual (ajusta según tu lógica de autenticación)
        const usuario_nombre = userData.find(u => u.auth_id === supabase.auth.getUser()?.data?.user?.id)?.full_name || 'Desconocido';

        // Registrar en historial
        const { error: historyError } = await supabase
            .from('inventory_history')
            .insert({
                product_id: prod.id,
                product_name: prod.name,
                tipo: movementType,
                cantidad: qtyNum,
                fecha: new Date().toISOString(),
                usuario_nombre
            });
        if (historyError) {
            toast({ title: 'Error al registrar historial', description: historyError.message, variant: 'destructive' });
            return;
        }

        toast({ title: 'Inventario actualizado', description: `Nuevo stock: ${newStock}` });
        if (newStock < prod.stock_minimo) {
            setAlertStock(`¡Stock bajo para ${prod.name}! (${newStock} unidades, mínimo ${prod.stock_minimo})`);
        } else {
            setAlertStock(null);
        }
    };

    // Consulta de movimientos de inventario desde Supabase
    // Consulta de historial de inventario desde Supabase
    const fetchInventoryMovements = async () => {
        const { data, error } = await supabase
            .from('inventory_history')
            .select('*');
        if (!error && data) {
            setInventoryMovements(data);
        } else {
            toast({ title: 'Error al cargar historial', description: error?.message, variant: 'destructive' });
        }
    };

    //Consulta del historial de movimientos de inventario
    const [inventoryHistory, setInventoryHistory] = useState([]);
    const fetchInventoryHistory = async () => {
        const { data, error } = await supabase.from('inventory_history').select('*');
        if (!error && data) {
            setInventoryHistory(data);
        } else {
            toast({ title: 'Error al cargar historial', description: error?.message, variant: 'destructive' });
        }
    };
    const [viewOrder, setViewOrder] = useState<any | null>(null);
    const [editOrder, setEditOrder] = useState<any | null>(null);
    const [confirmDeleteUserId, setConfirmDeleteUserId] = useState<string | null>(null);
    const [confirmDeleteOrderId, setConfirmDeleteOrderId] = useState<string | null>(null);
    const [loadingAction, setLoadingAction] = useState<string | null>(null);
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState("users");

    const [userData, setUserData] = useState<User[]>([]);
    const [ordersData, setOrdersData] = useState<any[]>([]);
    const [orderColumns, setOrderColumns] = useState<string[]>([]);
    const [siteStats, setSiteStats] = useState({ totalUsers: 0, totalOrders: 0 });
    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<User>>({});
    const [editModalOpen, setEditModalOpen] = useState(false);

    // Fetch users: Obtiene la lista de usuarios desde Supabase
    const fetchUserData = async () => {
        const { data, error } = await supabase.from("users").select("*");
        if (!error) setUserData(data as User[]);
    };

    // Fetch orders
    const fetchOrdersData = async () => {
        const { data, error } = await supabase.from("orders").select("*");
        if (!error) {
            setOrdersData(data || []);
            if (data && data.length > 0) {
                setOrderColumns(Object.keys(data[0]));
            }
        }
    };

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
        fetchOrdersData();
        fetchInventoryHistory();
        fetchInventoryMovements();
        fetchProducts();

        // Suscripción en tiempo real a la tabla users
        const usersChannel = supabase
            .channel('users-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'users' },
                () => {
                    fetchUserData();
                    fetchSiteStats();
                }
            )
            .subscribe();

        // Suscripción en tiempo real a la tabla orders
        const ordersChannel = supabase
            .channel('orders-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'orders' },
                () => {
                    fetchOrdersData();
                    fetchSiteStats();
                }
            )
            .subscribe();

    // ...existing code...
        // Suscripción en tiempo real a la tabla inventory_history
        const historyChannel = supabase
            .channel('inventory-history-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'inventory_history' },
                () => {
                    fetchInventoryMovements(); // Actualiza la tabla principal de historial
                }
            )
            .subscribe();

        // Suscripción en tiempo real a la tabla products
        const productsChannel = supabase
            .channel('products-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'products' },
                () => {
                    fetchProducts();
                }
            )
            .subscribe();

        // Limpieza al desmontar
        return () => {
            supabase.removeChannel(usersChannel);
            supabase.removeChannel(ordersChannel);
            supabase.removeChannel(productsChannel);
            supabase.removeChannel(historyChannel);
        };
    }, []);

    // Delete user
    const handleDeleteUser = async (auth_id: string) => {
        await supabase.from("users").delete().eq("auth_id", auth_id);
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

    // Actualizar estado del pedido
    const handleUpdateOrderStatus = async (id: string, status: string) => {
        const { error } = await supabase.from("orders").update({ status }).eq("id", id);
        if (!error) {
            toast({ title: "Estado actualizado", description: `Pedido marcado como ${status}` });
        } else {
            toast({ title: "Error al actualizar pedido", description: error.message, variant: "destructive" });
        }
    };

    // Eliminar pedido
    const handleDeleteOrder = async (id: string) => {
        const { error } = await supabase.from("orders").delete().eq("id", id);
        if (!error) {
            toast({ title: "Pedido eliminado" });
        } else {
            toast({ title: "Error al eliminar pedido", description: error.message, variant: "destructive" });
        }
    };

    // Estados de paginación
    const [ordersPage, setOrdersPage] = useState(1);
    const ordersPerPage = 10;
    const totalOrdersPages = Math.ceil(ordersData.length / ordersPerPage);
    const paginatedOrders = ordersData.slice((ordersPage - 1) * ordersPerPage, ordersPage * ordersPerPage);

    const [productsPage, setProductsPage] = useState(1);
    const productsPerPage = 10;
    const totalProductsPages = Math.ceil(products.length / productsPerPage);
    const paginatedProducts = products.slice((productsPage - 1) * productsPerPage, productsPage * productsPerPage);

    return (
        <div className="min-h-screen bg-background">
            <Navbar cartItems={0} onCartClick={() => { }} />
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
                        <TabsList className="grid grid-cols-5 w-full max-w-xl">
                            <TabsTrigger value="users">
                                <Users className="h-4 w-4 mr-2" />
                                Usuarios
                            </TabsTrigger>
                            <TabsTrigger value="orders">
                                <Package className="h-4 w-4 mr-2" />
                                Pedidos
                            </TabsTrigger>
                            <TabsTrigger value="inventory">
                                <Package className="h-4 w-4 mr-2" />
                                Inventario
                            </TabsTrigger>
                            <TabsTrigger value="products">
                                <Package className="h-4 w-4 mr-2" />
                                Productos
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
                                    <CardTitle className="text-left">Gestión de Usuarios</CardTitle>
                                    <CardDescription className="text-left">
                                        Administra la información de los usuarios
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full text-sm">
                                            <thead>
                                                <tr>
                                                    <th className="px-2 py-1 text-left">Nombre</th>
                                                    <th className="px-2 py-1 text-left">Email</th>
                                                    <th className="px-2 py-1 text-left">Teléfono</th>
                                                    <th className="px-2 py-1 text-left">Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {userData.map((user) => (
                                                    <tr key={user.auth_id}>
                                                        <td className="px-2 py-1">{user.full_name}</td>
                                                        <td className="px-2 py-1">{user.email}</td>
                                                        <td className="px-2 py-1">{user.phone}</td>
                                                        <td className="px-2 py-1">
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button size="sm" variant="outline"><ChevronDown /></Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent>
                                                                    <DropdownMenuItem onClick={() => { startEditUser(user); setEditModalOpen(true); }}>Editar</DropdownMenuItem>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem onClick={() => setConfirmDeleteUserId(user.auth_id)} disabled={loadingAction === user.auth_id}>Eliminar</DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                            {/* Modal editar usuario */}
                                                            <Dialog open={editModalOpen && editingUserId === user.auth_id} onOpenChange={(open) => {
                                                                setEditModalOpen(open);
                                                                if (!open) { setEditingUserId(null); setEditForm({}); }
                                                            }}>
                                                                <DialogTrigger asChild></DialogTrigger>
                                                                <DialogContent>
                                                                    <DialogHeader>
                                                                        <DialogTitle>Editar Usuario</DialogTitle>
                                                                        <DialogDescription>Modifica los datos del usuario y guarda los cambios.</DialogDescription>
                                                                    </DialogHeader>
                                                                    <form onSubmit={e => { e.preventDefault(); saveEditUser(user.auth_id); }} className="space-y-4">
                                                                        <div>
                                                                            <Label htmlFor="edit-fullname">Nombre</Label>
                                                                            <Input
                                                                                id="edit-fullname"
                                                                                type="text"
                                                                                className="glass border-white/20"
                                                                                value={editForm.full_name || ''}
                                                                                onChange={e => setEditForm({ ...editForm, full_name: e.target.value })}
                                                                                required
                                                                            />
                                                                        </div>
                                                                        <div>
                                                                            <Label htmlFor="edit-email">Email</Label>
                                                                            <Input
                                                                                id="edit-email"
                                                                                type="email"
                                                                                className="glass border-white/20"
                                                                                value={editForm.email || ''}
                                                                                onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                                                                                required
                                                                            />
                                                                        </div>
                                                                        <div>
                                                                            <Label htmlFor="edit-phone">Teléfono</Label>
                                                                            <Input
                                                                                id="edit-phone"
                                                                                type="text"
                                                                                className="glass border-white/20"
                                                                                value={editForm.phone || ''}
                                                                                onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                                                                            />
                                                                        </div>
                                                                        <DialogFooter className="flex gap-2 justify-end">
                                                                            <Button type="submit" size="sm" variant="default">Guardar</Button>
                                                                            <DialogClose asChild>
                                                                                <Button type="button" size="sm" variant="outline" onClick={() => { setEditingUserId(null); setEditForm({}); setEditModalOpen(false); }}>Cancelar</Button>
                                                                            </DialogClose>
                                                                        </DialogFooter>
                                                                    </form>
                                                                </DialogContent>
                                                            </Dialog>
                                                            {/* Modal confirmación eliminar usuario */}
                                                            <Dialog open={confirmDeleteUserId === user.auth_id} onOpenChange={(open) => { if (!open) setConfirmDeleteUserId(null); }}>
                                                                <DialogContent>
                                                                    <DialogHeader>
                                                                        <DialogTitle>¿Eliminar usuario?</DialogTitle>
                                                                        <DialogDescription>Esta acción no se puede deshacer.</DialogDescription>
                                                                    </DialogHeader>
                                                                    <DialogFooter>
                                                                        <Button variant="destructive" size="sm" disabled={loadingAction === user.auth_id} onClick={async () => {
                                                                            setLoadingAction(user.auth_id);
                                                                            await handleDeleteUser(user.auth_id);
                                                                            setLoadingAction(null);
                                                                            setConfirmDeleteUserId(null);
                                                                        }}>Eliminar</Button>
                                                                        <DialogClose asChild>
                                                                            <Button size="sm" variant="outline" onClick={() => setConfirmDeleteUserId(null)}>Cancelar</Button>
                                                                        </DialogClose>
                                                                    </DialogFooter>
                                                                </DialogContent>
                                                            </Dialog>
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
                        <TabsContent value="orders" className="space-y-6">
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
                                                    <th className="px-2 py-1 text-left">Usuario</th>
                                                    <th className="px-2 py-1 text-left">Estado</th>
                                                    <th className="px-2 py-1 text-left">Total</th>
                                                    <th className="px-2 py-1 text-left">Dirección</th>
                                                    <th className="px-2 py-1 text-left">Teléfono</th>
                                                    <th className="px-2 py-1 text-left">Artículos</th>
                                                    <th className="px-2 py-1 text-left">Método de pago</th>
                                                    <th className="px-2 py-1 text-left">Estado de pago</th>
                                                    <th className="px-2 py-1 text-left">Creado</th>
                                                    <th className="px-2 py-1 text-left">Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {paginatedOrders.map((order) => {
                                                    const user = userData.find(u => u.auth_id === order.user_id);
                                                    return (
                                                        <tr key={order.id}>
                                                            <td className="px-2 py-1">{user ? user.full_name : 'Desconocido'}</td>
                                                            <td className="px-2 py-1">{order.status}</td>
                                                            <td className="px-2 py-1">${order.total?.toFixed(2)}</td>
                                                            <td className="px-2 py-1">{order.address}</td>
                                                            <td className="px-2 py-1">{order.phone}</td>
                                                            <td className="px-2 py-1">{
                                                                Array.isArray(order.items)
                                                                    ? order.items.map(i => `${i.name} x${i.qty}`).join(', ')
                                                                    : typeof order.items === 'string'
                                                                        ? order.items
                                                                        : ''
                                                            }</td>
                                                            <td className="px-2 py-1">{order.payment_method}</td>
                                                            <td className="px-2 py-1">{order.payment_status}</td>
                                                            <td className="px-2 py-1">{order.created_at ? new Date(order.created_at).toLocaleString() : ''}</td>
                                                            <td className="px-2 py-1">
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button size="sm" variant="outline"><ChevronDown /></Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent>
                                                                        <DropdownMenuItem onClick={() => setViewOrder(order)}>Ver detalles</DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => setEditOrder(order)}>Editar</DropdownMenuItem>
                                                                        <DropdownMenuSeparator />
                                                                        <DropdownMenuItem onClick={() => handleUpdateOrderStatus(order.id, "Entregado")} disabled={loadingAction === order.id}>Marcar como entregado</DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => handleUpdateOrderStatus(order.id, "Pendiente")} disabled={loadingAction === order.id}>Marcar como pendiente</DropdownMenuItem>
                                                                        <DropdownMenuSeparator />
                                                                        <DropdownMenuItem onClick={() => setConfirmDeleteOrderId(order.id)} disabled={loadingAction === order.id} style={{ color: 'red' }}>Eliminar</DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                                {/* Modal ver detalles pedido */}
                                                                <Dialog open={viewOrder && viewOrder.id === order.id} onOpenChange={(open) => { if (!open) setViewOrder(null); }}>
                                                                    <DialogContent>
                                                                        <DialogHeader>
                                                                            <DialogTitle>Detalles del Pedido</DialogTitle>
                                                                        </DialogHeader>
                                                                        <div className="space-y-2">
                                                                            <div><b>Usuario:</b> {user ? user.full_name : 'Desconocido'}</div>
                                                                            <div><b>Estado:</b> {order.status}</div>
                                                                            <div><b>Total:</b> ${order.total?.toFixed(2)}</div>
                                                                            <div><b>Dirección:</b> {order.address}</div>
                                                                            <div><b>Teléfono:</b> {order.phone}</div>
                                                                            <div><b>Artículos:</b> {
                                                                                Array.isArray(order.items)
                                                                                    ? order.items.map(i => `${i.name} x${i.qty}`).join(', ')
                                                                                    : typeof order.items === 'string'
                                                                                        ? order.items
                                                                                        : ''
                                                                            }</div>
                                                                            <div><b>Método de pago:</b> {order.payment_method}</div>
                                                                            <div><b>Estado de pago:</b> {order.payment_status}</div>
                                                                            <div><b>Creado:</b> {order.created_at ? new Date(order.created_at).toLocaleString() : ''}</div>
                                                                        </div>
                                                                    </DialogContent>
                                                                </Dialog>
                                                                {/* Modal editar pedido */}
                                                                <Dialog open={editOrder && editOrder.id === order.id} onOpenChange={(open) => { if (!open) setEditOrder(null); }}>
                                                                    <DialogContent>
                                                                        <DialogHeader>
                                                                            <DialogTitle>Editar Pedido</DialogTitle>
                                                                        </DialogHeader>
                                                                        <form onSubmit={async e => {
                                                                            e.preventDefault();
                                                                            setLoadingAction(order.id);
                                                                            // Aquí puedes agregar lógica para editar el pedido
                                                                            setLoadingAction(null);
                                                                            setEditOrder(null);
                                                                            toast({ title: "Pedido actualizado" });
                                                                        }} className="space-y-4">
                                                                            <div>
                                                                                <Label htmlFor="edit-status">Estado</Label>
                                                                                <Input id="edit-status" type="text" defaultValue={order.status} />
                                                                            </div>
                                                                            <div>
                                                                                <Label htmlFor="edit-address">Dirección</Label>
                                                                                <Input id="edit-address" type="text" defaultValue={order.address} />
                                                                            </div>
                                                                            <DialogFooter className="flex gap-2 justify-end">
                                                                                <Button type="submit" size="sm" variant="default" disabled={loadingAction === order.id}>Guardar</Button>
                                                                                <DialogClose asChild>
                                                                                    <Button type="button" size="sm" variant="outline" onClick={() => setEditOrder(null)}>Cancelar</Button>
                                                                                </DialogClose>
                                                                            </DialogFooter>
                                                                        </form>
                                                                    </DialogContent>
                                                                </Dialog>
                                                                {/* Modal confirmación eliminar pedido */}
                                                                <Dialog open={confirmDeleteOrderId === order.id} onOpenChange={(open) => { if (!open) setConfirmDeleteOrderId(null); }}>
                                                                    <DialogContent>
                                                                        <DialogHeader>
                                                                            <DialogTitle>¿Eliminar pedido?</DialogTitle>
                                                                            <DialogDescription>Esta acción no se puede deshacer.</DialogDescription>
                                                                        </DialogHeader>
                                                                        <DialogFooter>
                                                                            <Button variant="destructive" size="sm" disabled={loadingAction === order.id} onClick={async () => {
                                                                                setLoadingAction(order.id);
                                                                                await handleDeleteOrder(order.id);
                                                                                setLoadingAction(null);
                                                                                setConfirmDeleteOrderId(null);
                                                                            }}>Eliminar</Button>
                                                                            <DialogClose asChild>
                                                                                <Button size="sm" variant="outline" onClick={() => setConfirmDeleteOrderId(null)}>Cancelar</Button>
                                                                            </DialogClose>
                                                                        </DialogFooter>
                                                                    </DialogContent>
                                                                </Dialog>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                    {/* Controles de paginación pedidos */}
                                    {totalOrdersPages > 1 && (
                                        <div className="flex justify-center items-center gap-2 p-4">
                                            <Button size="sm" variant="outline" disabled={ordersPage === 1} onClick={() => setOrdersPage(ordersPage - 1)}>
                                                Anterior
                                            </Button>
                                            <span className="text-sm text-muted-foreground">Página {ordersPage} de {totalOrdersPages}</span>
                                            <Button size="sm" variant="outline" disabled={ordersPage === totalOrdersPages} onClick={() => setOrdersPage(ordersPage + 1)}>
                                                Siguiente
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Estadísticas */}
                        {/* Inventario */}
                        <TabsContent value="inventory" className="space-y-6">
                            <Card className="glass border-white/20">
                                <CardHeader>
                                    <CardTitle className="text-left">Gestión de Inventario</CardTitle>
                                    <CardDescription className="text-left">Actualiza el stock y registra movimientos</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-col md:flex-row gap-6 items-end mb-6 p-4 bg-card rounded-lg border border-white/20">
                                        <div className="flex-1 min-w-[180px]">
                                            <label className="block mb-2 font-semibold text-muted-foreground">Producto</label>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="outline" className="w-full flex justify-between items-center px-2 py-1">
                                                        <span>
                                                            {selectedProductId
                                                                ? products.find(p => p.id === selectedProductId)?.name + ` (Stock: ${products.find(p => p.id === selectedProductId)?.stock})`
                                                                : 'Selecciona...'}
                                                        </span>
                                                        <ChevronDown className="ml-2 h-4 w-4 text-muted-foreground" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent className="w-full">
                                                    {products.map(p => (
                                                        <DropdownMenuItem key={p.id} onClick={() => setSelectedProductId(p.id)}>
                                                            {p.name} (Stock: {p.stock})
                                                        </DropdownMenuItem>
                                                    ))}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                        <div className="flex-1 min-w-[180px]">
                                            <label className="block mb-2 font-semibold text-muted-foreground">Tipo de movimiento</label>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="outline" className="w-full flex justify-between items-center px-2 py-1">
                                                        <span>
                                                            {movementType === 'venta' && 'Venta'}
                                                            {movementType === 'devolucion' && 'Devolución'}
                                                            {movementType === 'reposicion' && 'Reposición'}
                                                        </span>
                                                        <ChevronDown className="ml-2 h-4 w-4 text-muted-foreground" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent className="w-full">
                                                    <DropdownMenuItem onClick={() => setMovementType('venta')}>Venta</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => setMovementType('devolucion')}>Devolución</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => setMovementType('reposicion')}>Reposición</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                        <div className="flex-1 min-w-[180px]">
                                            <label className="block mb-2 font-semibold text-muted-foreground">Cantidad</label>
                                            <input
                                                type="number"
                                                min={1}
                                                className={`border rounded px-2 py-1 w-full bg-background text-foreground ${qtyError ? 'border-destructive' : ''}`}
                                                value={movementQty}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    setMovementQty(val);
                                                    const numVal = Number(val);
                                                    if (!val || isNaN(numVal) || numVal < 1) {
                                                        setQtyError('La cantidad debe ser un número mayor a 0');
                                                    } else {
                                                        setQtyError(null);
                                                    }
                                                }}
                                            />
                                            {qtyError && <span className="text-destructive text-xs mt-1 block">{qtyError}</span>}
                                        </div>
                                        <Button className="bg-primary text-primary-foreground hover:bg-primary/80 transition" onClick={handleInventoryMovement}>Registrar movimiento</Button>
                                    </div>
                                    {alertStock && <div className="mt-4 p-3 bg-destructive/20 text-destructive border border-destructive rounded-lg font-semibold shadow">{alertStock}</div>}
                                    <div className="mt-8">
                                        <h3 className="font-bold mb-2 text-muted-foreground">Historial de movimientos</h3>
                                        <div className="relative">
                                            <table className="min-w-full text-sm">
                                                <thead>
                                                    <tr>
                                                        <th className="px-2 py-1 text-left">Fecha</th>
                                                        <th className="px-2 py-1 text-left">Producto</th>
                                                        <th className="px-2 py-1 text-left">Tipo</th>
                                                        <th className="px-2 py-1 text-left">Cantidad</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {paginatedMovements.map(hist => (
                                                        <tr key={hist.id}>
                                                            <td className="px-2 py-1">{new Date(hist.fecha).toLocaleString()}</td>
                                                            <td className="px-2 py-1">{hist.product_name}</td>
                                                            <td className="px-2 py-1">{hist.tipo}</td>
                                                            <td className="px-2 py-1">{hist.cantidad}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            {/* Controles de paginación con posición fija */}
                                            {totalMovementPages > 1 && (
                                                <div className="fixed left-0 right-0 bottom-0 flex justify-center items-center gap-2 p-4 bg-card border-t border-white/10 z-10" style={{ boxShadow: '0 -2px 8px rgba(0,0,0,0.04)' }}>
                                                    <Button size="sm" variant="outline" disabled={movementPage === 1} onClick={() => setMovementPage(movementPage - 1)}>
                                                        Anterior
                                                    </Button>
                                                    <span className="text-sm text-muted-foreground">Página {movementPage} de {totalMovementPages}</span>
                                                    <Button size="sm" variant="outline" disabled={movementPage === totalMovementPages} onClick={() => setMovementPage(movementPage + 1)}>
                                                        Siguiente
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="products" className="space-y-6">
                            <Card className="glass border-white/20">
                                <CardHeader>
                                    <CardTitle>Gestión de Productos</CardTitle>
                                    <CardDescription>Administra los productos, categorías y stock</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex justify-end mb-4">
                                        <Button variant="default" size="sm" onClick={() => setShowCreateProductModal(true)}>
                                            Nuevo producto
                                        </Button>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full text-sm">
                                            <thead>
                                                <tr>
                                                    <th className="px-2 py-1 text-left">Imagen</th>
                                                    <th className="px-2 py-1 text-left">Nombre</th>
                                                    <th className="px-2 py-1 text-left">Categoría</th>
                                                    <th className="px-2 py-1 text-left">Stock</th>
                                                    <th className="px-2 py-1 text-left">Stock mínimo</th>
                                                    <th className="px-2 py-1 text-left">Precio</th>
                                                    <th className="px-2 py-1 text-left">Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {paginatedProducts.map(product => (
                                                    <tr key={product.id}>
                                                        <td className="px-2 py-1">
                                                            {product.image_url ? (
                                                                <img src={product.image_url} alt={product.name} className="h-12 w-12 object-cover rounded" />
                                                            ) : (
                                                                <span className="text-xs text-muted-foreground">Sin imagen</span>
                                                            )}
                                                        </td>
                                                        <td className="px-2 py-1 font-semibold">{product.name}</td>
                                                        <td className="px-2 py-1">{product.category}</td>
                                                        <td className="px-2 py-1">{product.stock}</td>
                                                        <td className="px-2 py-1">{product.stock_minimo}</td>
                                                        <td className="px-2 py-1">${product.price?.toFixed(2)}</td>
                                                        <td className="px-2 py-1">
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button size="sm" variant="outline"><ChevronDown /></Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent>
                                                                    <DropdownMenuItem onClick={() => handleEditProduct(product)}>Editar</DropdownMenuItem>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem onClick={() => handleDeleteProduct(product)} style={{ color: 'red' }}>Eliminar</DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {/* Modal crear producto */}
                                    <Dialog open={showCreateProductModal} onOpenChange={setShowCreateProductModal}>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Nuevo Producto</DialogTitle>
                                                <DialogDescription>Completa todos los campos para crear un producto.</DialogDescription>
                                            </DialogHeader>
                                            <form onSubmit={handleCreateProduct} className="space-y-4">
                                                <div>
                                                    <Label htmlFor="product-name">Nombre</Label>
                                                    <Input id="product-name" type="text" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} required />
                                                    {nameError && <span className="text-destructive text-xs mt-1 block">{nameError}</span>}
                                                </div>
                                                <div>
                                                    <Label htmlFor="product-category">Categoría</Label>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="outline" className="w-full flex justify-between items-center px-2 py-1">
                                                                <span>{newProduct.category || 'Selecciona...'}</span>
                                                                <ChevronDown className="ml-2 h-4 w-4 text-muted-foreground" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent className="w-full">
                                                            {['Camisetas', 'Oversize', 'Hoddies', 'Pantalon'].map(cat => (
                                                                <DropdownMenuItem key={cat} onClick={() => setNewProduct({ ...newProduct, category: cat })}>{cat}</DropdownMenuItem>
                                                            ))}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                                <div>
                                                    <Label htmlFor="product-stock">Stock</Label>
                                                    <Input id="product-stock" type="number" min={1} value={newProduct.stock} onChange={e => setNewProduct({ ...newProduct, stock: Number(e.target.value) })} required />
                                                </div>
                                                <div>
                                                    <Label htmlFor="product-stock-min">Stock mínimo</Label>
                                                    <Input id="product-stock-min" type="number" min={0} value={newProduct.stock_minimo} onChange={e => setNewProduct({ ...newProduct, stock_minimo: Number(e.target.value) })} required />
                                                </div>
                                                <div>
                                                    <Label htmlFor="product-price">Precio</Label>
                                                    <Input id="product-price" type="number" min={0.01} step={0.01} value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: Number(e.target.value) })} required />
                                                </div>
                                                <div>
                                                    <Label htmlFor="product-image">Imagen</Label>
                                                    <Input id="product-image" type="file" accept="image/*" onChange={handleImageChange} required />
                                                    {imageError && <span className="text-destructive text-xs mt-1 block">{imageError}</span>}
                                                </div>
                                                <div>
                                                    <Label htmlFor="product-description">Descripción</Label>
                                                    <Input id="product-description" type="text" value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} required />
                                                </div>
                                                <DialogFooter className="flex gap-2 justify-end">
                                                    <Button type="submit" size="sm" variant="default" onClick={handleCreateProduct}>Confirmar</Button>
                                                    <DialogClose asChild>
                                                        <Button type="button" size="sm" variant="outline" onClick={() => setShowCreateProductModal(false)}>Cancelar</Button>
                                                    </DialogClose>
                                                </DialogFooter>
                                            </form>
                                        </DialogContent>
                                    </Dialog>
                                    {/* Modal editar producto */}
                                    <Dialog open={!!editProduct} onOpenChange={open => !open && setEditProduct(null)}>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Editar Producto</DialogTitle>
                                                <DialogDescription>Modifica los datos del producto. La imagen es opcional.</DialogDescription>
                                            </DialogHeader>
                                            {editProduct && (
                                                <form onSubmit={handleUpdateProduct} className="space-y-4">
                                                    <div>
                                                        <Label htmlFor="edit-product-name">Nombre</Label>
                                                        <Input id="edit-product-name" type="text" value={editProduct.name} onChange={e => setEditProduct({ ...editProduct, name: e.target.value })} required />
                                                        {editNameError && <span className="text-destructive text-xs mt-1 block">{editNameError}</span>}
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="edit-product-category">Categoría</Label>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="outline" className="w-full flex justify-between items-center px-2 py-1">
                                                                    <span>{editProduct.category || 'Selecciona...'}</span>
                                                                    <ChevronDown className="ml-2 h-4 w-4 text-muted-foreground" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent className="w-full">
                                                                {['Camisetas', 'Oversize', 'Hoddies', 'Pantalon'].map(cat => (
                                                                    <DropdownMenuItem key={cat} onClick={() => setEditProduct({ ...editProduct, category: cat })}>{cat}</DropdownMenuItem>
                                                                ))}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="edit-product-stock">Stock</Label>
                                                        <Input id="edit-product-stock" type="number" min={1} value={editProduct.stock} onChange={e => setEditProduct({ ...editProduct, stock: Number(e.target.value) })} required />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="edit-product-stock-min">Stock mínimo</Label>
                                                        <Input id="edit-product-stock-min" type="number" min={0} value={editProduct.stock_minimo} onChange={e => setEditProduct({ ...editProduct, stock_minimo: Number(e.target.value) })} required />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="edit-product-price">Precio</Label>
                                                        <Input id="edit-product-price" type="number" min={0.01} step={0.01} value={editProduct.price} onChange={e => setEditProduct({ ...editProduct, price: Number(e.target.value) })} required />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="edit-product-image">Imagen (opcional)</Label>
                                                        <Input id="edit-product-image" type="file" accept="image/*" onChange={handleEditImageChange} />
                                                        {editImageError && <span className="text-destructive text-xs mt-1 block">{editImageError}</span>}
                                                        {editProduct.image_url && (
                                                            <img src={editProduct.image_url} alt={editProduct.name} className="h-12 w-12 object-cover rounded mt-2" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="edit-product-description">Descripción</Label>
                                                        <Input id="edit-product-description" type="text" value={editProduct.description} onChange={e => setEditProduct({ ...editProduct, description: e.target.value })} required />
                                                    </div>
                                                    <DialogFooter className="flex gap-2 justify-end">
                                                        <Button type="submit" size="sm" variant="default">Guardar cambios</Button>
                                                        <DialogClose asChild>
                                                            <Button type="button" size="sm" variant="outline" onClick={() => setEditProduct(null)}>Cancelar</Button>
                                                        </DialogClose>
                                                    </DialogFooter>
                                                </form>
                                            )}
                                        </DialogContent>
                                    </Dialog>
                                </CardContent>
                            </Card>
                        </TabsContent>
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
                                        <ChartContainer config={{ users: { color: '#f97316', label: 'Usuarios' }, orders: { color: '#ef4444', label: 'Pedidos' } }}>
                                            <ResponsiveContainer width="50%" height={50}>
                                                <ReBarChart data={[{ name: 'Usuarios', value: siteStats.totalUsers }, { name: 'Pedidos', value: siteStats.totalOrders }]}>
                                                    <XAxis dataKey="name" />
                                                    <YAxis allowDecimals={false} />
                                                    <Tooltip content={() => null} />
                                                    <Bar dataKey="value" fill="#f97316" radius={[8, 8, 0, 0]} />
                                                </ReBarChart>
                                            </ResponsiveContainer>
                                        </ChartContainer>
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