import React, { useState, useEffect, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus, Minus, ShoppingCart, Trash2, Edit, ChevronLeft, Check, AlertCircle, MapPin, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import AddressManager from "./AddressManager";

// Edge Functions URLs
const EDGE_ADD_TO_CART = "https://xrflzmovtmlfrjhtoejs.supabase.co/functions/v1/add-to-cart";
const EDGE_REMOVE_FROM_CART = "https://xrflzmovtmlfrjhtoejs.supabase.co/functions/v1/remove-from-cart";
const EDGE_GET_CART_ITEMS = "https://xrflzmovtmlfrjhtoejs.supabase.co/functions/v1/get-cart-items";
const EDGE_CREATE_ORDER = "https://xrflzmovtmlfrjhtoejs.supabase.co/functions/v1/create-paypal-order";
const EDGE_CREATE_CHECKOUT = "https://xrflzmovtmlfrjhtoejs.supabase.co/functions/v1/create-paypal-session";
const EDGE_CLEAR_CART = "https://xrflzmovtmlfrjhtoejs.supabase.co/functions/v1/clear-cart";
const EDGE_CHANGE_SIZE = "https://xrflzmovtmlfrjhtoejs.supabase.co/functions/v1/change-cart-size";

interface CartItem {
  cartItemId: string;
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
  quantity: number;
  selectedSize?: string;
  variantId?: number;
}

interface AvailableSize {
  id: number;
  name: string;
  stock: number;
  variant: any;
}

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  items?: CartItem[];
  onUpdateQuantity: (id: number, quantity: number, selectedSize?: string) => void;
  onRemoveItem: (id: number, selectedSize?: string) => void;
  onChangeSizeInCart?: (id: number, oldSize: string, newSize: string) => void;
  availableSizes?: AvailableSize[];
}

type AddressType = 'home' | 'work' | 'other' | 'parents' | 'friend' | 'office' | 'warehouse';

