import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
  ShoppingBag,
  Check,
  X,
  Shield,
  AlertCircle,
  Mail,
  AlertTriangle,
  Truck
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { removeFavorite } from "@/lib/api/favorites";
import AddressManager from "@/components/AddressManager";
import Cart from "@/components/Cart"; // Agregar import del Cart
import TrackingModal from "@/components/TrackingModal"; // Agregar import

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
  shipping_status?: string;
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

// Función para obtener el color del estado del pedido - ACTUALIZADA
const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'pending':
    case 'pendiente':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'processing':
    case 'procesando':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'confirmed':
    case 'confirmado': // CAMBIADO A VERDE
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'shipped':
    case 'enviado':
      return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    case 'delivered':
    case 'entregado':
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'; // Verde más oscuro para diferenciar de confirmado
    case 'cancelled':
    case 'cancelado':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
};

// Función para obtener el color del estado del pago
const getPaymentStatusColor = (paymentStatus: string) => {
  switch (paymentStatus.toLowerCase()) {
    case 'paid':
    case 'pagado':
    case 'completed':
    case 'completado':
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'pending':
    case 'pendiente':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'failed':
    case 'fallido':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'refunded':
    case 'reembolsado':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
};

// Función para obtener el color del estado de envío - NUEVA
const getShippingStatusColor = (shippingStatus: string) => {
  switch (shippingStatus.toLowerCase()) {
    case 'sin procesar':
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    case 'preparando':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'listo para envío':
      return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30';
    case 'en tránsito':
      return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    case 'en distribución':
      return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    case 'fuera para entrega':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'entregado':
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'cancelado':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
};

// Función para formatear fechas
const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return 'Fecha inválida';
  }
};

