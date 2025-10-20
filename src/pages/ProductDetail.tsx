import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Cart from "@/components/Cart";
import { ArrowLeft, Plus, Minus, Heart } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { addFavorite, removeFavorite, getFavoritesFromEdgeRaw } from "@/lib/api/favorites";

// Edge Functions URLs
const EDGE_ADD_TO_CART = "https://xrflzmovtmlfrjhtoejs.supabase.co/functions/v1/add-to-cart";
const EDGE_GET_CART_ITEMS = "https://xrflzmovtmlfrjhtoejs.supabase.co/functions/v1/get-cart-items";

interface Size {
  id_talla: number;
  nombre_talla: string;
}

interface ProductVariant {
  id_variante: number;
  id_producto: number;
  id_talla: number;
  codigo_sku: string;
  stock: number;
  precio_ajuste: number;
  size?: Size;
}

interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  category: string;
  variants: ProductVariant[];
}

export interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
  quantity: number;
  selectedSize: string;
  variantId: number;
}

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  // Carga producto, variantes y tallas en paralelo
  useEffect(() => {
    let isMounted = true;
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [productRes, variantsRes, sizesRes] = await Promise.all([
          supabase
            .from('products')
            .select('*, categories(name)')
            .eq('id', id)
            .single(),
          supabase.from('products_variants').select('*').eq('id_producto', id),
          supabase.from('sizes').select('*')
        ]);
        if (productRes.error || !productRes.data) throw productRes.error || new Error("Producto no encontrado");
        if (variantsRes.error) throw variantsRes.error;
        if (sizesRes.error) throw sizesRes.error;

        const variantsWithSizes = (variantsRes.data || []).map(variant => ({
          ...variant,
          size: (sizesRes.data || []).find((s: Size) => s.id_talla === variant.id_talla)
        }));

        const categoryName = productRes.data.categories?.name || "Sin categoría";
        if (isMounted) {
          setProduct({ ...productRes.data, category: categoryName, variants: variantsWithSizes });
        }
      } catch (error) {
        toast({
          title: 'Error al cargar el producto',
          description: error instanceof Error ? error.message : 'No se pudo cargar el producto',
          variant: 'destructive',
        });
        navigate('/productos');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    if (id && !isNaN(Number(id))) fetchAll();
    return () => { isMounted = false; };
  }, [id, navigate, toast]);

  // Favoritos
  const refreshFavorite = useCallback(async () => {
    if (!product) return;
    const favorites = await getFavoritesFromEdgeRaw();
    setIsFavorite(favorites.some((fav: any) => fav.product_id === product.id));
  }, [product]);

  useEffect(() => {
    if (product) refreshFavorite();
  }, [product, refreshFavorite]);

  // Memo: tallas disponibles y stock máximo
  const availableSizes = useMemo(() => {
    if (!product?.variants) return [];
    return product.variants
      .filter(v => Number(v.stock) > 0 && v.size && v.size.nombre_talla)
      .map(v => ({
        name: v.size!.nombre_talla.trim(),
        stock: Number(v.stock),
        variant: v
      }));
  }, [product]);

  const maxStock = useMemo(() => {
    if (!selectedSize || !product?.variants) return 0;
    const variant = product.variants.find(
      v => v.size && v.size.nombre_talla.trim() === selectedSize.trim()
    );
    return variant ? Number(variant.stock) : 0;
  }, [selectedSize, product]);

  // Variant por talla
  const getVariantBySize = useCallback((sizeName: string): ProductVariant | null => {
    if (!product?.variants) return null;
    return product.variants.find(
      v => v.size && v.size.nombre_talla.trim() === sizeName.trim()
    ) || null;
  }, [product]);

  // Cambiar cantidad
  const handleQuantityChange = (delta: number) => {
    const newQuantity = selectedQuantity + delta;
    if (newQuantity >= 1 && newQuantity <= maxStock) setSelectedQuantity(newQuantity);
  };

  useEffect(() => {
    setSelectedQuantity(1);
  }, [selectedSize]);

  // AGREGAR AL CARRITO
  const handleAddToCart = async () => {
    if (!selectedSize) {
      toast({
        title: "Selecciona una talla",
        description: "Por favor, selecciona una talla antes de agregar al carrito",
        variant: "destructive",
      });
      return;
    }
    const variant = getVariantBySize(selectedSize);
    if (!variant || variant.stock <= 0) {
      toast({
        title: "Sin stock",
        description: "Esta talla no tiene stock disponible",
        variant: "destructive",
      });
      return;
    }
    const { data } = await supabase.auth.getSession();
    const access_token = data?.session?.access_token;
    if (!access_token) {
      toast({
        title: "Debes iniciar sesión",
        description: (
          <Button
            variant="outline"
            className="mt-2 bg-orange-500 text-white hover:bg-orange-600 border-none"
            onClick={() => window.location.href = "/login"}
          >Ir a Login</Button>
        ),
        duration: 6000,
      });
      return;
    }
    try {
      const response = await fetch(EDGE_ADD_TO_CART, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${access_token}`,
        },
        body: JSON.stringify({
          product_id: product.id,
          variant_id: variant.id_variante,
          quantity: selectedQuantity,
        }),
      });
      const result = await response.json();
      if (result.ok) {
        toast({
          title: "Agregado al carrito",
          description: `${selectedQuantity} x ${product.name} (${selectedSize}) agregado al carrito`,
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo agregar al carrito",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "No se pudo agregar al carrito",
        variant: "destructive",
      });
    }
    setSelectedQuantity(1);
  };

  // Favoritos
  const handleFavoriteClick = async () => {
    setFavoriteLoading(true);
    const { data } = await supabase.auth.getSession();
    const access_token = data?.session?.access_token;
    if (!access_token) {
      toast({
        title: "Para agregar a favoritos debes iniciar sesión",
        description: (
          <Button
            variant="outline"
            className="mt-2 bg-orange-500 text-white hover:bg-orange-600 border-none"
            onClick={() => window.location.href = "/login"}
          >
            Ir a Login
          </Button>
        ),
        duration: 6000,
      });
      setFavoriteLoading(false);
      return;
    }
    try {
      if (!isFavorite) {
        const ok = await addFavorite(product!.id);
        if (ok) {
          setIsFavorite(true);
          toast({
            title: "Agregado a favoritos",
            description: `El producto "${product!.name}" se agregó a tus favoritos.`,
          });
        }
      } else {
        const ok = await removeFavorite(product!.id);
        if (ok) {
          setIsFavorite(false);
          toast({
            title: "Eliminado de favoritos",
            description: `El producto "${product!.name}" fue removido de favoritos.`,
          });
          await refreshFavorite();
        }
      }
    } catch {
      toast({
        title: "Error",
        description: "No se pudo modificar favoritos",
        variant: "destructive",
      });
    }
    setFavoriteLoading(false);
  };

  const totalItems = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar
          cartItems={totalItems}
          onCartClick={() => setIsCartOpen(true)}
          onContactClick={() => {}}
          onFavoritesClick={() => {}}
        />
        <div className="flex justify-center pt-20 px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-4xl lg:w-[70%] glass rounded-xl border border-white/20 p-4 sm:p-6 lg:p-8">
            <div className="flex items-center justify-center py-8">
              <p className="text-base sm:text-lg text-white">Cargando producto...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar
          cartItems={totalItems}
          onCartClick={() => setIsCartOpen(true)}
          onContactClick={() => {}}
          onFavoritesClick={() => {}}
        />
        <div className="flex justify-center pt-20 px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-4xl lg:w-[70%] glass rounded-xl border border-white/20 p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col items-center justify-center gap-4 py-8">
              <p className="text-lg sm:text-xl text-white text-center">Producto no encontrado</p>
              <Button onClick={() => navigate('/productos')} size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver a Productos
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar
        cartItems={totalItems}
        onCartClick={() => setIsCartOpen(true)}
        onContactClick={() => {}}
        onFavoritesClick={() => {}}
      />

      <div className="flex justify-center pt-20 px-4 sm:px-6 lg:px-8 pb-8">
        <div className="w-full max-w-4xl lg:w-[70%] glass rounded-xl border border-white/20 p-4 sm:p-6 lg:p-8">
          <main>
            <Button
              variant="ghost"
              onClick={() => navigate('/productos')}
              className="mb-4 sm:mb-6 text-white hover:text-white hover:bg-white/10"
              size="sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Productos
            </Button>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              {/* Product Image */}
              <div className="aspect-square rounded-xl overflow-hidden bg-black/20 border border-white/10">
                <img
                  src={product.image_url || '/placeholder.png'}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Product Info */}
              <div className="space-y-4 sm:space-y-6">
                <div className="space-y-2 flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-bold text-white">{product.name}</h1>
                  <button
                    type="button"
                    disabled={favoriteLoading}
                    onClick={handleFavoriteClick}
                    className={`rounded-full p-2 transition-colors ${isFavorite ? "bg-red-500 text-white" : "bg-white/80 text-red-500 hover:bg-red-500 hover:text-white"}`}
                    aria-label={isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
                  >
                    <Heart className={`h-6 w-6 ${isFavorite ? "fill-current" : ""}`} />
                  </button>
                </div>

                <div className="space-y-2">
                  <p className="text-xs sm:text-sm uppercase tracking-wider text-white/70">
                    {product.category}
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-primary">
                    ${product.price.toLocaleString()}
                  </p>
                </div>

                {product.description && (
                  <div className="prose prose-sm">
                    <p className="text-sm sm:text-base text-white/80">{product.description}</p>
                  </div>
                )}

                {/* Size Selection */}
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <h3 className="text-base sm:text-lg font-semibold text-white">Tallas disponibles</h3>
                    {selectedSize && (
                      <span className="text-xs sm:text-sm text-white/70">
                        Seleccionada: {selectedSize} (Stock: {maxStock})
                      </span>
                    )}
                  </div>

                  {availableSizes.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                      {availableSizes.map((sizeInfo) => (
                        <button
                          key={sizeInfo.name}
                          onClick={() => setSelectedSize(sizeInfo.name)}
                          className={`
                            p-2 sm:p-3 rounded-lg border-2 text-center transition-all
                            ${selectedSize === sizeInfo.name
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-white/20 hover:border-primary/50 text-white bg-white/10 hover:bg-white/20'
                            }
                          `}
                        >
                          <div className="font-semibold text-sm sm:text-base">{sizeInfo.name}</div>
                          <div className="text-xs opacity-75">
                            Stock: {sizeInfo.stock}
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 sm:py-8">
                      <p className="text-white/70 text-sm sm:text-base">No hay tallas disponibles</p>
                      <p className="text-destructive text-xs sm:text-sm">Producto agotado</p>
                    </div>
                  )}
                </div>

                {/* Quantity Selection */}
                {selectedSize && maxStock > 0 && (
                  <div className="space-y-3 sm:space-y-4">
                    <h3 className="text-base sm:text-lg font-semibold text-white">Cantidad</h3>
                    <div className="flex items-center gap-3 sm:gap-4">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleQuantityChange(-1)}
                        disabled={selectedQuantity <= 1}
                        className="border-white/20 text-white hover:bg-white/10 hover:text-white h-8 w-8 sm:h-10 sm:w-10"
                      >
                        <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                      <span className="text-lg sm:text-xl font-semibold w-8 sm:w-12 text-center text-white">
                        {selectedQuantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleQuantityChange(1)}
                        disabled={selectedQuantity >= maxStock}
                        className="border-white/20 text-white hover:bg-white/10 hover:text-white h-8 w-8 sm:h-10 sm:w-10"
                      >
                        <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                      <span className="text-xs sm:text-sm text-white/70">
                        de {maxStock} disponibles
                      </span>
                    </div>
                  </div>
                )}

                {/* Add to Cart Button */}
                <Button
                  onClick={handleAddToCart}
                  disabled={availableSizes.length === 0 || !selectedSize}
                  className="w-full text-sm sm:text-base"
                  size="lg"
                >
                  {availableSizes.length === 0
                    ? 'Producto Agotado'
                    : !selectedSize
                    ? 'Selecciona una talla'
                    : `Agregar ${selectedQuantity} al Carrito`
                  }
                </Button>
              </div>
            </div>
          </main>
        </div>
      </div>

      <Cart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)} onUpdateQuantity={function (id: number, quantity: number, selectedSize?: string): void {
          throw new Error('Function not implemented.');
        } } onRemoveItem={function (id: number, selectedSize?: string): void {
          throw new Error('Function not implemented.');
        } }        // Puedes pasar handlers si los necesitas
      />
    </div>
  );
};

export default ProductDetail;