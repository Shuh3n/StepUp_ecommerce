import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast, toast as toastApi } from "@/hooks/use-toast";
import { 
  User, 
  Package, 
  Heart, 
  Edit, 
  Trash2, 
  Eye, 
  Calendar, 
  MapPin, 
  Phone, 
  CreditCard, 
  Loader, 
  ChevronLeft, 
  ChevronRight,
  Star,
  ShoppingBag
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { removeFavorite } from "@/lib/api/favorites";

const EDGE_DEACTIVATE_URL = "https://xrflzmovtmlfrjhtoejs.supabase.co/functions/v1/deactivate-user";
const EDGE_ORDERS_URL = "https://xrflzmovtmlfrjhtoejs.supabase.co/functions/v1/get-user-orders";
const EDGE_FAVORITES_URL = "https://xrflzmovtmlfrjhtoejs.supabase.co/functions/v1/get-favorites";

interface OrderItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  size?: string;
  image_url?: string;
}

interface Order {
  id: string;
  status: string;
  total: number;
  address: string | null;
  phone: string | null;
  items: OrderItem[];
  payment_method: string;
  payment_status: string;
  created_at: string;
  updated_at: string;
  shipping: number;
  exchange_rate: number | null;
  total_usd: number | null;
}

interface FavoriteProduct {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  image_url: string;
  category: string;
  rating: number;
  isNew?: boolean;
}

