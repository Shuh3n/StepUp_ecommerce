import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Trash2, ShoppingBag, Star } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { removeFavorite } from "@/lib/api/favorites";
import { supabase } from "@/lib/supabase";

interface FavoritesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToCart?: (product: any) => void;
  onFavoritesChange?: () => void;
}

interface FavoriteProduct {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  rating: number;
  isNew?: boolean;
}

const EDGE_URL = "https://xrflzmovtmlfrjhtoejs.supabase.co/functions/v1/get-favorites";

const FavoritesModal = ({ isOpen, onClose, onAddToCart, onFavoritesChange }: FavoritesModalProps) => {
  const { toast } = useToast();
  const [favoritesRaw, setFavoritesRaw] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [categoriesMap, setCategoriesMap] = useState<Record<string, string>>({});

  // Cargar favoritos solo si el modal está abierto y el usuario está autenticado
  useEffect(() => {
    const fetchFavorites = async () => {
      setLoading(true);
      try {
        const { data } = await supabase.auth.getSession();
        const access_token = data?.session?.access_token;
        if (!access_token) {
          toast({
            title: "Debes iniciar sesión",
            description: (
              <Button
                variant="outline"
                onClick={() => window.location.href = "/login"}
                className="mt-2"
              >
                Ir a Login
              </Button>
            ),
            duration: 6000,
          });
          setFavoritesRaw([]);
          setLoading(false);
          return;
        }
        const response = await fetch(EDGE_URL, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${access_token}`,
          },
        });
        const result = await response.json();
        const favoritesArray = Array.isArray(result.favorites) ? result.favorites : Array.isArray(result) ? result : [];
        setFavoritesRaw(favoritesArray);
        if (!favoritesArray.length) {
          toast({ title: "Sin favoritos", description: "No se encontraron favoritos para este usuario." });
        }
      } catch {
        toast({ title: "Error", description: "Error al cargar favoritos." });
        setFavoritesRaw([]);
      }
      setLoading(false);
    };
    if (isOpen) fetchFavorites();
  }, [isOpen, toast]);

  // Cargar categorías para el mapeo de nombres
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

  // Memoiza el mapeo de favoritos
  const favorites: FavoriteProduct[] = useMemo(() => (
    (favoritesRaw || [])
      .filter((fav) => fav.products)
      .map((fav) => ({
        id: fav.product_id,
        name: fav.products?.name,
        price: Number(fav.products?.price),
        originalPrice: undefined,
        image: fav.products?.image_url,
        category: categoriesMap[fav.products?.category] || "General",
        rating: 5,
        isNew: false,
      }))
  ), [favoritesRaw, categoriesMap]);

  // Eliminar favorito
  const handleRemoveFavorite = async (productId: number) => {
    setLoading(true);
    try {
      const ok = await removeFavorite(productId);
      if (ok) {
        toast({ title: "Eliminado de favoritos", description: "El producto ha sido removido de tus favoritos." });
        // Actualizar localmente para UI inmediata del modal
        setFavoritesRaw(prev => prev.filter(fav => fav.product_id !== productId));
        // Notificar al componente padre para que refresque el ProductGrid
        if (onFavoritesChange) onFavoritesChange();
        // Refrescar el grid o la página de productos si existe el objeto window
        if (typeof window !== "undefined") {
          // Si estás en la página de productos, recarga la página
          if (window.location.pathname.includes("/productos")) {
            window.location.reload();
          }
        }
      } else {
        toast({ title: "Error", description: "No se pudo eliminar de favoritos." });
      }
    } catch {
      toast({ title: "Error", description: "No se pudo eliminar de favoritos." });
    }
    setLoading(false);
  };

  // Agregar al carrito
  const handleAddToCart = (product: FavoriteProduct) => {
    if (onAddToCart) {
      onAddToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        image: product.image,
        category: product.category,
        rating: product.rating,
        isNew: product.isNew,
        quantity: 1,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent aria-describedby="favorites-description" className="max-w-4xl max-h-[80vh] overflow-y-auto animate-scale-in">
        <span id="favorites-description" className="sr-only">
          Listado de tus productos favoritos
        </span>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold gradient-text flex items-center gap-2 animate-fade-in">
            <Heart className="h-6 w-6 text-red-500 fill-current" />
            Mis Favoritos
          </DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="text-center py-12">Cargando favoritos...</div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No tienes favoritos aún</h3>
            <p className="text-muted-foreground mb-6">
              Agrega productos a tus favoritos para verlos aquí
            </p>
            <Button 
              onClick={() => window.location.href = '/productos'} 
              variant="outline"
              className="hover:scale-105 transition-transform duration-200"
            >
              Explorar Productos
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((product) => {
              const discount = product.originalPrice 
                ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) 
                : 0;

              return (
                <div
                  key={product.id}
                  className="group relative bg-card rounded-xl overflow-hidden shadow-lg hover:shadow-floating transition-all duration-500 hover:scale-105 hover:-translate-y-2 animate-fade-in"
                >
                  {/* Product Image */}
                  <div className="relative aspect-square overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    
                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                      {product.isNew && (
                        <Badge className="bg-primary text-primary-foreground">
                          Nuevo
                        </Badge>
                      )}
                      {discount > 0 && (
                        <Badge className="bg-secondary text-secondary-foreground">
                          -{discount}%
                        </Badge>
                      )}
                    </div>

                    {/* Remove from favorites - Botón más visible */}
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-3 right-3 rounded-lg bg-red-500/90 hover:bg-red-600 text-white shadow-lg backdrop-blur-sm transition-all duration-200 hover:scale-105"
                      onClick={() => handleRemoveFavorite(product.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Eliminar
                    </Button>
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="text-xs">
                        {product.category}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-400 fill-current" />
                        <span className="text-xs text-muted-foreground">{product.rating}</span>
                      </div>
                    </div>

                    <h3 className="font-semibold text-card-foreground mb-2 line-clamp-2">
                      {product.name}
                    </h3>

                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-primary">
                          ${product.price.toLocaleString()}
                        </span>
                        {product.originalPrice && (
                          <span className="text-sm text-muted-foreground line-through">
                            ${product.originalPrice.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>

                    <Button
                      onClick={() => handleAddToCart(product)}
                      className="w-full bg-gradient-stepup hover:shadow-red transition-all duration-300 hover:scale-105"
                      size="sm"
                    >
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      Agregar al Carrito
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FavoritesModal;