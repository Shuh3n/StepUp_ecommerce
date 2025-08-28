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
    image: string;
    category: string;
    rating: number;
    isNew?: boolean;
    description?: string;
    sizes?: string[];
    colors?: string[];
  } | null;
  onAddToCart: (product: any) => void;
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
    onAddToCart({
      ...product,
      selectedSize,
      selectedColor,
      quantity: 1,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">Detalles del producto</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Product Image */}
          <div className="relative">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-[400px] object-cover rounded-lg"
            />
            
            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
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

            {/* Like Button */}
            <Button
              variant="ghost"
              size="icon"
              className={`absolute top-4 right-4 rounded-full ${
                isLiked ? "text-red-500 bg-white/20" : "text-white bg-black/20"
              }`}
              onClick={() => setIsLiked(!isLiked)}
            >
              <Heart className={`h-5 w-5 ${isLiked ? "fill-current" : ""}`} />
            </Button>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline" className="text-xs">
                  {product.category}
                </Badge>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="text-sm text-muted-foreground">{product.rating}</span>
                </div>
              </div>

              <h1 className="text-2xl font-bold text-card-foreground mb-4">
                {product.name}
              </h1>

              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl font-bold text-primary">
                  ${product.price.toLocaleString()}
                </span>
                {product.originalPrice && (
                  <span className="text-lg text-muted-foreground line-through">
                    ${product.originalPrice.toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <p className="text-muted-foreground leading-relaxed">
                {product.description || "Producto de alta calidad de la marca Step Up. Diseñado con los mejores materiales para brindar comodidad y estilo en cada paso."}
              </p>
            </div>

            {/* Sizes */}
            {product.sizes && (
              <div>
                <h3 className="font-semibold mb-3">Talla</h3>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <Button
                      key={size}
                      variant={selectedSize === size ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedSize(size)}
                      className="min-w-[50px]"
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
                <h3 className="font-semibold mb-3">Color</h3>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color) => (
                    <Button
                      key={color}
                      variant={selectedColor === color ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedColor(color)}
                    >
                      {color}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Add to Cart Button */}
            <Button
              onClick={handleAddToCart}
              className="w-full bg-gradient-stepup hover:shadow-red transition-all duration-300"
              size="lg"
            >
              <ShoppingBag className="h-5 w-5 mr-2" />
              Agregar al Carrito
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailModal;