import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";

interface ProductVariant {
  id_variante: number;
  id_producto: number;
  id_talla: number;
  codigo_sku: string;
  stock: number;
  precio_ajuste: number;
}

interface ProductCardProps {
  id: number;
  name: string;
  price: number;
  image?: string;
  category: string;
  variants?: ProductVariant[];
  onAddToCart?: () => void; // Changed to function with no parameters
  onClick?: () => void;
}

const ProductCard = ({
  id,
  name,
  price,
  image,
  category,
  variants,
  onAddToCart,
  onClick,
}: ProductCardProps) => {
  // Si no hay variantes, consideramos que el producto está disponible (para productos sin variants)
  const hasStock = !variants || variants.length === 0 || variants.some((variant) => variant.stock > 0);

  return (
    <div
      className="group relative flex flex-col rounded-xl bg-background transition-all hover:shadow-xl cursor-pointer"
      onClick={onClick}
    >
      {/* Image Container - Modified to fill edges */}
      <div className="aspect-square overflow-hidden bg-muted rounded-t-xl">
        <img
          src={image || "/images/placeholder.png"}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      {/* Content Container */}
      <div className="min-h-[160px] bg-black flex flex-col justify-between p-6 rounded-b-xl">
        <div className="space-y-2">
          {/* Category */}
          <p className="text-sm text-gray-300">{category}</p>

          {/* Product Name */}
          <h3 className="font-medium text-lg line-clamp-1 text-white">
            {name}
          </h3>
        </div>

        {/* Price and Cart Button - Updated */}
        <div className="flex items-center justify-between pt-2">
          <p className="text-xl font-bold text-white">
            ${price.toLocaleString()}
          </p>

          {onAddToCart && (
            <Button
              variant="secondary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation(); // Prevent triggering onClick (product detail)
                onAddToCart(); // Call without parameters
              }}
              disabled={!hasStock}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white"
            >
              <ShoppingCart className="h-4 w-4" />
              Agregar
            </Button>
          )}
        </div>

        {/* Out of Stock Badge */}
        {variants && variants.length > 0 && !variants.some((variant) => variant.stock > 0) && (
          <div className="absolute top-4 right-4 z-10 bg-red-500 text-white px-3 py-1 rounded-md text-sm">
            Agotado
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;