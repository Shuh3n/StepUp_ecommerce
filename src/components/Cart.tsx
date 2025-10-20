import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus, Minus, ShoppingCart, Trash2, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

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
  const { toast } = useToast();

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
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

  // Disminuir cantidad (solo actualiza local, pero podrías agregar edge si lo deseas)
  const handleSubtractQuantity = async (item: CartItem) => {
    if (item.quantity > 1) {
      onUpdateQuantity(item.id, item.quantity - 1, item.selectedSize);
      await fetchCartItems();
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
  const handleCheckout = async () => {
    setLoadingCheckout(true);
    try {
      const { data } = await supabase.auth.getSession();
      const access_token = data?.session?.access_token;
      const user_email = data?.session?.user?.email;
      if (!user_email || !access_token) throw new Error("Debes iniciar sesión para pagar.");

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
        address: null,
        phone: null,
        payment_method: "paypal",
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

      // 2. Si la orden fue creada, inicia el flujo de pago con PayPal
      const payload = {
        items: items.map((item) => ({
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        email: user_email,
      };

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
            <ShoppingCart className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-bold">Carrito</h2>
            {itemCount > 0 && (
              <Badge className="bg-primary text-primary-foreground">
                {itemCount}
              </Badge>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

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
              <span className="text-lg font-medium">Total:</span>
              <span className="text-2xl font-bold gradient-text">
                ${total.toLocaleString()}
              </span>
            </div>

            <div className="space-y-3">
              <Button
                variant="hero"
                className="w-full"
                size="lg"
                onClick={handleCheckout}
                disabled={loadingCheckout}
              >
                {loadingCheckout ? "Procesando..." : "Proceder al Pago con PayPal"}
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
      </div>
    </div>
  );
};

export default Cart;