interface Address {
  id: string;
  address_type: AddressType;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

const Cart = ({
  isOpen,
  onClose,
  items: itemsProp = [],
  onUpdateQuantity,
  onRemoveItem,
  onChangeSizeInCart,
  availableSizes = [],
}: CartProps) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [editingSizeFor, setEditingSizeFor] = useState<string | null>(null);
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null);
  const [items, setItems] = useState<CartItem[]>([]);
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [loadingClearCart, setLoadingClearCart] = useState(false);
  const [categoriesMap, setCategoriesMap] = useState<Record<string, string>>({});
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'address' | 'payment'>('cart');
  
  // Estados para tallas disponibles por producto
  const [productSizes, setProductSizes] = useState<Record<number, AvailableSize[]>>({});
  const [loadingSizes, setLoadingSizes] = useState<Record<string, boolean>>({});
  
  // Usar useRef para evitar dependencias circulares
  const productSizesRef = useRef<Record<number, AvailableSize[]>>({});
  
  const { toast } = useToast();

  const SHIPPING_THRESHOLD = 100000;
  const SHIPPING_COST = 15000;

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal < SHIPPING_THRESHOLD && subtotal > 0 ? SHIPPING_COST : 0;
  const total = subtotal + shipping;

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Mantener productSizesRef sincronizado
  useEffect(() => {
    productSizesRef.current = productSizes;
  }, [productSizes]);

  // Función para cargar tallas disponibles de un producto específico
  const fetchProductSizes = useCallback(async (productId: number): Promise<AvailableSize[]> => {
    try {
      if (productSizesRef.current[productId]) {
        return productSizesRef.current[productId];
      }

      console.log(`🔍 Cargando tallas para producto ID: ${productId}`);

      const { data, error } = await supabase
        .from('products_variants')
        .select(`
          id_variante,
          stock,
          sizes!fk_sizes (
            nombre_talla
          )
        `)
        .eq('id_producto', productId)
        .gt('stock', 0);

      if (error) {
        console.error(`❌ Error cargando tallas para producto ${productId}:`, error);
        return [];
      }

      const sizes = data?.map((variant: any) => ({
        id: variant.id_variante,
        name: (variant.sizes?.nombre_talla || '').replace(/[\r\n\t\s]+/g, ' ').trim(),
        stock: variant.stock,
        variant: variant
      })) || [];

      console.log(`✅ Tallas cargadas para producto ${productId}:`, sizes);

      setProductSizes(prev => ({
        ...prev,
        [productId]: sizes
      }));

      return sizes;
    } catch (error) {
      console.error(`❌ Error inesperado cargando tallas para producto ${productId}:`, error);
      return [];
    }
  }, []);

  // Centraliza la carga del carrito - CORREGIDO
  const fetchCartItems = useCallback(async () => {
    try {
      console.log('🛒 Cargando items del carrito...');

      const { data } = await supabase.auth.getSession();
      const access_token = data?.session?.access_token;
      
      if (!access_token) {
        console.log('❌ No hay token de acceso');
        setItems([]);
        return;
      }

      const response = await fetch(EDGE_GET_CART_ITEMS, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('📦 Respuesta del carrito:', result);

      if (result.ok && Array.isArray(result.cart_items)) {
        // Cargar tallas primero para todos los productos - TIPADO CORREGIDO
        const uniqueProductIds = [...new Set(
          result.cart_items
            .map((item: any) => {
              const productId = Number(item.id || item.product_id);
              return !isNaN(productId) ? productId : null;
            })
            .filter((id): id is number => id !== null) // <-- Type guard para filtrar nulls
        )];
        
        console.log('🔍 Productos únicos encontrados:', uniqueProductIds);

        // Cargar tallas para todos los productos primero - CORREGIDO
        await Promise.all(uniqueProductIds.map(async (productId: number) => {
          if (!productSizesRef.current[productId]) {
            await fetchProductSizes(productId);
          }
        }));

        const cartItems = result.cart_items.map((item: any) => {
          const productId = Number(item.id || item.product_id);
          const variantId = Number(item.variantId || item.variant_id);
          
          if (!productId || isNaN(productId)) {
            console.warn('⚠️ Item con product_id inválido:', item);
          }

          // Buscar la talla correcta basada en el variant_id
          let correctSize = item.selectedSize || item.size || '';
          
          if (variantId && !isNaN(variantId)) {
            const availableSizes = productSizesRef.current[productId] || [];
            const sizeVariant = availableSizes.find(size => size.id === variantId);
            if (sizeVariant) {
              correctSize = sizeVariant.name;
              console.log(`✅ Talla correcta encontrada para variant ${variantId}: ${correctSize}`);
            }
          }

          return {
            cartItemId: String(item.cartItemId || item.id || `${productId}-${variantId}`),
            id: productId,
            name: String(item.name || "Producto sin nombre"),
            price: Number(item.price || 0),
            image: String(item.image || ""),
            category: String(item.category || ""),
            quantity: Number(item.quantity || 1),
            selectedSize: correctSize.trim(),
            variantId: isNaN(variantId) ? undefined : variantId,
          };
        });

        console.log('✅ Items del carrito procesados:', cartItems);
        setItems(cartItems);

      } else {
        console.log('❌ Respuesta inválida o carrito vacío');
        setItems([]);
        if (result.error) {
          toast({
            title: "Error",
            description: result.error,
            variant: "destructive",
          });
        }
      }
    } catch (e: any) {
      console.error('❌ Error cargando carrito:', e);
      toast({
        title: "Error",
        description: e?.message || "No se pudo cargar el carrito",
        variant: "destructive",
      });
      setItems([]);
    }
  }, [toast, fetchProductSizes]);

  // Carga el carrito solo cuando el modal se abre
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      setCheckoutStep('cart');
      setSelectedAddress(null);
      fetchCartItems();
    } else {
      setEditingSizeFor(null); // <-- CIERRA EL SELECTOR AL CERRAR
    }
  }, [isOpen, fetchCartItems]);

  useEffect(() => {
    supabase
      .from('categories')
      .select('id, name')
      .then(({ data }) => {
        const map: Record<string, string> = {};
        (data || []).forEach(cat => { map[cat.id] = cat.name; });
        setCategoriesMap(map);
      });
  }, []);

  const handleClose = () => {
    setIsAnimating(false);
    setEditingSizeFor(null); // <-- CIERRA EL SELECTOR DE TALLAS AL CERRAR EL CART
    setTimeout(() => onClose(), 300);
  };

 // En el handleSizeChange, actualiza para evitar que se elimine el producto:
