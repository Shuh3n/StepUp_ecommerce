import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, Trash2, ShoppingBag, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { addFavorite, removeFavorite } from "@/lib/api/favorites";
import { supabase } from "@/lib/supabase";

// Edge Function URLs
const EDGE_ADD_TO_CART = "https://xrflzmovtmlfrjhtoejs.supabase.co/functions/v1/add-to-cart";
const EDGE_REMOVE_FROM_CART = "https://xrflzmovtmlfrjhtoejs.supabase.co/functions/v1/remove-from-cart";

interface ProductVariant {
  id_variante: number;
  id_producto: number;
  id_talla: number;
  codigo_sku: string;
  stock: number;
  precio_ajuste: number;
  size?: {
    id_talla: number;
    nombre_talla: string;
  };
}

interface ProductCardProps {
  id: number;
  name: string;
  price: number;
  image?: string;
  category: string;
  description?: string;
  created_at?: string;
  variants?: ProductVariant[];
  onAddToCart?: () => void;
  onClick: () => void;
  isFavorite: boolean;
  onFavoriteChange?: (productId: number, newValue: boolean) => void;
}

const ProductCard = ({
  id,
  name,
  price,
  image,
  category,
  description,
  created_at,
  variants = [],
  onAddToCart,
  onClick,
  isFavorite,
  onFavoriteChange,
}: ProductCardProps) => {
  const { toast } = useToast();
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const [localIsFavorite, setLocalIsFavorite] = useState(isFavorite);
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  useEffect(() => {
    setLocalIsFavorite(isFavorite);
  }, [isFavorite]);

  const hasVariants = variants.length > 0;
  const hasStock = hasVariants ? variants.some((v) => Number(v.stock) > 0) : false;

  const isNew = () => {
    if (!created_at) return false;
    const createdDate = new Date(created_at);
    const currentDate = new Date();
    const daysDifference = (currentDate.getTime() - createdDate.getTime()) / (1000 * 3600 * 24);
    return daysDifference <= 5;
  };

  const getButtonProps = () => {
    if (!hasVariants) {
      return { text: "Sin Variantes", disabled: true, variant: "outline" as const };
    }
    if (hasStock) {
      return { text: "Agregar", disabled: false, variant: "default" as const };
    }
    return { text: "Agotado", disabled: true, variant: "outline" as const };
  };

  const buttonProps = getButtonProps();

  // Selección simple: si solo hay una variante, se toma esa
  const selectedVariantId = variants.length === 1 ? variants[0] : null;
  const variant_id = selectedVariantId?.id_variante ?? null;

  // AGREGAR AL CARRITO - EDGE FUNCTION
  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hasVariants || !hasStock) {
      onClick();
      return;
    }
    setShowSizeModal(true);
    setSelectedVariant(null); // Reset selection
  };

  // FAVORITOS
  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setFavoriteLoading(true);
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData?.session?.access_token) {
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
      let ok = false;
      if (!localIsFavorite) {
        ok = await addFavorite(id);
        if (ok) {
          setLocalIsFavorite(true);
          toast({
            title: "Agregado a favoritos",
            description: (
              <span className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-green-600 fill-current" />
                <span>El producto "{name}" se agregó a tus favoritos.</span>
              </span>
            ),
          });
          if (onFavoriteChange) onFavoriteChange(id, true);
        } else {
          toast({
            title: "Error",
            description: "No se pudo agregar a favoritos",
          });
        }
      } else {
        ok = await removeFavorite(id);
        if (ok) {
          setLocalIsFavorite(false);
          toast({
            title: "Eliminado de favoritos",
            description: (
              <span className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-red-500 fill-current" />
                <span>El producto "{name}" fue removido de favoritos.</span>
              </span>
            ),
          });
          if (onFavoriteChange) onFavoriteChange(id, false);
        } else {
          toast({
            title: "Error",
            description: "No se pudo eliminar de favoritos",
          });
        }
      }
    } catch {
      toast({
        title: "Error",
        description: "Error al modificar favoritos",
      });
    }
    setFavoriteLoading(false);
  };

  const handleAddToCartWithVariant = async (variant: ProductVariant | null) => {
    if (!variant) return;
    setCartLoading(true);
    setShowSizeModal(false); // Cerrar modal primero
    
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData?.session?.access_token) {
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
        setCartLoading(false);
        return;
      }
      const access_token = sessionData.session.access_token;

      const response = await fetch(EDGE_ADD_TO_CART, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${access_token}`,
        },
        body: JSON.stringify({
          product_id: id,
          variant_id: variant.id_variante,
          quantity: 1,
        }),
      });

      const raw = await response.text();
      let result;
      try {
        result = JSON.parse(raw);
      } catch {
        result = { ok: false, error: raw };
      }

      if (response.status === 401 || result.code === 401) {
        toast({
          title: "No autorizado",
          description: "Debes iniciar sesión para agregar productos al carrito.",
          variant: "destructive"
        });
      } else if (result.ok) {
        toast({
          title: "Agregado al carrito",
          description: `El producto "${name}" talla "${variant.size?.nombre_talla}" se agregó al carrito.`,
        });
        if (onAddToCart) onAddToCart();
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo agregar al carrito",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "No se pudo agregar al carrito",
        variant: "destructive"
      });
    }
    setCartLoading(false);
  };

  return (
    <>
      <div
        className="glass rounded-xl overflow-hidden border border-white/20 hover:border-white/40 transition-all duration-300 cursor-pointer group h-full flex flex-col"
        onClick={onClick}
      >
        {/* Imagen sin badges */}
        <div className="relative aspect-square overflow-hidden">
          <img
            src={image || "/placeholder.png"}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />

          {/* Botón de favoritos */}
          <Button
            type="button"
            variant={localIsFavorite ? "default" : "ghost"}
            size="icon"
            disabled={favoriteLoading}
            className={`absolute top-3 right-3 rounded-full z-10 ${localIsFavorite ? "bg-red-500 text-white" : "bg-white/80 text-red-500 hover:bg-red-500 hover:text-white"}`}
            onClick={handleFavoriteClick}
          >
            <Heart className={`h-5 w-5 ${localIsFavorite ? "fill-current" : ""}`} />
          </Button>

          {/* Badges en la parte superior */}
          <div className="absolute top-3 left-3 right-16 flex justify-between items-start pointer-events-none">
            <Badge variant="outline" className="bg-black/50 text-white border-white/20 text-xs">
              {category}
            </Badge>
            <div className="flex flex-col gap-1">
              {isNew() && (
                <Badge variant="secondary" className="bg-gradient-to-r from-purple-500/80 to-pink-500/80 text-white border-0 text-xs font-medium">
                  ✨ Nuevo
                </Badge>
              )}
              {!hasVariants ? (
                !isNew() && (
                  <Badge variant="secondary" className="bg-blue-500/80 text-white text-xs">
                    Disponible
                  </Badge>
                )
              ) : hasStock ? (
                <Badge variant="secondary" className="bg-green-500/80 text-white text-xs">
                  En Stock
                </Badge>
              ) : (
                <Badge variant="destructive" className="bg-red-500/80 text-white text-xs">
                  🚫 Agotado
                </Badge>
              )}
              {!hasVariants && (
                <Badge variant="secondary" className="bg-gray-500/80 text-white text-xs">
                  Sin Configurar
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Contenido con altura flexible */}
        <div className="p-4 flex flex-col flex-grow">
          <div className="flex-grow">
            <h3 className="font-semibold text-lg leading-tight line-clamp-2 mb-2 min-h-[3.5rem]">
              {name}
            </h3>
            {description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3 min-h-[2.5rem]">
                {description}
              </p>
            )}
          </div>
          <div className="mb-4">
            <p className="text-2xl font-bold gradient-text mb-1">
              ${price.toLocaleString()}
            </p>
            {hasVariants ? (
              <p className="text-xs text-muted-foreground">
                {variants.filter(v => Number(v.stock) > 0).length} de {variants.length} tallas disponibles
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Producto sin variantes configuradas
              </p>
            )}
          </div>
          <Button
            onClick={handleButtonClick}
            disabled={buttonProps.disabled || cartLoading}
            variant={buttonProps.variant}
            className="w-full mt-auto flex items-center justify-center"
            size="sm"
          >
            <ShoppingBag className="h-4 w-4 mr-2" />
            {cartLoading ? "Agregando..." : buttonProps.text}
          </Button>
        </div>
      </div>

      {/* Modal de selección de talla */}
      {showSizeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md mx-2 sm:mx-4 overflow-hidden max-h-[90vh] sm:max-h-[85vh] flex flex-col">
            {/* Header del modal */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">Selecciona una talla</h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-1 truncate">{name}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSizeModal(false);
                }}
                className="rounded-full hover:bg-gray-100 flex-shrink-0"
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </div>

            {/* Lista de tallas */}
            <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {variants.filter(v => v.stock > 0).map(variant => (
                  <Button
                    key={variant.id_variante}
                    variant={selectedVariant?.id_variante === variant.id_variante ? "default" : "outline"}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedVariant(variant);
                    }}
                    className={`h-10 sm:h-12 flex flex-col items-center justify-center transition-all text-xs sm:text-sm ${
                      selectedVariant?.id_variante === variant.id_variante 
                        ? "bg-orange-500 text-white border-orange-500 hover:bg-orange-600" 
                        : "hover:border-orange-300"
                    }`}
                  >
                    <span className="font-medium">
                      {variant.size?.nombre_talla || `Talla ${variant.id_talla}`}
                    </span>
                    <span className="text-xs opacity-70">
                      {variant.stock} disp.
                    </span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Footer con botones */}
            <div className="p-4 sm:p-6 border-t border-gray-100 flex gap-2 sm:gap-3 flex-shrink-0">
              <Button
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSizeModal(false);
                }}
                className="flex-1 text-sm"
              >
                Cancelar
              </Button>
              <Button
                disabled={!selectedVariant || cartLoading}
                onClick={async (e) => {
                  e.stopPropagation();
                  await handleAddToCartWithVariant(selectedVariant);
                }}
                className="flex-1 bg-orange-500 text-white hover:bg-orange-600 text-sm"
              >
                {cartLoading ? "Agregando..." : "Agregar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductCard;