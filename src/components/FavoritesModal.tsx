import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Trash2, ShoppingBag, Star } from "lucide-react";
import { useState, useEffect } from "react";

interface FavoritesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToCart?: (product: FavoriteProduct & { quantity: number }) => void;
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

const FavoritesModal = ({ isOpen, onClose, onAddToCart }: FavoritesModalProps) => {
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);

  // Load favorites from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('stepup-favorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, [isOpen]);

  const removeFavorite = (productId: number) => {
    const updatedFavorites = favorites.filter(fav => fav.id !== productId);
    setFavorites(updatedFavorites);
    localStorage.setItem('stepup-favorites', JSON.stringify(updatedFavorites));
  };

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
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto animate-scale-in">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold gradient-text flex items-center gap-2 animate-fade-in">
            <Heart className="h-6 w-6 text-red-500 fill-current" />
            Mis Favoritos
          </DialogTitle>
        </DialogHeader>
        
        {favorites.length === 0 ? (
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

                    {/* Remove from favorites */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-3 right-3 rounded-full bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white"
                      onClick={() => removeFavorite(product.id)}
                    >
                      <Trash2 className="h-4 w-4" />
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