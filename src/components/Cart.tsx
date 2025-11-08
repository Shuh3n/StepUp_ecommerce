import React, { useState, useEffect, useCallback } from "react";
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
  const { toast } = useToast();

  const SHIPPING_THRESHOLD = 100000;
  const SHIPPING_COST = 15000;

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal < SHIPPING_THRESHOLD && subtotal > 0 ? SHIPPING_COST : 0;
  const total = subtotal + shipping;

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Centraliza la carga del carrito
  const fetchCartItems = useCallback(async () => {
    try {
      const { data } = await supabase.auth.getSession();
      const access_token = data?.session?.access_token;
      if (!access_token) {
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
      const result = await response.json();
      if (result.ok && Array.isArray(result.cart_items)) {
        setItems(
          result.cart_items.map((item: any) => ({
            cartItemId: item.cartItemId ?? item.id,
            id: item.id ?? item.product_id,
            name: item.name ?? "",
            price: item.price ?? 0,
            image: item.image ?? "",
            category: item.category ?? "",
            quantity: item.quantity,
            selectedSize: item.selectedSize ?? "",
            variantId: item.variantId ?? item.variant_id,
          }))
        );
      } else {
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
      toast({
        title: "Error",
        description: e?.message || "No se pudo cargar el carrito",
        variant: "destructive",
      });
      setItems([]);
    }
  }, [toast]);

  // Carga el carrito solo cuando el modal se abre
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      setCheckoutStep('cart');
      setSelectedAddress(null);
      fetchCartItems();
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
    setTimeout(() => onClose(), 300);
  };

  const handleSizeChange = (item: CartItem, newSize: string) => {
    if (onChangeSizeInCart && item.selectedSize) {
      onChangeSizeInCart(item.id, item.selectedSize, newSize);
      setEditingSizeFor(null);
    }
  };

  // Agregar al carrito (sumar cantidad)
  const handleAddQuantity = async (item: CartItem) => {
    setLoadingItemId(item.cartItemId);
    try {
      const { data } = await supabase.auth.getSession();
      const access_token = data?.session?.access_token;
      if (!access_token) throw new Error("Debes iniciar sesión.");

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
      };

      const orderResponse = await fetch(EDGE_CREATE_ORDER, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${access_token}`,
        },
        body: JSON.stringify(orderPayload),
      });

      const orderResult = await orderResponse.json();

      if (!orderResult.ok) {
        toast({
          title: "Stock insuficiente",
          description: orderResult.error || "Algún producto no tiene stock suficiente.",
          variant: "destructive",
        });
        setLoadingCheckout(false);
        return;
      }

      const response = await fetch(EDGE_CREATE_CHECKOUT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${access_token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

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
      toast({
        title: "Error",
        description: error?.message || "No se pudo iniciar el pago.",
        variant: "destructive",
      });
    }
    setLoadingCheckout(false);
    setLoadingClearCart(true);
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

                    return (
                      <div
                        key={item.cartItemId}
                        className="flex gap-4 p-4 bg-card rounded-xl border border-white/10"
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />

                        <div className="flex-1">
                          <h4 className="font-medium text-sm mb-1">{item.name}</h4>
                          <div className="flex gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">
                              {categoriesMap[item.category] || item.category || "Sin categoría"}
                            </Badge>
                            {item.selectedSize && (
                              <div className="flex items-center gap-1">
                                {isEditingSize ? (
                                  <Select
                                    value={item.selectedSize}
                                    onValueChange={(newSize) =>
                                      handleSizeChange(item, newSize)
                                    }
                                  >
                                    <SelectTrigger className="h-6 w-16 text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {availableSizes.map((size) => (
                                        <SelectItem key={size.name} value={size.name}>
                                          {size.name} ({size.stock})
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <Badge variant="secondary" className="text-xs">
                                    Talla: {item.selectedSize}
                                  </Badge>
                                )}
                                {onChangeSizeInCart && !isEditingSize && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-4 w-4"
                                    onClick={() => setEditingSizeFor(itemKey)}
                                  >
                                    <Edit className="h-2 w-2" />
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="text-primary font-bold">
                            ${(item.price * item.quantity).toLocaleString()
}
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
                  >
                    Continuar con la Compra
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

        {checkoutStep === 'address' && (
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex-shrink-0 p-4 sm:p-6 border-b border-white/20">
              <h3 className="text-lg sm:text-xl font-semibold text-white flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Selecciona Dirección de Envío
              </h3>
              <p className="text-sm text-white/70 mt-1">
                Elige donde quieres recibir tu pedido
              </p>
            </div>

            {/* Content Area - Sin scroll */}
            <div className="flex-1 p-4 sm:p-6 space-y-4">
              {/* Dirección seleccionada */}
              {selectedAddress && (
                <div className="p-3 sm:p-4 bg-primary/10 rounded-lg border border-primary/20">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-primary mb-2 text-sm sm:text-base">
                        Dirección seleccionada
                      </h4>
                      <div className="text-xs sm:text-sm space-y-1">
                        <p className="font-medium truncate">{selectedAddress.address_line_1}</p>
                        {selectedAddress.address_line_2 && (
                          <p className="text-white/70 truncate">{selectedAddress.address_line_2}</p>
                        )}
                        <p className="text-white/70">
                          {selectedAddress.city}, {selectedAddress.state} {selectedAddress.postal_code}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          <Badge variant="outline" className="text-xs px-2 py-1">
                            {selectedAddress.address_type}
                          </Badge>
                          {selectedAddress.is_default && (
                            <Badge variant="secondary" className="text-xs px-2 py-1">
                              Principal
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* AddressManager compacto */}
              <div className="space-y-3">
                <AddressManager
                  mode="select"
                  onAddressSelect={handleAddressSelect}
                  selectedAddressId={selectedAddress?.id}
                  compact={true}
                />
              </div>

              {/* Mensaje si no hay dirección seleccionada */}
              {!selectedAddress && (
                <div className="p-3 sm:p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-yellow-200 text-sm font-medium">
                        Selecciona una dirección
                      </p>
                      <p className="text-yellow-200/80 text-xs mt-1">
                        Necesitas elegir donde recibir tu pedido
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer compacto */}
            <div className="flex-shrink-0 border-t border-white/20 p-4 sm:p-6">
              {/* Resumen compacto */}
              <div className="bg-card/50 p-3 rounded-lg border border-white/10 mb-4">
                <div className="flex justify-between items-center text-sm mb-2">
                  <span className="text-white/70">Total ({itemCount} productos):</span>
                  <span className="font-bold text-primary">${total.toLocaleString("es-CO")}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-white/50">
                  <span>Envío incluido</span>
                  <span>🚚 2-5 días hábiles</span>
                </div>
              </div>

              {/* Botones responsivos */}
              <div className="space-y-3">
                <Button
                  variant="hero"
                  className="w-full h-12"
                  onClick={handleProceedToPayment}
                  disabled={!selectedAddress}
                >
                  {!selectedAddress ? (
                    <>
                      <MapPin className="h-4 w-4 mr-2" />
                      Selecciona una dirección
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Continuar al Pago</span>
                      <span className="sm:hidden">Pagar</span>
                    </>
                  )}
                </Button>

                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1 text-white border-white/30"
                    onClick={() => setCheckoutStep('cart')}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline text-xs">Carrito</span>
                  </Button>

                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="flex items-center gap-1"
                    onClick={handleClose}
                  >
                    <X className="h-4 w-4" />
                    <span className="hidden sm:inline text-xs">Cerrar</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {checkoutStep === 'payment' && (
          <>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Confirma tu Pedido
                  </h3>
                </div>
                
                {/* Dirección de envío */}
                {selectedAddress && (
                  <div className="p-4 bg-card rounded-lg border border-white/10">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      Dirección de Envío
                    </h4>
                    <div className="text-sm space-y-1">
                      <p className="font-medium">{selectedAddress.address_line_1}</p>
                      {selectedAddress.address_line_2 && (
                        <p className="text-muted-foreground">{selectedAddress.address_line_2}</p>
                      )}
                      <p className="text-muted-foreground">
                        {selectedAddress.city}, {selectedAddress.state} {selectedAddress.postal_code}
                      </p>
                      <div className="flex items-center gap-2 mt-3">
                        <Badge variant="outline" className="text-xs">
                          {selectedAddress.address_type}
                        </Badge>
                        {selectedAddress.is_default && (
                          <Badge variant="secondary" className="text-xs">
                            Predeterminada
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Resumen de productos */}
                <div className="p-4 bg-card rounded-lg border border-white/10">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4 text-primary" />
                    Productos ({itemCount})
                  </h4>
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {items.map((item) => (
                      <div key={item.cartItemId} className="flex items-center gap-3 py-2">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>Cantidad: {item.quantity}</span>
                            {item.selectedSize && <span>• Talla: {item.selectedSize}</span>}
                          </div>
                        </div>
                        <div className="text-sm font-medium">
                          ${(item.price * item.quantity).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Resumen de precios */}
                <div className="p-4 bg-card rounded-lg border border-white/10">
                  <h4 className="font-medium mb-3">Resumen del Pago</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal ({itemCount} productos):</span>
                      <span>${subtotal.toLocaleString("es-CO")}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Costo de envío:</span>
                      <span>{shipping > 0 ? `$${shipping.toLocaleString("es-CO")}` : "Gratis"}</span>
                    </div>
                    <div className="border-t border-white/10 pt-2">
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total a Pagar:</span>
                        <span className="gradient-text">${total.toLocaleString("es-CO")}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer con botones de pago */}
            <div className="border-t border-white/20 p-6 space-y-4">
              <Button
                variant="hero"
                className="w-full"
                size="lg"
                onClick={handleCheckout}
                disabled={loadingCheckout}
              >
                {loadingCheckout ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Procesando Pago...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Pagar ${total.toLocaleString("es-CO")} con PayPal
                  </div>
                )}
              </Button>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() => setCheckoutStep('address')}
                  disabled={loadingCheckout}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Cambiar Dirección</span>
                  <span className="sm:hidden">Dirección</span>
                </Button>

                <Button
                  variant="ghost"
                  className="flex items-center gap-2"
                  onClick={() => setCheckoutStep('cart')}
                  disabled={loadingCheckout}
                >
                  <ShoppingCart className="h-4 w-4" />
                  <span className="hidden sm:inline">Ver Carrito</span>
                  <span className="sm:hidden">Carrito</span>
                </Button>
              </div>

              <Button 
                variant="ghost" 
                className="w-full text-sm" 
                onClick={handleClose}
                disabled={loadingCheckout}
              >
                Cancelar y Seguir Comprando
              </Button>

              {/* Información de seguridad */}
              <div className="text-center text-xs text-muted-foreground space-y-1">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>Pago seguro con PayPal</span>
                </div>
                <p>Tus datos están protegidos con encriptación SSL</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Cart;