const handleSizeChange = async (item: CartItem, newSize: string) => {
  const itemKey = item.cartItemId;
  setLoadingSizes(prev => ({ ...prev, [itemKey]: true }));

  try {
    const cleanNewSize = newSize.replace(/\s+/g, ' ').trim();
    console.log(`🔄 Cambiando talla del item ${item.name} de "${item.selectedSize}" a "${cleanNewSize}"`);

    const { data } = await supabase.auth.getSession();
    const access_token = data?.session?.access_token;
    if (!access_token) throw new Error("Debes iniciar sesión.");

    if (!item.id || isNaN(item.id)) {
      throw new Error("ID de producto inválido");
    }

    // Encontrar la nueva variant_id
    const availableSizes = productSizes[item.id] || [];
    const newVariant = availableSizes.find(size => 
      size.name.replace(/\s+/g, ' ').trim() === cleanNewSize
    );

    if (!newVariant) {
      console.error(`❌ Talla "${cleanNewSize}" no encontrada para producto ${item.id}`);
      console.log('Tallas disponibles:', availableSizes.map(s => `"${s.name}"`));
      throw new Error("Talla no disponible");
    }

    console.log(`✅ Variant encontrado:`, newVariant);

    // Llamar al edge function para cambiar la talla
    const response = await fetch(EDGE_CHANGE_SIZE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${access_token}`,
      },
      body: JSON.stringify({
        product_id: item.id,
        old_variant_id: item.variantId,
        new_variant_id: newVariant.id,
        quantity: item.quantity,
        action: "change_size"
      }),
    });

    const result = await response.json();
    console.log('📡 Respuesta cambio de talla:', result);

    if (result.ok) {
      toast({
        title: "Talla actualizada",
        description: `Se cambió la talla de ${item.name} a ${cleanNewSize}`,
        variant: "default"
      });
      
      // Actualizar INMEDIATAMENTE el estado local para que se vea el cambio
      setItems(prevItems => 
        prevItems.map(prevItem => 
          prevItem.cartItemId === item.cartItemId 
            ? { 
                ...prevItem, 
                selectedSize: cleanNewSize, 
                variantId: newVariant.id 
              }
            : prevItem
        )
      );
      
      setEditingSizeFor(null);
      
      // Recargar en segundo plano para sincronizar
      setTimeout(() => {
        fetchCartItems();
      }, 500);
      
    } else {
      throw new Error(result.error || "No se pudo cambiar la talla");
    }
  } catch (error: any) {
    console.error('❌ Error cambiando talla:', error);
    toast({
      title: "Error al cambiar talla",
      description: error?.message || "No se pudo cambiar la talla",
      variant: "destructive",
    });
  } finally {
    setLoadingSizes(prev => ({ ...prev, [itemKey]: false }));
  }
};
  // Agregar al carrito (sumar cantidad)
  const handleAddQuantity = async (item: CartItem) => {
    setLoadingItemId(item.cartItemId);
    try {
      const { data } = await supabase.auth.getSession();
      const access_token = data?.session?.access_token;
      if (!access_token) throw new Error("Debes iniciar sesión.");

      // Validar product ID
      if (!item.id || isNaN(item.id)) {
        throw new Error("ID de producto inválido");
      }

      const response = await fetch(EDGE_ADD_TO_CART, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${access_token}`,
        },
        body: JSON.stringify({
          product_id: item.id,
          variant_id: item.variantId ?? null,
          quantity: 1,
        }),
      });
      const result = await response.json();
      if (result.ok) {
        toast({
          title: "Producto actualizado",
          description: `Se aumentó la cantidad de ${item.name} en el carrito.`,
        });
        await fetchCartItems();
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo actualizar el carrito",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "No se pudo actualizar el carrito",
        variant: "destructive",
      });
    }
    setLoadingItemId(null);
  };

  // Disminuir cantidad
  const handleSubtractQuantity = async (item: CartItem) => {
    if (item.quantity > 1) {
      setLoadingItemId(item.cartItemId);
      try {
        const { data } = await supabase.auth.getSession();
        const access_token = data?.session?.access_token;
        if (!access_token) throw new Error("Debes iniciar sesión.");

        // Validar product ID
        if (!item.id || isNaN(item.id)) {
          throw new Error("ID de producto inválido");
        }

        const response = await fetch(EDGE_REMOVE_FROM_CART, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${access_token}`,
          },
          body: JSON.stringify({
            product_id: item.id,
            variant_id: item.variantId || null,
            quantity: 1
          }),
        });

        const result = await response.json();

        if (result.ok) {
          toast({
            title: "Producto actualizado",
            description: `Se disminuyó la cantidad de ${item.name} en el carrito.`,
          });
          await fetchCartItems();
        } else {
          toast({
            title: "Error",
            description: result.error || "No se pudo actualizar el carrito",
            variant: "destructive",
          });
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error?.message || "No se pudo actualizar el carrito",
          variant: "destructive",
        });
      }
      setLoadingItemId(null);
    }
  };

  // Eliminar producto del carrito
  const handleRemoveFromCart = async (item: CartItem) => {
    setLoadingItemId(item.cartItemId);
    try {
      const { data } = await supabase.auth.getSession();
      const access_token = data?.session?.access_token;
      if (!access_token) throw new Error("Debes iniciar sesión.");

      // Validar product ID
      if (!item.id || isNaN(item.id)) {
        throw new Error("ID de producto inválido");
      }

      const response = await fetch(EDGE_REMOVE_FROM_CART, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${access_token}`,
        },
        body: JSON.stringify({
          product_id: item.id,
          variant_id: item.variantId ?? null,
        }),
      });
      const result = await response.json();
      if (result.ok) {
        toast({
          title: "Producto eliminado",
          description: `El producto ${item.name} fue eliminado del carrito.`,
        });
        await fetchCartItems();
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo eliminar del carrito",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "No se pudo eliminar del carrito",
        variant: "destructive",
      });
    }
    setLoadingItemId(null);
  };

  // Limpiar todo el carrito
  const handleClearCart = async () => {
    setLoadingClearCart(true);
    try {
      const { data } = await supabase.auth.getSession();
      const access_token = data?.session?.access_token;
      if (!access_token) throw new Error("Debes iniciar sesión.");

      const response = await fetch(EDGE_CLEAR_CART, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${access_token}`,
        },
      });
      const result = await response.json();
      if (result.ok) {
        toast({
          title: "Carrito limpiado",
          description: result.message || "Todos los productos fueron eliminados del carrito.",
        });
        setItems([]);
      } else {
        toast({
          title: "Error al limpiar el carrito",
          description: result.error || "No se pudo limpiar el carrito.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "No se pudo limpiar el carrito.",
        variant: "destructive",
      });
    }
    setLoadingClearCart(false);
  };

  // ----- INTEGRACIÓN PEDIDO + PASARELA DE PAGOS -----
  const handleProceedToAddress = () => {
    if (items.length === 0) {
      toast({
        title: "Carrito vacío",
        description: "Agrega productos antes de proceder al pago",
        variant: "destructive"
      });
      return;
    }
    setCheckoutStep('address');
  };

  const handleAddressSelect = (address: Address) => {
    setSelectedAddress(address);
  };

  const handleProceedToPayment = () => {
    if (!selectedAddress) {
      toast({
        title: "Dirección requerida",
        description: "Selecciona una dirección de envío",
        variant: "destructive"
      });
      return;
    }
    setCheckoutStep('payment');
  };

  // Actualizar handleCheckout para incluir la dirección
  const handleCheckout = async () => {
    if (!selectedAddress) {
      toast({
        title: "Dirección requerida",
        description: "Selecciona una dirección de envío",
        variant: "destructive"
      });
      return;
    }

    setLoadingCheckout(true);
    try {
      const { data } = await supabase.auth.getSession();
      const access_token = data?.session?.access_token;
      const user_email = data?.session?.user?.email;
      if (!user_email || !access_token) throw new Error("Debes iniciar sesión para pagar.");

      // Validar que todos los items tengan IDs válidos
      const invalidItems = items.filter(item => !item.id || isNaN(item.id));
      if (invalidItems.length > 0) {
        console.error('❌ Items con IDs inválidos:', invalidItems);
        throw new Error("Hay productos con datos inválidos en el carrito");
      }

      // Formatear dirección completa
      const fullAddress = [
        selectedAddress.address_line_1,
        selectedAddress.address_line_2,
        `${selectedAddress.city}, ${selectedAddress.state} ${selectedAddress.postal_code}`,
        selectedAddress.country
      ].filter(Boolean).join(', ');

      // 1. Crear la orden en el backend (verificar stock)
      const orderPayload = {
        items: items.map((item) => ({
          product_id: item.id,
          variant_id: item.variantId ?? null,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image_url: item.image,
          talla: item.selectedSize ?? null,
        })),
        address: fullAddress,
        phone: null,
        payment_method: "paypal",
        shipping,
      };

      const payload = {
        items: items.map((item) => ({
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        email: user_email,
        shipping,
        address_id: selectedAddress.id
      };

      console.log('🚀 Enviando orden:', orderPayload);

      const orderResponse = await fetch(EDGE_CREATE_ORDER, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${access_token}`,
        },
        body: JSON.stringify(orderPayload),
      });

      const orderResult = await orderResponse.json();
      console.log('📦 Respuesta orden:', orderResult);

      if (!orderResult.ok) {
        toast({
          title: "Stock insuficiente",
          description: orderResult.error || "Algún producto no tiene stock suficiente.",
          variant: "destructive",
        });
        setLoadingCheckout(false);
        return;
      }

      console.log('💳 Creando sesión de pago...');
      const response = await fetch(EDGE_CREATE_CHECKOUT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${access_token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      console.log('💳 Respuesta pago:', result);

      if (result.ok && result.url) {
        toast({
          title: "Redirigiendo a PayPal...",
          description: "Serás dirigido a PayPal para completar tu pago.",
        });
        window.location.href = result.url;
      } else {
        toast({
          title: "Error en el pago",
          description: result.error || "No se pudo iniciar el pago.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('❌ Error en checkout:', error);
      toast({
        title: "Error",
        description: error?.message || "No se pudo iniciar el pago.",
        variant: "destructive",
      });
    }
    setLoadingCheckout(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex">
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          isAnimating ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
      />

      {/* Cart Panel */}
      <div
        className={`ml-auto w-full max-w-md h-full glass border-l border-white/20 flex flex-col transition-transform duration-300 z-[10000] ${
          isAnimating ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <div className="flex items-center gap-3">
            {checkoutStep === 'cart' && <ShoppingCart className="h-6 w-6 text-primary" />}
            {checkoutStep === 'address' && <MapPin className="h-6 w-6 text-primary" />}
            {checkoutStep === 'payment' && <CreditCard className="h-6 w-6 text-primary" />}
            
            <h2 className="text-xl font-bold">
              {checkoutStep === 'cart' && 'Carrito'}
              {checkoutStep === 'address' && 'Dirección de Envío'}
              {checkoutStep === 'payment' && 'Pago'}
            </h2>
            
            {checkoutStep === 'cart' && itemCount > 0 && (
              <Badge className="bg-primary text-primary-foreground">
                {itemCount}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {checkoutStep !== 'cart' && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (checkoutStep === 'payment') {
                    setCheckoutStep('address');
                  } else {
                    setCheckoutStep('cart');
                  }
                }}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Content based on step */}
        {checkoutStep === 'cart' && (
          <>
            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-6">
              {items.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Tu carrito está vacío</h3>
                  <p className="text-muted-foreground mb-6">
                    Agrega algunos productos increíbles a tu carrito
                  </p>
                  <Button variant="hero" onClick={handleClose}>
                    Continuar Comprando
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => {
                    const itemKey = item.cartItemId;
                    const isEditingSize = editingSizeFor === itemKey;
                    const isItemLoading = loadingItemId === item.cartItemId;
                    const isLoadingSize = loadingSizes[itemKey];
                    const availableSizes = productSizes[item.id] || [];

                    // LÓGICA MEJORADA para mostrar la talla correcta
                    let displaySize = '';
                    
                    if (item.selectedSize && item.selectedSize.trim() && item.selectedSize !== 'undefined') {
                      displaySize = item.selectedSize.trim();
                    } else if (item.variantId && availableSizes.length > 0) {
                      // Buscar la talla por variant_id
                      const sizeVariant = availableSizes.find(size => size.id === item.variantId);
                      displaySize = sizeVariant?.name.trim() || '';
                    } else if (availableSizes.length > 0) {
                      displaySize = availableSizes[0].name.trim();
                    }

                    return (
                      <div
                        key={item.cartItemId}
                        className="flex gap-4 p-4 bg-card rounded-xl border border-white/10 relative"
                        style={{ overflow: "visible", zIndex: isEditingSize ? 60 : 1 }} // <-- Dinámico z-index
                      >
                        <img
                          src={item.image || '/placeholder-product.jpg'}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-lg"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder-product.jpg';
                          }}
                        />

                        <div className="flex-1">
                          <h4 className="font-medium text-sm mb-1">{item.name}</h4>
                          <div className="flex gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">
                              {categoriesMap[item.category] || item.category || "Sin categoría"}
                            </Badge>
                            {/* Talla editable */}
                            <div className="flex items-center gap-1 relative">
                              <Badge variant="secondary" className="text-xs">
                                {isLoadingSize
                                  ? "Cambiando..."
                                  : displaySize
                                    ? `Talla: ${displaySize}`
                                    : "Sin talla"}
                              </Badge>
                              {availableSizes.length > 1 && !isEditingSize && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-4 w-4"
                                  onClick={() => {
                                    if (!productSizes[item.id]) {
                                      fetchProductSizes(item.id);
                                    }
                                    setEditingSizeFor(itemKey);
                                  }}
                                  title="Cambiar talla"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                              )}
                              {/* Selector de talla */}
                              {isEditingSize && (
                                <div
                                  className="absolute left-0 top-8 w-48 glass border border-primary/30 rounded-lg shadow-2xl p-3"
                                  style={{ zIndex: 10001 }}
                                >
                                  <div className="mb-2">
                                    <p className="text-xs text-muted-foreground mb-1">Selecciona nueva talla:</p>
                                  </div>
                                  <Select
                                    value={displaySize}
                                    onValueChange={(newSize) => handleSizeChange(item, newSize)}
                                    disabled={isLoadingSize}
                                  >
                                    <SelectTrigger className="h-8 w-full text-xs bg-background/80 border-primary/20 text-foreground">
                                      <SelectValue placeholder="Selecciona talla" />
                                    </SelectTrigger>
                                    <SelectContent 
                                      className="glass border-primary/30 bg-background/95 backdrop-blur-md"
                                      style={{ zIndex: 10002 }}
                                    >
                                      {availableSizes.map((size) => (
                                        <SelectItem
                                          key={size.id}
                                          value={size.name.trim()}
                                          disabled={size.stock === 0}
                                          className="text-foreground hover:bg-primary/20 focus:bg-primary/20"
                                        >
                                          {size.name.trim()} {size.stock === 0 ? '(Agotado)' : `(${size.stock} disponibles)`}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <div className="flex gap-2 mt-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="flex-1 h-7 text-xs border-primary/20 hover:bg-primary/10"
                                      onClick={() => setEditingSizeFor(null)}
                                    >
                                      Cancelar
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-primary font-bold">
                            ${(item.price * item.quantity).toLocaleString()}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveFromCart(item)}
                            className="h-6 w-6 text-destructive hover:text-destructive"
                            disabled={isItemLoading}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleSubtractQuantity(item)}
                              className="h-6 w-6"
                              disabled={item.quantity <= 1 || isItemLoading}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>

                            <span className="w-8 text-center text-sm font-medium">
                              {item.quantity}
                            </span>

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleAddQuantity(item)}
                              className="h-6 w-6"
                              disabled={isItemLoading}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-white/20 p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium">Subtotal:</span>
                  <span className="text-2xl font-bold gradient-text">
                    ${subtotal.toLocaleString("es-CO")}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium">Envío:</span>
                  <span className="text-2xl font-bold gradient-text">
                    {shipping > 0 ? `$${shipping.toLocaleString("es-CO")}` : "Gratis"}
                  </span>
                </div>
                <div className="flex justify-between items-center font-bold">
                  <span className="text-lg">Total:</span>
                  <span className="text-2xl gradient-text">
                    ${total.toLocaleString("es-CO")}
                  </span>
                </div>

                <div className="space-y-3">
                  <Button
                    variant="hero"
                    className="w-full"
                    size="lg"
                    onClick={handleProceedToAddress}
                    disabled={items.some(item => !item.id || isNaN(item.id))}
                  >
                    {items.some(item => !item.id || isNaN(item.id)) ? (
                      'Hay productos con datos inválidos'
                    ) : (
                      'Continuar con la Compra'
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={handleClearCart}
                    disabled={loadingClearCart || items.length === 0}
                  >
                    {loadingClearCart ? "Limpiando..." : "Limpiar Carrito"}
                  </Button>
                  <Button variant="ghost" className="w-full" onClick={handleClose}>
                    Continuar Comprando
                  </Button>
                </div>

                <div className="text-center text-xs text-muted-foreground">
                  Envío gratis en compras superiores a $100.000
                </div>
              </div>
            )}
          </>
        )}

        {/* Resto del componente se mantiene igual */}
        {checkoutStep === 'address' && (
          <div className="flex flex-col h-full">
            {/* ... resto del código para address step */}
            <div className="flex-1 p-6">
              <AddressManager
                mode="select"
                onAddressSelect={handleAddressSelect}
                selectedAddressId={selectedAddress?.id}
                compact={true}
              />
            </div>
            <div className="border-t border-white/20 p-6">
              <Button
                variant="hero"
                className="w-full"
                onClick={handleProceedToPayment}
                disabled={!selectedAddress}
              >
                Continuar al Pago
              </Button>
            </div>
          </div>
        )}

        {checkoutStep === 'payment' && (
          <div className="flex flex-col h-full">
            <div className="flex-1 p-6">
              <p>Resumen de compra...</p>
            </div>
            <div className="border-t border-white/20 p-6">
              <Button
                variant="hero"
                className="w-full"
                onClick={handleCheckout}
                disabled={loadingCheckout}
              >
                {loadingCheckout ? 'Procesando...' : `Pagar ${total.toLocaleString("es-CO")}`}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;