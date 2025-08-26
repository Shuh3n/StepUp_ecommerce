import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, ShoppingBag, Star } from "lucide-react";

interface ProductCardProps {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  rating: number;
  isNew?: boolean;
  onAddToCart: (product: any) => void;
}

const ProductCard = ({
  id,
  name,
  price,
  originalPrice,
  image,
  category,
  rating,
  isNew,
  onAddToCart,
}: ProductCardProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleAddToCart = () => {
    onAddToCart({
      id,
      name,
      price,
      image,
      category,
      quantity: 1,
    });
  };

  const discount = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

  return (
    <div
      className="group relative bg-card rounded-2xl overflow-hidden shadow-lg hover:shadow-floating transition-all duration-300 hover:scale-[1.02]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Badges */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
        {isNew && (
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
        className={`absolute top-3 right-3 z-10 rounded-full transition-all duration-300 ${
          isLiked ? "text-red-500 bg-white/20" : "text-white bg-black/20"
        } ${isHovered ? "opacity-100" : "opacity-0"}`}
        onClick={() => setIsLiked(!isLiked)}
      >
        <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
      </Button>

      {/* Product Image */}
      <div className="relative aspect-square overflow-hidden">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
        
        {/* Overlay on hover */}
        <div className={`absolute inset-0 bg-black/20 transition-opacity duration-300 ${
          isHovered ? "opacity-100" : "opacity-0"
        }`}>
          <div className="absolute bottom-4 left-4 right-4">
            <Button
              variant="glass"
              className="w-full"
              onClick={handleAddToCart}
            >
              <ShoppingBag className="h-4 w-4 mr-2" />
              Agregar al Carrito
            </Button>
          </div>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <Badge variant="outline" className="text-xs">
            {category}
          </Badge>
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 text-yellow-400 fill-current" />
            <span className="text-xs text-muted-foreground">{rating}</span>
          </div>
        </div>

        <h3 className="font-semibold text-card-foreground mb-2 line-clamp-2">
          {name}
        </h3>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-primary">
              ${price.toLocaleString()}
            </span>
            {originalPrice && (
              <span className="text-sm text-muted-foreground line-through">
                ${originalPrice.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;