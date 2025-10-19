import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Heart, ShoppingBag, X } from "lucide-react";
import { useState } from "react";

interface ProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: number;
    name: string;
    price: number;
    originalPrice?: number;
    image?: string;
    image_url?: string;
    category: string;
    rating: number;
    isNew?: boolean;
    description?: string;
    sizes?: string[];
    colors?: string[];
  } | null;
  onAddToCart: (product: { id: number; name: string; price: number; originalPrice?: number; image?: string; image_url?: string; category: string; rating: number; isNew?: boolean; description?: string; sizes?: string[]; colors?: string[]; selectedSize?: string; selectedColor?: string; quantity: number; }) => void;
}

const ProductDetailModal = ({ isOpen, onClose, product, onAddToCart }: ProductDetailModalProps) => {
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [isLiked, setIsLiked] = useState(false);

  if (!product) return null;

  const discount = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) 
    : 0;

  const handleAddToCart = () => {
    if (!selectedSize && product.sizes && product.sizes.length > 0) {
      // Show error message if size is required but not selected
      return;
    }
    
    onAddToCart({
      ...product,
      selectedSize,
      selectedColor,
      quantity: 1,
    });
    onClose();
  };

  const handleViewDetails = () => {
    onClose();
    window.location.href = `/producto/${product.id}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden p-0 bg-transparent border-none animate-scale-in">
        {/* Semi-transparent backdrop */}
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-fade-in" />
        
        {/* Modal content */}
        <div className="relative bg-card/95 backdrop-blur-lg border border-white/20 rounded-2xl mx-auto my-8 max-w-4xl overflow-hidden shadow-2xl animate-fade-in-up">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Product Image */}
            <div className="relative aspect-square lg:aspect-auto">
              <img
                src={product.image_url || product.image || ""}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              
              {/* Badges */}
              <div className="absolute top-6 left-6 flex flex-col gap-2">
                {product.isNew && (
                  <Badge className="bg-primary text-primary-foreground shadow-lg">
                    Nuevo
                  </Badge>
                )}
                {discount > 0 && (
                  <Badge className="bg-secondary text-secondary-foreground shadow-lg">
                    -{discount}%
                  </Badge>
                )}
              </div>

              {/* Like Button */}
              <Button
                variant="ghost"
                size="icon"
                className={`absolute top-6 right-6 rounded-full shadow-lg ${
                  isLiked ? "text-red-500 bg-white/90" : "text-gray-600 bg-white/90"
                } hover:bg-white`}
                onClick={() => setIsLiked(!isLiked)}
              >
                <Heart className={`h-5 w-5 ${isLiked ? "fill-current" : ""}`} />
              </Button>

              {/* Close Button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-6 right-16 rounded-full bg-white/90 text-gray-600 hover:bg-white shadow-lg"
                onClick={onClose}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Product Info */}
            <div className="p-8 space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="outline" className="text-xs">
                    {product.category}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-sm font-medium">{product.rating}</span>
                  </div>
                </div>

                <h1 className="text-3xl font-bold text-card-foreground mb-4 leading-tight">
                  {product.name}
                </h1>

                <div className="flex items-center gap-3 mb-6">
                  <span className="text-4xl font-bold text-primary">
                    ${product.price.toLocaleString()}
                  </span>
                  {product.originalPrice && (
                    <span className="text-xl text-muted-foreground line-through">
                      ${product.originalPrice.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Descripción</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {product.description || "Producto de alta calidad de la marca Step Up. Diseñado con los mejores materiales para brindar comodidad y estilo en cada paso."}
                </p>
              </div>

              {/* Materials */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Materiales</h3>
                <p className="text-muted-foreground">
                  100% Algodón premium, resistente y suave al tacto
                </p>
              </div>

              {/* Sizes */}
              {product.sizes && (
                <div>
                  <h3 className="font-semibold text-lg mb-3">Tallas disponibles</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((size) => (
                      <Button
                        key={size}
                        variant={selectedSize === size ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedSize(size)}
                        className="min-w-[60px] h-10"
                      >
                        {size}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Colors */}
              {product.colors && (
                <div>
                  <h3 className="font-semibold text-lg mb-3">Colores</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.colors.map((color) => (
                      <Button
                        key={color}
                        variant={selectedColor === color ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedColor(color)}
                        className="h-10"
                      >
                        {color}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3 pt-4">
                {product.sizes && product.sizes.length > 0 && !selectedSize && (
                  <p className="text-sm text-red-500 text-center animate-pulse">
                    Selecciona una talla para continuar
                  </p>
                )}
                
                <Button
                  onClick={handleAddToCart}
                  disabled={product.sizes && product.sizes.length > 0 && !selectedSize}
                  className="w-full bg-gradient-stepup hover:shadow-red transition-all duration-300 h-12 text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
                >
                  <ShoppingBag className="h-5 w-5 mr-2" />
                  Añadir al carrito
                </Button>
                
                <Button
                  onClick={handleViewDetails}
                  variant="outline"
                  className="w-full h-12 text-lg hover:scale-105 transition-transform duration-200"
                >
                  Ver detalles completos
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailModal;