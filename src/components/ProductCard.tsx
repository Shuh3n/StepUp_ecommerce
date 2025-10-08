import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
  onClick
}: ProductCardProps) => {
  // Determinar el estado del stock
  const hasVariants = variants && variants.length > 0;
  const hasStock = hasVariants 
    ? variants.some(v => Number(v.stock) > 0) 
    : false; // Cambié de true a false - si no hay variantes, no hay stock

  // Determinar si es un producto nuevo (menos de 5 días)
  const isNew = () => {
    if (!created_at) return false;
    const createdDate = new Date(created_at);
    const currentDate = new Date();
    const daysDifference = (currentDate.getTime() - createdDate.getTime()) / (1000 * 3600 * 24);
    return daysDifference <= 5;
  };

  // Debug para todos los productos problemáticos
  if (name.toLowerCase().includes('pantalon') || name.toLowerCase().includes('hoddie') || name.toLowerCase().includes('camiseta')) {
    console.log(`🔍 DEBUG ${name}:`, {
      hasVariants,
      hasStock,
      variantsLength: variants.length,
      variantsDetail: variants.map(v => ({ 
        stock: v.stock, 
        stockType: typeof v.stock,
        stockNumber: Number(v.stock),
        sku: v.codigo_sku 
      })),
      stockCheck: variants.some(v => Number(v.stock) > 0),
      isNew: isNew()
    });
  }

  // Determinar el texto y estado del botón
  const getButtonProps = () => {
    if (!hasVariants) {
      return {
        text: 'Sin Variantes',
        disabled: true,
        variant: 'outline' as const
      };
    }
    
    if (hasStock) {
      return {
        text: 'Agregar',
        disabled: false,
        variant: 'default' as const
      };
    }
    
    return {
      text: 'Agotado',
      disabled: true,
      variant: 'outline' as const
    };
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

  return (
    <div 
      className="glass rounded-xl overflow-hidden border border-white/20 hover:border-white/40 transition-all duration-300 cursor-pointer group h-full flex flex-col"
      onClick={onClick}
    >
      {/* Imagen sin badges */}
      <div className="relative aspect-square overflow-hidden">
        <img
          src={image || '/placeholder.png'}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
      </div>

      {/* Contenido con altura flexible */}
      <div className="p-4 flex flex-col flex-grow">
        {/* Todas las etiquetas encima del nombre */}
        <div className="flex flex-wrap gap-1 mb-2">
          {/* Category Badge - siempre visible */}
          <Badge variant="outline" className="bg-black/50 text-white border-white/20 text-xs">
            {category}
          </Badge>
          
          {/* New Badge */}
          {isNew() && (
            <Badge variant="secondary" className="bg-gradient-to-r from-purple-500/80 to-pink-500/80 text-white border-0 text-xs font-medium">
              ✨ Nuevo
            </Badge>
          )}
          
          {/* Stock Badges */}
          {hasVariants ? (
            // Si tiene variantes, mostrar estado de stock
            hasStock ? (
              <Badge variant="secondary" className="bg-green-500/80 text-white text-xs">
                En Stock
              </Badge>
            ) : (
              <Badge variant="destructive" className="bg-red-500/80 text-white text-xs">
                🚫 Agotado
              </Badge>
            )
          ) : (
            // Si no tiene variantes, mostrar que no está configurado
            <Badge variant="secondary" className="bg-gray-500/80 text-white text-xs">
              Sin Configurar
            </Badge>
          )}
        </div>

        {/* Información del producto */}
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

        {/* Precio y información de stock */}
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

        {/* Botón siempre en la parte inferior */}
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