const Profile = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  
  // Estado mejorado para paginación
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalOrders: 0,
    totalPages: 0,
    ordersPerPage: 10,
    hasNext: false,
    hasPrevious: false
  });
  
  const [profileData, setProfileData] = useState({
    full_name: "Usuario",
    email: "usuario@example.com",
    identification: "",
    phone: "",
    address: "",
    auth_id: ""
  });

  // Mapa de categorías para nombres legibles
  const [categoriesMap, setCategoriesMap] = useState<Record<string, string>>({});

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
        address: dbUser?.address || "",
        auth_id: user.id
      });
      setLoading(false);
    };
    fetchUserData();
  }, []);

  // Verificar sesión activa y redirigir si es necesario
  useEffect(() => {
    const checkSession = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) {
        console.log("No hay sesión activa, redirigiendo a login");
        navigate('/login');
      }
    };

    checkSession();

    // Escuchar cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        navigate('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Función para obtener pedidos de una página específica
  const fetchOrdersPage = async (page: number) => {
    if (!profileData.auth_id) return;
    
    setOrdersLoading(true);
    try {
      // Obtener el token de sesión actual
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData?.session?.access_token) {
        console.error("Error obteniendo sesión:", sessionError);
        toast({
          title: "Error de sesión",
          description: "Por favor, inicia sesión nuevamente",
          variant: "destructive"
        });
        navigate('/login');
        return;
      }

      const response = await fetch(`${EDGE_ORDERS_URL}?user_id=${profileData.auth_id}&page=${page}&limit=${pagination.ordersPerPage}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${sessionData.session.access_token}`,
          'Content-Type': 'application/json',
          'apikey': sessionData.session.access_token
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log("📦 Pedidos página", page, ":", data.orders?.length || 0);
        
        // Reemplazar pedidos completamente (no acumular)
        setOrders(data.orders || []);
        
        // Actualizar información de paginación
        const totalPages = Math.ceil(data.total / pagination.ordersPerPage);
        setPagination(prev => ({
          ...prev,
          currentPage: page,
          totalOrders: data.total || 0,
          totalPages: totalPages,
          hasNext: page < totalPages,
          hasPrevious: page > 1
        }));
        
      } else {
        console.error("Error fetching orders:", data.error);
        
        // Manejar diferentes tipos de errores
        if (response.status === 401) {
          toast({
            title: "Sesión expirada",
            description: "Por favor, inicia sesión nuevamente",
            variant: "destructive"
          });
          navigate('/login');
        } else if (response.status === 403) {
          toast({
            title: "Sin permisos",
            description: "No tienes permisos para ver estos pedidos",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Error",
            description: data.error || "No se pudieron cargar los pedidos",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast({
        title: "Error",
        description: "Error de conexión al cargar pedidos",
        variant: "destructive"
      });
    } finally {
      setOrdersLoading(false);
    }
  };

  // Funciones de navegación de páginas
  const goToNextPage = () => {
    if (pagination.hasNext) {
      fetchOrdersPage(pagination.currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (pagination.hasPrevious) {
      fetchOrdersPage(pagination.currentPage - 1);
    }
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      fetchOrdersPage(page);
    }
  };

  // Cargar pedidos cuando se selecciona la pestaña de pedidos
  useEffect(() => {
    if (activeTab === "orders" && profileData.auth_id) {
      // Reset paginación y cargar primera página
      setPagination(prev => ({
        ...prev,
        currentPage: 1,
        totalOrders: 0,
        totalPages: 0,
        hasNext: false,
        hasPrevious: false
      }));
      setOrders([]);
      fetchOrdersPage(1);
    }
  }, [activeTab, profileData.auth_id]);

  // Componente de paginación
  const PaginationControls = () => {
    if (pagination.totalPages <= 1) return null;

    // Calcular páginas a mostrar
    const getVisiblePages = () => {
      const delta = 2; // Mostrar 2 páginas antes y después de la actual
      const range = [];
      const rangeWithDots = [];
      
      for (let i = Math.max(2, pagination.currentPage - delta); 
           i <= Math.min(pagination.totalPages - 1, pagination.currentPage + delta); 
           i++) {
        range.push(i);
      }

      if (pagination.currentPage - delta > 2) {
        rangeWithDots.push(1, '...');
      } else {
        rangeWithDots.push(1);
      }

      rangeWithDots.push(...range);

      if (pagination.currentPage + delta < pagination.totalPages - 1) {
        rangeWithDots.push('...', pagination.totalPages);
      } else if (pagination.totalPages > 1) {
        rangeWithDots.push(pagination.totalPages);
      }

      return rangeWithDots;
    };

    return (
      <div className="flex items-center justify-center gap-2 mt-6">
        <Button
          variant="outline"
          size="sm"
          onClick={goToPreviousPage}
          disabled={!pagination.hasPrevious}
          className="text-white border-white/30 hover:bg-white/10 disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Anterior
        </Button>

        <div className="flex items-center gap-1">
          {getVisiblePages().map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <span className="text-white/50 px-2">...</span>
              ) : (
                <Button
                  variant={page === pagination.currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => goToPage(page as number)}
                  className={`w-8 h-8 p-0 ${
                    page === pagination.currentPage 
                      ? "bg-primary text-primary-foreground" 
                      : "text-white border-white/30 hover:bg-white/10"
                  }`}
                >
                  {page}
                </Button>
              )}
            </React.Fragment>
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={goToNextPage}
          disabled={!pagination.hasNext}
          className="text-white border-white/30 hover:bg-white/10 disabled:opacity-50"
        >
          Siguiente
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    );
  };

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

  // Función para obtener el color del estado
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pendiente':
        return 'bg-yellow-500';
      case 'confirmado':
        return 'bg-blue-500';
      case 'enviado':
        return 'bg-purple-500';
      case 'entregado':
        return 'bg-green-500';
      case 'cancelado':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Función para obtener el color del estado de pago
  const getPaymentStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pagado':
      case 'aprobado':
        return 'bg-green-500';
      case 'pendiente':
        return 'bg-yellow-500';
      case 'rechazado':
      case 'fallido':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Función para formatear fecha
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  // Cargar categorías para el mapeo de nombres
  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from('categories')
        .select('id, name');
      
      const map: Record<string, string> = {};
      (data || []).forEach(cat => { 
        map[cat.id] = cat.name; 
      });
      setCategoriesMap(map);
    };

    fetchCategories();
  }, []);

  // Función para obtener favoritos del usuario
  const fetchUserFavorites = async () => {
    if (!profileData.auth_id) return;
    
    setFavoritesLoading(true);
    try {
      // Obtener el token de sesión actual
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData?.session?.access_token) {
        console.error("Error obteniendo sesión:", sessionError);
        toast({
          title: "Error de sesión",
          description: "Por favor, inicia sesión nuevamente",
          variant: "destructive"
        });
        navigate('/login');
        return;
      }

      const response = await fetch(EDGE_FAVORITES_URL, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${sessionData.session.access_token}`,
          'Content-Type': 'application/json',
          'apikey': sessionData.session.access_token
        }
      });

      const result = await response.json();
      
      if (response.ok) {
        const favoritesArray = Array.isArray(result.favorites) ? result.favorites : Array.isArray(result) ? result : [];
        
        // Mapear favoritos al formato correcto
        const mappedFavorites: FavoriteProduct[] = favoritesArray
          .filter((fav: any) => fav.products)
          .map((fav: any) => ({
            id: fav.product_id,
            name: fav.products?.name,
            price: Number(fav.products?.price),
            originalPrice: fav.products?.original_price ? Number(fav.products.original_price) : undefined,
            image_url: fav.products?.image_url,
            category: categoriesMap[fav.products?.category] || "General",
            rating: 5,
            isNew: false,
          }));

        console.log("❤️ Favoritos cargados:", mappedFavorites.length);
        setFavorites(mappedFavorites);
        
      } else {
        console.error("Error fetching favorites:", result.error);
        
        if (response.status === 401) {
          toast({
            title: "Sesión expirada",
            description: "Por favor, inicia sesión nuevamente",
            variant: "destructive"
          });
          navigate('/login');
        } else {
          toast({
            title: "Error",
            description: result.error || "No se pudieron cargar los favoritos",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error("Error fetching favorites:", error);
      toast({
        title: "Error",
        description: "Error de conexión al cargar favoritos",
        variant: "destructive"
      });
    } finally {
      setFavoritesLoading(false);
    }
  };

  // Cargar favoritos cuando se selecciona la pestaña de favoritos
  useEffect(() => {
    if (activeTab === "favorites" && profileData.auth_id && Object.keys(categoriesMap).length > 0) {
      fetchUserFavorites();
    }
  }, [activeTab, profileData.auth_id, categoriesMap]);

  // Función para eliminar favorito
  const handleRemoveFavorite = async (productId: number) => {
    try {
      const success = await removeFavorite(productId);
      if (success) {
        setFavorites(prev => prev.filter(fav => fav.id !== productId));
        toast({
          title: "Eliminado de favoritos",
          description: "El producto ha sido removido de tus favoritos."
        });
      } else {
        toast({
          title: "Error",
          description: "No se pudo eliminar de favoritos",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error removing favorite:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar de favoritos",
        variant: "destructive"
      });
    }
  };

  // Función para agregar al carrito (placeholder)
  const handleAddToCart = (product: FavoriteProduct) => {
    // Aquí puedes implementar la lógica para agregar al carrito
    toast({
      title: "Agregado al carrito",
      description: `${product.name} ha sido agregado al carrito`,
    });
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center">
      <Loader className="w-8 h-8 animate-spin text-primary" />
      <span className="text-lg text-muted-foreground ml-2">Cargando perfil...</span>
    </div>
  );

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Navbar
        cartItems={0}
        onCartClick={() => {}}
        onContactClick={() => {}}
        onFavoritesClick={() => {}}
      />
      <main className="pt-24 px-4 sm:px-6 lg:px-8 pb-16">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto mb-6 bg-white/20 rounded-xl shadow">
            <TabsTrigger value="profile">
              <User className="h-4 w-4 mr-2" /> Mi Perfil
            </TabsTrigger>
            <TabsTrigger value="orders">
              <Package className="h-4 w-4 mr-2" /> Pedidos
            </TabsTrigger>
            <TabsTrigger value="favorites">
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

          <TabsContent value="orders">
            <Card className="glass border border-orange-200/50 shadow-xl">
              <CardHeader>
                <CardTitle className="text-white text-2xl flex items-center gap-2">
                  <Package className="h-6 w-6" />
                  Mis Pedidos
                  {pagination.totalOrders > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {pagination.totalOrders}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-white/70">
                  Historial de tus compras y seguimiento de envíos
                  {pagination.totalPages > 1 && (
                    <span className="block mt-1">
                      Página {pagination.currentPage} de {pagination.totalPages}
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader className="w-6 h-6 animate-spin text-white mr-2" />
                    <span className="text-white">Cargando pedidos...</span>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-16 w-16 text-white/50 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">No tienes pedidos aún</h3>
                    <p className="text-white/70 mb-4">
                      Cuando realices tu primera compra, aparecerá aquí
                    </p>
                    <Button 
                      onClick={() => navigate('/products')}
                      variant="hero"
                    >
                      Explorar Productos
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <Card key={order.id} className="bg-white/10 border-white/20">
                        <CardContent className="p-4">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-white font-medium">
                                  Pedido #{order.id.slice(-8)}
                                </span>
                                <Badge className={`text-white ${getStatusColor(order.status)}`}>
                                  {order.status}
                                </Badge>
                                <Badge className={`text-white ${getPaymentStatusColor(order.payment_status)}`}>
                                  {order.payment_status}
                                </Badge>
                              </div>
                              
                              <div className="flex items-center gap-4 text-sm text-white/70">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  {formatDate(order.created_at)}
                                </div>
                                <div className="flex items-center gap-1">
                                  <CreditCard className="h-4 w-4" />
                                  {order.payment_method}
                                </div>
                              </div>
                              
                              <div className="text-white/70 text-sm">
                                {order.items.length} artículo{order.items.length !== 1 ? 's' : ''}
                              </div>
                            </div>
                            
                            <div className="flex flex-col md:items-end gap-2">
                              <div className="text-white font-bold text-lg">
                                ${order.total.toLocaleString()}
                                {order.total_usd && (
                                  <span className="text-sm text-white/70 ml-2">
                                    (USD ${order.total_usd})
                                  </span>
                                )}
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setOrderModalOpen(true);
                                }}
                                className="flex items-center gap-1 text-white border-white/30 hover:bg-white/10"
                              >
                                <Eye className="h-4 w-4" />
                                Ver Detalles
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {/* Controles de paginación */}
                    <PaginationControls />
                    
                    {/* Información de la página actual */}
                    {orders.length > 0 && (
                      <div className="text-center text-white/50 text-sm mt-4">
                        Mostrando {orders.length} pedidos de la página {pagination.currentPage} 
                        ({pagination.totalOrders} total)
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="favorites">
            <Card className="glass border border-orange-200/50 shadow-xl">
              <CardHeader>
                <CardTitle className="text-white text-2xl flex items-center gap-2">
                  <Heart className="h-6 w-6 text-red-500 fill-current" />
                  Mis Favoritos
                  {favorites.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {favorites.length}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-white/70">
                  Tus productos guardados como favoritos
                </CardDescription>
              </CardHeader>
              <CardContent>
                {favoritesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader className="w-6 h-6 animate-spin text-white mr-2" />
                    <span className="text-white">Cargando favoritos...</span>
                  </div>
                ) : favorites.length === 0 ? (
                  <div className="text-center py-8">
                    <Heart className="h-16 w-16 text-white/50 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">No tienes favoritos aún</h3>
                    <p className="text-white/70 mb-4">
                      Agrega productos a tus favoritos para verlos aquí
                    </p>
                    <Button 
                      onClick={() => navigate('/products')}
                      variant="hero"
                    >
                      Explorar Productos
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {favorites.map((product) => {
                      const discount = product.originalPrice 
                        ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) 
                        : 0;

                      return (
                        <Card
                          key={product.id}
                          className="group relative bg-white/5 border-white/10 overflow-hidden hover:bg-white/10 transition-all duration-300 hover:scale-105"
                        >
                          <CardContent className="p-0">
                            {/* Product Image */}
                            <div className="relative aspect-square overflow-hidden">
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = '/placeholder.png';
                                  target.onerror = null;
                                }}
                              />
                              
                              {/* Badges */}
                              <div className="absolute top-3 left-3 flex flex-col gap-2">
                                {product.isNew && (
                                  <Badge className="bg-primary text-primary-foreground">
                                    Nuevo
                                  </Badge>
                                )}
                                {discount > 0 && (
                                  <Badge className="bg-green-500 text-white">
                                    -{discount}%
                                  </Badge>
                                )}
                              </div>

                              {/* Remove from favorites */}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-3 right-3 rounded-full bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white"
                                onClick={() => handleRemoveFavorite(product.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>

                            {/* Product Info */}
                            <div className="p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <Badge variant="outline" className="text-xs text-white border-white/30">
                                  {product.category}
                                </Badge>
                                <div className="flex items-center gap-1">
                                  <Star className="h-3 w-3 text-yellow-400 fill-current" />
                                  <span className="text-xs text-white/70">{product.rating}</span>
                                </div>
                              </div>

                              <h3 className="font-semibold text-white line-clamp-2 text-sm">
                                {product.name}
                              </h3>

                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg font-bold text-white">
                                    ${product.price.toLocaleString()}
                                  </span>
                                  {product.originalPrice && (
                                    <span className="text-sm text-white/50 line-through">
                                      ${product.originalPrice.toLocaleString()}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <Button
                                onClick={() => handleAddToCart(product)}
                                className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white transition-all duration-300 hover:scale-105"
                                size="sm"
                              >
                                <ShoppingBag className="h-4 w-4 mr-2" />
                                Agregar al Carrito
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modal de detalles del pedido */}
        <Dialog open={orderModalOpen} onOpenChange={setOrderModalOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-card/95 backdrop-blur-md border border-white/20">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                <Package className="h-5 w-5" />
                Detalles del Pedido #{selectedOrder?.id.slice(-8)}
              </DialogTitle>
            </DialogHeader>
            
            {selectedOrder && (
              <div className="space-y-6">
                {/* Estado y información general */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white/70">Estado del Pedido</Label>
                    <Badge className={`text-white ${getStatusColor(selectedOrder.status)}`}>
                      {selectedOrder.status}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/70">Estado del Pago</Label>
                    <Badge className={`text-white ${getPaymentStatusColor(selectedOrder.payment_status)}`}>
                      {selectedOrder.payment_status}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/70">Fecha del Pedido</Label>
                    <p className="text-white">{formatDate(selectedOrder.created_at)}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/70">Método de Pago</Label>
                    <p className="text-white">{selectedOrder.payment_method}</p>
                  </div>
                </div>

                {/* Información de envío */}
                {selectedOrder.address && (
                  <div className="space-y-2">
                    <Label className="text-white/70 flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      Dirección de Envío
                    </Label>
                    <p className="text-white">{selectedOrder.address}</p>
                  </div>
                )}

                {selectedOrder.phone && (
                  <div className="space-y-2">
                    <Label className="text-white/70 flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      Teléfono de Contacto
                    </Label>
                    <p className="text-white">{selectedOrder.phone}</p>
                  </div>
                )}

                {/* Productos del pedido */}
                <div className="space-y-4">
                  <Label className="text-white/70">Productos</Label>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item, index) => (
                      <Card key={`${selectedOrder.id}-${item.id}-${index}`} className="bg-white/5 border-white/10">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <div className="flex-shrink-0">
                              {item.image_url ? (
                                <img
                                  src={item.image_url}
                                  alt={item.name}
                                  className="w-16 h-16 object-cover rounded-lg border border-white/10"
                                  onError={(e) => {
                                    // Si la imagen falla, mostrar placeholder
                                    const target = e.target as HTMLImageElement;
                                    target.src = '/placeholder.png';
                                    target.onerror = null;
                                  }}
                                />
                              ) : (
                                <div className="w-16 h-16 bg-white/10 rounded-lg flex items-center justify-center border border-white/10">
                                  <Package className="h-8 w-8 text-white/50" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 space-y-1">
                              <h4 className="text-white font-medium">{item.name}</h4>
                              {item.size && (
                                <p className="text-white/70 text-sm">Talla: {item.size}</p>
                              )}
                              <p className="text-white/70 text-sm">
                                Cantidad: {item.quantity} × ${item.price.toLocaleString()}
                              </p>
                            </div>
                            <div className="text-white font-medium">
                              ${(item.price * item.quantity).toLocaleString()}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Resumen de costos */}
                <div className="border-t border-white/20 pt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-white/70">
                      <span>Subtotal</span>
                      <span>${(selectedOrder.total - (selectedOrder.shipping || 0)).toLocaleString()}</span>
                    </div>
                    {selectedOrder.shipping > 0 && (
                      <div className="flex justify-between text-white/70">
                        <span>Envío</span>
                        <span>${selectedOrder.shipping.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-white font-bold text-lg border-t border-white/20 pt-2">
                      <span>Total</span>
                      <span>${selectedOrder.total.toLocaleString()}</span>
                    </div>
                    {selectedOrder.total_usd && (
                      <div className="flex justify-between text-white/70 text-sm">
                        <span>Total USD</span>
                        <span>USD ${selectedOrder.total_usd}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Profile;