// Función para mostrar modal de confirmación - CORREGIDA
const showConfirmation = (setConfirmationModal: React.Dispatch<React.SetStateAction<any>>, options: {
  type: string;
  title: string;
  message: string;
  confirmText: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  variant?: 'default' | 'destructive';
}) => {
  setConfirmationModal({
    open: true,
    type: options.type,
    title: options.title,
    message: options.message,
    confirmText: options.confirmText,
    cancelText: options.cancelText || 'Cancelar',
    onConfirm: options.onConfirm,
    onCancel: options.onCancel || (() => setConfirmationModal((prev: any) => ({ ...prev, open: false }))), // AGREGADO PARÉNTESIS FALTANTE
    variant: options.variant || 'default'
  });
};


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
  const [profileSection, setProfileSection] = useState<'info' | 'addresses'>('info');

  // Estados para modales de confirmación
  const [confirmationModal, setConfirmationModal] = useState({
    open: false,
    type: '', // 'delete-account', 'cancel-edit', 'remove-favorite', 'add-to-cart'
    title: '',
    message: '',
    confirmText: '',
    cancelText: '',
    onConfirm: () => {},
    onCancel: () => {},
    variant: 'default' as 'default' | 'destructive'
  });

  // Estado para guardar datos originales
  const [originalProfileData, setOriginalProfileData] = useState({
    full_name: "",
    phone: "",
  });

  // Estados de carga para acciones específicas
  const [actionLoading, setActionLoading] = useState({
    updateProfile: false,
    deleteAccount: false,
    removeFavorite: '',
    addToCart: ''
  });
  
  // Estado mejorado para paginación
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalOrders: 0,
    totalPages: 0,
    ordersPerPage: 10,
    hasNext: false,
    hasPrevious: false
  });
  
  // Estado simplificado sin dirección
  const [profileData, setProfileData] = useState({
    full_name: "Usuario",
    email: "usuario@example.com",
    identification: "",
    phone: "",
    auth_id: ""
  });

  // Mapa de categorías para nombres legibles
  const [categoriesMap, setCategoriesMap] = useState<Record<string, string>>({});

  // Estados para el carrito
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Agregar estados para el modal de tracking
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [selectedOrderForTracking, setSelectedOrderForTracking] = useState<string | null>(null);

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
      
      // Solo obtener datos que existen en la tabla actualizada
      const { data: dbUser, error: dbError } = await supabase
        .from("users")
        .select("full_name, identification, phone")
        .eq("auth_id", user.id)
        .maybeSingle();
        
      if (dbError) {
        console.error("Error obteniendo datos de users:", dbError);
      }
      
      // Actualizar profileData sin dirección
      setProfileData({
        full_name: dbUser?.full_name || user.user_metadata?.full_name || "Usuario",
        email: user.email || "usuario@example.com", 
        identification: dbUser?.identification || user.user_metadata?.identification || "",
        phone: dbUser?.phone || user.user_metadata?.phone || "",
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

  // Función para actualizar el perfil
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificar si hay cambios
    const hasChanges = 
      profileData.full_name.trim() !== originalProfileData.full_name ||
      profileData.phone.trim() !== originalProfileData.phone;

    if (!hasChanges) {
      toast({
        title: "Sin cambios",
        description: "No se detectaron cambios en la información",
        variant: "default"
      });
      setIsEditing(false);
      return;
    }

    // Validaciones
    if (!profileData.full_name.trim()) {
      toast({ 
        title: "Error de validación", 
        description: "El nombre completo es obligatorio", 
        variant: "destructive" 
      });
      return;
    }
    
    if (!profileData.phone.trim() || !/^\d{10}$/.test(profileData.phone)) {
      toast({ 
        title: "Error de validación", 
        description: "El teléfono debe tener exactamente 10 dígitos", 
        variant: "destructive" 
      });
      return;
    }

    // Mostrar confirmación con resumen de cambios
    const changes = [];
    if (profileData.full_name.trim() !== originalProfileData.full_name) {
      changes.push(`• Nombre: "${originalProfileData.full_name}" → "${profileData.full_name.trim()}"`);
    }
    if (profileData.phone.trim() !== originalProfileData.phone) {
      changes.push(`• Teléfono: "${originalProfileData.phone}" → "${profileData.phone.trim()}"`);
    }

    showConfirmationModal({
      type: 'update-profile',
      title: '¿Confirmar cambios?',
      message: `Se actualizará la siguiente información:\n\n${changes.join('\n')}\n\nEsta acción guardará los cambios de forma permanente.`,
      confirmText: 'Guardar cambios',
      cancelText: 'Revisar',
      variant: 'default',
      onConfirm: async () => {
        setActionLoading(prev => ({ ...prev, updateProfile: true }));
        try {
          const { error } = await supabase
            .from("users")
            .update({
              full_name: profileData.full_name.trim(),
              phone: profileData.phone.trim(),
              updated_at: new Date().toISOString()
            })
            .eq("email", profileData.email);
            
          if (error) throw error;
          
          // Actualizar datos originales
          setOriginalProfileData({
            full_name: profileData.full_name.trim(),
            phone: profileData.phone.trim()
          });

          toast({ 
            title: "✅ Perfil actualizado", 
            description: "Los cambios se han guardado correctamente",
            variant: "default"
          });
          setIsEditing(false);
          setConfirmationModal(prev => ({ ...prev, open: false }));
        } catch (error) {
          console.error("Error actualizando perfil:", error);
          toast({ 
            title: "❌ Error al actualizar", 
            description: "No se pudieron guardar los cambios. Intenta nuevamente.", 
            variant: "destructive" 
          });
        } finally {
          setActionLoading(prev => ({ ...prev, updateProfile: false }));
        }
      }
    });
  };

  // Función mejorada para cancelar edición
  const handleCancelEdit = () => {
    const hasUnsavedChanges = 
      profileData.full_name.trim() !== originalProfileData.full_name ||
      profileData.phone.trim() !== originalProfileData.phone;

    if (hasUnsavedChanges) {
      showConfirmationModal({
        type: 'cancel-edit',
        title: '¿Descartar cambios?',
        message: 'Tienes cambios sin guardar. Si continúas, se perderán todos los cambios realizados.',
        confirmText: 'Sí, descartar',
        cancelText: 'Continuar editando',
        variant: 'destructive',
        onConfirm: () => {
          // Restaurar datos originales
          setProfileData(prev => ({
            ...prev,
            full_name: originalProfileData.full_name,
            phone: originalProfileData.phone
          }));
          setIsEditing(false);
          setConfirmationModal(prev => ({ ...prev, open: false }));
          toast({
            title: "Edición cancelada",
            description: "Se han descartado los cambios",
            variant: "default"
          });
        }
      });
    } else {
      setIsEditing(false);
    }
  };

  // Función mejorada para iniciar edición
  const handleStartEdit = () => {
    // Guardar estado actual como backup
    setOriginalProfileData({
      full_name: profileData.full_name,
      phone: profileData.phone
    });
    setIsEditing(true);
    
    toast({
      title: "Modo de edición activado",
      description: "Puedes modificar tu información. Recuerda guardar los cambios.",
      variant: "default"
    });
  };

  // Eliminación lógica usando Edge Function
  const handleDeleteAccount = async () => {
    showConfirmationModal({
      type: 'delete-account',
      title: '⚠️ ELIMINAR CUENTA PERMANENTEMENTE',
      message: `Esta acción es IRREVERSIBLE y eliminará permanentemente:

• Toda tu información personal
• Historial de pedidos y compras  
• Lista de productos favoritos
• Todas las direcciones guardadas
• Acceso completo a la plataforma

Una vez confirmado, NO podrás recuperar tu cuenta ni volver a usar este correo electrónico.

¿Estás completamente seguro de que deseas continuar?`,
      confirmText: 'SÍ, ELIMINAR MI CUENTA',
      cancelText: 'No, mantener mi cuenta',
      variant: 'destructive',
      onConfirm: async () => {
        setActionLoading(prev => ({ ...prev, deleteAccount: true }));
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
            title: "✅ Cuenta eliminada",
            description: "Tu cuenta ha sido eliminada permanentemente. Recibirás un correo de confirmación.",
            variant: "destructive"
          });
          navigate('/');
        } catch (error: any) {
          toast({
            title: "❌ Error al eliminar cuenta",
            description: error?.message || "No se pudo eliminar la cuenta. Intenta nuevamente.",
            variant: "destructive"
          });
        } finally {
          setActionLoading(prev => ({ ...prev, deleteAccount: false }));
          setConfirmationModal(prev => ({ ...prev, open: false }));
        }
      }
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

  // Función para mostrar modal de confirmación
  const showConfirmationModal = (options: {
    type: string;
    title: string;
    message: string;
    confirmText: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel?: () => void;
    variant?: 'default' | 'destructive';
  }) => {
    showConfirmation(setConfirmationModal, options);
  };

  // Función mejorada para eliminar favorito con confirmación toast
  const handleRemoveFavorite = async (product: FavoriteProduct) => {
    showConfirmationModal({
      type: 'remove-favorite',
      title: '¿Eliminar de favoritos?',
      message: `¿Estás seguro de que deseas eliminar "${product.name}" de tu lista de favoritos?`,
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
      variant: 'destructive',
      onConfirm: async () => {
        setActionLoading(prev => ({ ...prev, removeFavorite: product.id.toString() }));
        try {
          const success = await removeFavorite(product.id);
          if (success) {
            setFavorites(prev => prev.filter(fav => fav.id !== product.id));
            toast({
              title: "✅ Eliminado de favoritos",
              description: `"${product.name}" ha sido removido de tus favoritos.`,
              variant: "default"
            });
          } else {
            throw new Error("No se pudo eliminar el producto");
          }
        } catch (error) {
          console.error("Error removing favorite:", error);
          toast({
            title: "❌ Error",
            description: "No se pudo eliminar de favoritos. Intenta nuevamente.",
            variant: "destructive"
          });
        } finally {
          setActionLoading(prev => ({ ...prev, removeFavorite: '' }));
          setConfirmationModal(prev => ({ ...prev, open: false }));
        }
      }
    });
  };

  // Función mejorada para agregar al carrito con confirmación toast
  const handleAddToCart = (product: FavoriteProduct) => {
    showConfirmationModal({
      type: 'add-to-cart',
      title: 'Agregar al carrito',
      message: `¿Deseas agregar "${product.name}" al carrito por $${product.price.toLocaleString()}?`,
      confirmText: 'Sí, agregar',
      cancelText: 'Cancelar',
      variant: 'default',
      onConfirm: async () => {
        setActionLoading(prev => ({ ...prev, addToCart: product.id.toString() }));
        
        // Simular acción de agregar al carrito
        setTimeout(() => {
          toast({
            title: "✅ Agregado al carrito",
            description: `"${product.name}" ha sido agregado al carrito`,
            variant: "default"
          });
          setActionLoading(prev => ({ ...prev, addToCart: '' }));
          setConfirmationModal(prev => ({ ...prev, open: false }));
        }, 1000);
      }
    });
  };

  // Funciones para manejar el carrito
  const handleCartClick = () => {
    setIsCartOpen(true);
  };

  const handleCloseCart = () => {
    setIsCartOpen(false);
  };

  const handleUpdateQuantity = (id: number, quantity: number, selectedSize?: string) => {
    // Implementar lógica de actualización si es necesaria
    console.log("Update quantity:", id, quantity, selectedSize);
  };

  const handleRemoveItem = (id: number, selectedSize?: string) => {
    // Implementar lógica de eliminación si es necesaria
    console.log("Remove item:", id, selectedSize);
  };

  // Función para abrir modal de tracking
  const handleOpenTracking = (orderId: string) => {
    setSelectedOrderForTracking(orderId);
    setTrackingModalOpen(true);
  };

  // Función para cerrar modal de tracking
  const handleCloseTracking = () => {
    setTrackingModalOpen(false);
    setSelectedOrderForTracking(null);
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
        cartItems={cartItems.length}
        onCartClick={handleCartClick} // Ahora funciona correctamente
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
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white text-2xl">
                      {profileSection === 'info' ? 'Información Personal' : 'Mis Direcciones'}
                    </CardTitle>
                    <CardDescription className="text-white/70">
                      {profileSection === 'info' 
                        ? 'Gestiona tus datos de perfil y contacto' 
                        : 'Administra tus direcciones de envío'
                      }
                    </CardDescription>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant={profileSection === 'info' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setProfileSection('info')}
                    >
                      <User className="h-4 w-4 mr-2" />
                      Información
                    </Button>
                    <Button
                      variant={profileSection === 'addresses' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setProfileSection('addresses')}
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      Direcciones
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {profileSection === 'info' ? (
                  <div className="space-y-7">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Nombre completo */}
                      <div className="space-y-2">
                        <Label className="text-white font-medium flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Nombre completo *
                        </Label>
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
                            className={`bg-white/10 border-white/30 text-white placeholder:text-white/50 focus:border-primary ${
                              !profileData.full_name.trim() ? "border-red-500" : ""
                            }`}
                          />
                        ) : (
                          <div className="flex items-center gap-2 p-3 rounded-lg bg-white/5 border border-white/10">
                            <span className="text-white">{profileData.full_name}</span>
                          </div>
                        )}
                      </div>

                      {/* Cédula */}
                      <div className="space-y-2">
                        <Label className="text-white font-medium flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          Número de identificación
                        </Label>
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-white/5 border border-white/10">
                          <span className="text-white">
                            {profileData.identification || "No especificado"}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            Solo lectura
                          </Badge>
                        </div>
                      </div>

                      {/* Email */}
                      <div className="space-y-2">
                        <Label className="text-white font-medium flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Correo electrónico
                        </Label>
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-white/5 border border-white/10">
                          <span className="text-white">{profileData.email}</span>
                          <Badge variant="secondary" className="text-xs">
                            Verificado
                          </Badge>
                        </div>
                      </div>

                      {/* Teléfono */}
                      <div className="space-y-2">
                        <Label className="text-white font-medium flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          Teléfono de contacto * (10 dígitos)
                        </Label>
                        {isEditing ? (
                          <div className="space-y-2">
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
                              placeholder="Ej: 3001234567"
                              className={`bg-white/10 border-white/30 text-white placeholder:text-white/50 focus:border-primary ${
                                !profileData.phone.trim() || !/^\d{10}$/.test(profileData.phone)
                                  ? "border-red-500"
                                  : ""
                              }`}
                            />
                            {profileData.phone && !/^\d{10}$/.test(profileData.phone) && (
                              <p className="text-sm text-red-400 flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                El teléfono debe tener exactamente 10 números
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 p-3 rounded-lg bg-white/5 border border-white/10">
                            <span className="text-white">
                              {profileData.phone ? 
                                `+57 ${profileData.phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3')}` : 
                                "No especificado"
                              }
                            </span>
                            {!profileData.phone && (
                              <Badge variant="destructive" className="text-xs">
                                Requerido
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Información adicional MEJORADA */}
                    {!isEditing && (
                      <div className="bg-white/5 rounded-lg border border-white/10 p-4 md:p-6">
                        <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Información de envío
                        </h4>
                        <p className="text-white/70 text-sm mb-6">
                          Tus direcciones de envío se gestionan por separado en la sección "Direcciones". 
                          Esto te permite tener múltiples direcciones y seleccionar la adecuada para cada pedido.
                        </p>
                        
                        {/* Botones mejorados y completamente responsivos */}
                        <div className="address-buttons-container">
                          <Button
                            variant="outline"
                            onClick={() => setProfileSection('addresses')}
                            className="address-button text-white border-white/30 hover:bg-white/10 transition-all duration-300"
                          >
                            <MapPin className="h-4 w-4 flex-shrink-0" />
                            <span className="text-adaptive-long">Gestionar Direcciones</span>
                            <span className="text-adaptive-short">Direcciones</span>
                          </Button>
                          
                          <Button
                            variant="ghost"
                            onClick={handleCartClick}
                            className="address-button text-white hover:bg-white/10 transition-all duration-300"
                          >
                            <ShoppingBag className="h-4 w-4 flex-shrink-0" />
                            <span className="text-adaptive-long">Ver Carrito</span>
                            <span className="text-adaptive-short">Carrito</span>
                            {cartItems.length > 0 && (
                              <Badge variant="secondary" className="ml-1 text-xs flex-shrink-0">
                                {cartItems.length}
                              </Badge>
                            )}
                          </Button>
                        </div>

                        {/* Información adicional responsive */}
                        <div className="mt-6 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                          <p className="text-blue-200 text-sm">
                            <span className="text-adaptive-long">💡 <strong>Consejo:</strong> Configura múltiples direcciones para envíos más rápidos y convenientes</span>
                            <span className="text-adaptive-short">💡 <strong>Tip:</strong> Agrega varias direcciones para envíos rápidos</span>
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Botones de acción actualizados */}
                    <div className="profile-action-buttons pt-6 border-t border-white/20">
                      {isEditing ? (
                        <>
                          <Button 
                            onClick={handleUpdateProfile} 
                            variant="hero"
                            disabled={actionLoading.updateProfile}
                            className="button-responsive flex items-center gap-2"
                          >
                            {actionLoading.updateProfile ? (
                              <>
                                <Loader className="h-4 w-4 animate-spin" />
                                <span className="hidden sm:inline">Guardando...</span>
                                <span className="sm:hidden">Guardando</span>
                              </>
                            ) : (
                              <>
                                <Check className="h-4 w-4" />
                                <span className="hidden sm:inline">Guardar Cambios</span>
                                <span className="sm:hidden">Guardar</span>
                              </>
                            )}
                          </Button>
                          <Button 
                            onClick={handleCancelEdit} 
                            variant="outline"
                            disabled={actionLoading.updateProfile}
                            className="button-responsive text-white border-white/30 hover:bg-white/10"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cancelar
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            onClick={handleStartEdit}
                            variant="outline"
                            className="button-responsive flex items-center gap-2 text-white border-white/30 hover:bg-white/10"
                          >
                            <Edit className="h-4 w-4" />
                            <span className="hidden sm:inline">Editar Información</span>
                            <span className="sm:hidden">Editar</span>
                          </Button>
                          <Button
                            onClick={handleDeleteAccount}
                            variant="destructive"
                            disabled={actionLoading.deleteAccount}
                            className="button-responsive flex items-center gap-2"
                          >
                            {actionLoading.deleteAccount ? (
                              <>
                                <Loader className="h-4 w-4 animate-spin" />
                                <span className="hidden sm:inline">Eliminando...</span>
                                <span className="sm:hidden">Eliminando</span>
                              </>
                            ) : (
                              <>
                                <Trash2 className="h-4 w-4" />
                                <span className="hidden sm:inline">Eliminar Cuenta</span>
                                <span className="sm:hidden">Eliminar</span>
                              </>
                            )}
                          </Button>
                        </>
                      )}
                    </div>

                    {/* Información de seguridad */}
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                      <h4 className="text-blue-400 font-medium mb-2 flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Seguridad de la cuenta
                      </h4>
                      <p className="text-blue-100/70 text-sm mb-3">
                        Tu información está protegida. El número de identificación no puede modificarse 
                        por seguridad. Para cambios de correo, contacta soporte.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="text-blue-400 border-blue-400/50">
                          <Check className="h-3 w-3 mr-1" />
                          Email verificado
                        </Badge>
                        <Badge variant="outline" className="text-blue-400 border-blue-400/50">
                          <Shield className="h-3 w-3 mr-1" />
                          Datos seguros
                        </Badge>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Gestión de direcciones (sin cambios)
                  <AddressManager mode="manage" />
                )}
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
                      onClick={() => navigate('/productos')}
                      variant="hero"
                    >
                      Explorar Productos
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => {
                      return (
                        <Card key={order.id} className="bg-white/10 border-white/20">
                          <CardContent className="p-4">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                              <div className="flex-1 space-y-3">
                                {/* Fila 1: ID del pedido y badges de estado - ACTUALIZADO */}
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-white font-medium">
                                    Pedido #{order.id.slice(-8)}
                                  </span>
                                  <Badge className={`text-white ${getStatusColor(order.status)}`}>
                                    {order.status}
                                  </Badge>
                                  <Badge className={`text-white ${getPaymentStatusColor(order.payment_status)}`}>
                                    💳 {order.payment_status}
                                  </Badge>
                                  {/* 🔥 AGREGAR BADGE DE SHIPPING STATUS */}
                                  {order.shipping_status && (
                                    <Badge className={`text-white ${getShippingStatusColor(order.shipping_status)} border-dashed`}>
                                      🚚 {order.shipping_status}
                                    </Badge>
                                  )}
                                </div>
                                
                                {/* Fila 2: Información del pedido */}
                                <div className="flex items-center gap-4 text-sm text-white/70 flex-wrap">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    {formatDate(order.created_at)}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <CreditCard className="h-4 w-4" />
                                    {order.payment_method}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Package className="h-4 w-4" />
                                    {order.items.length} artículo{order.items.length !== 1 ? 's' : ''}
                                  </div>
                                </div>
                                
                                {/* Fila 3: Preview de productos con tallas */}
                                <div className="flex items-center gap-2 text-xs text-white/60">
                                  {order.items.slice(0, 2).map((item, index) => (
                                    <div key={index} className="flex items-center gap-1">
                                      <span className="truncate max-w-32">{item.name}</span>
                                      {item.size && (
                                        <Badge variant="outline" className="text-xs px-1 py-0 border-white/20 text-white/50">
                                          {item.size}
                                        </Badge>
                                      )}
                                      {index < Math.min(order.items.length, 2) - 1 && (
                                        <span className="text-white/30">•</span>
                                      )}
                                    </div>
                                  ))}
                                  {order.items.length > 2 && (
                                    <span className="text-white/40">
                                      +{order.items.length - 2} más
                                    </span>
                                  )}
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
                                
                                {/* Botones de acción - SIMPLIFICADO */}
                                <div className="flex gap-2">
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
                                  
                                  {/* Botón de seguimiento - Solo si el pago está completado */}
                                  {!['pending', 'pendiente', 'failed', 'fallido'].includes(order.payment_status.toLowerCase()) && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleOpenTracking(order.id)}
                                      className="flex items-center gap-1 text-blue-400 border-blue-400/30 hover:bg-blue-400/10"
                                    >
                                      <Truck className="h-4 w-4" />
                                      <span className="hidden sm:inline">Seguimiento</span>
                                      <span className="sm:hidden">Track</span>
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}

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

                              {/* Botón mejorado para eliminar de favoritos */}
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={actionLoading.removeFavorite === product.id.toString()}
                                className="absolute top-3 right-3 rounded-full bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white disabled:opacity-50 transition-all duration-300"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleRemoveFavorite(product);
                                }}
                                title="Eliminar de favoritos"
                              >
                                {actionLoading.removeFavorite === product.id.toString() ? (
                                  <Loader className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Heart className="h-4 w-4 fill-current" />
                                )}
                              </Button>
                            </div>

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

                              {/* Botón mejorado para agregar al carrito */}
                              <Button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleAddToCart(product);
                                }}
                                disabled={actionLoading.addToCart === product.id.toString()}
                                className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white transition-all duration-300 hover:scale-105 disabled:opacity-50"
                                size="sm"
                              >
                                {actionLoading.addToCart === product.id.toString() ? (
                                  <>
                                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                                    Agregando...
                                  </>
                                ) : (
                                  <>
                                    <ShoppingBag className="h-4 w-4 mr-2" />
                                    Agregar al Carrito
                                  </>
                                )}
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

        {/* Modal de detalles del pedido - ACTUALIZADO */}
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
                {/* Estado y información general - ACTUALIZADO CON SHIPPING STATUS */}
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
                  {/* 🔥 AGREGAR SHIPPING STATUS EN MODAL */}
                  {selectedOrder.shipping_status && (
                    <div className="space-y-2">
                      <Label className="text-white/70 flex items-center gap-1">
                        <Truck className="h-4 w-4" />
                        Estado del Envío
                      </Label>
                      <Badge className={`text-white ${getShippingStatusColor(selectedOrder.shipping_status)}`}>
                        {selectedOrder.shipping_status}
                      </Badge>
                    </div>
                  )}
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

                {/* Productos del pedido - MEJORADO CON TALLAS */}
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
                            <div className="flex-1 space-y-3">
                              <h4 className="text-white font-medium">{item.name}</h4>
                              
                              {/* Información de cantidad y talla - MEJORADO */}
                              <div className="flex flex-wrap items-center gap-3">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs border-green-400/50 text-green-300">
                                    <Package className="h-3 w-3 mr-1" />
                                    Cantidad: {item.quantity}
                                  </Badge>
                                </div>
                                
                                {item.size && item.size.trim() && item.size !== 'undefined' && (
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs border-blue-400/50 text-blue-300">
                                      <span className="mr-1">👕</span>
                                      Talla: {item.size.trim()}
                                    </Badge>
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <div className="text-white/70 text-sm">
                                  <span className="font-medium">Precio unitario:</span> ${item.price.toLocaleString()}
                                </div>
                              </div>
                            </div>
                            <div className="text-right space-y-1">
                              <div className="text-white font-bold text-lg">
                                ${(item.price * item.quantity).toLocaleString()}
                              </div>
                              <div className="text-white/50 text-xs">
                                {item.quantity} × ${item.price.toLocaleString()}
                              </div>
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

                {/* Botón de seguimiento en el modal - SIMPLIFICADO */}
                {!['pending', 'pendiente', 'failed', 'fallido'].includes(selectedOrder.payment_status.toLowerCase()) && (
                  <div className="flex justify-center pt-4 border-t border-white/20">
                    <Button
                      onClick={() => {
                        setOrderModalOpen(false);
                        handleOpenTracking(selectedOrder.id);
                      }}
                      variant="outline"
                      className="flex items-center gap-2 text-blue-400 border-blue-400/30 hover:bg-blue-400/10"
                    >
                      <Truck className="h-4 w-4" />
                      Ver Seguimiento del Pedido
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal de Confirmación NUEVO */}
        <Dialog open={confirmationModal.open} onOpenChange={(open) => setConfirmationModal(prev => ({ ...prev, open }))}>
          <DialogContent className="max-w-md bg-card/95 backdrop-blur-md border border-white/20">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                {confirmationModal.variant === 'destructive' ? (
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-blue-500" />
                )}
                {confirmationModal.title}
              </DialogTitle>
              <DialogDescription className="text-white/70 whitespace-pre-line text-sm leading-relaxed">
                {confirmationModal.message}
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex flex-col gap-3 mt-6">
              <Button
                onClick={confirmationModal.onConfirm}
                variant={confirmationModal.variant === 'destructive' ? 'destructive' : 'hero'}
                className="w-full"
              >
                {confirmationModal.confirmText}
              </Button>
              <Button
                onClick={confirmationModal.onCancel}
                variant="outline"
                className="w-full text-white border-white/30 hover:bg-white/10"
              >
                {confirmationModal.cancelText}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de seguimiento - NUEVO */}
        <TrackingModal
          isOpen={trackingModalOpen}
          onClose={handleCloseTracking}
          orderId={selectedOrderForTracking || ''}
        />

        {/* Componente Cart */}
        <Cart
          isOpen={isCartOpen}
          onClose={handleCloseCart}
          items={cartItems}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
        />
      </main>
    </div>
  );
};

export default Profile;