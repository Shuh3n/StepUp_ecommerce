import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { addFavorite, removeFavorite } from "@/lib/api/favorites";

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
  onAddToCart: () => void;
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
  const [localIsFavorite, setLocalIsFavorite] = useState(isFavorite);

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

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hasVariants || !hasStock) {
      onClick();
    } else {
      onAddToCart();
    }
  };

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setFavoriteLoading(true);
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

  return (
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
          disabled={buttonProps.disabled}
          variant={buttonProps.variant}
          className="w-full mt-auto"
          size="sm"
        >
          {buttonProps.text}
        </Button>
      </div>
    </div>
  );
};

export default ProductCard;