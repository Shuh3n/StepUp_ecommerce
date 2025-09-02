import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Star, Heart, ShoppingBag, Minus, Plus } from "lucide-react";
import Navbar from "@/components/Navbar";
import AccessibilityMenu from "@/components/AccessibilityMenu";
import product1 from "@/assets/products/product-1.jpg";
import product2 from "@/assets/products/product-2.jpg";
import product3 from "@/assets/products/product-3.jpg";

const allProducts = [
  {
    id: 1,
    name: "Camiseta Urban Orange",
    price: 25000,
    originalPrice: 35000,
    image: product1,
    category: "Camisetas",
    rating: 4.8,
    isNew: true,
    description: "Camiseta de algodón premium con diseño urbano. Perfecta para un look casual y moderno. Fabricada con materiales de alta calidad que garantizan comodidad y durabilidad.",
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["Naranja", "Negro", "Blanco"],
    features: ["100% Algodón", "Diseño exclusivo", "Lavable en máquina", "Talla ajustada"],
  },
  {
    id: 2,
    name: "Hoodie Fire Edition",
    price: 75000,
    image: product2,
    category: "Hoodies",
    rating: 4.9,
    isNew: true,
    description: "Hoodie con capucha de alta calidad. Comodidad y estilo en una sola prenda. Ideal para climas fríos o para un look urbano relajado.",
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: ["Rojo", "Negro", "Gris"],
    features: ["Capucha ajustable", "Bolsillo canguro", "Forro suave", "Corte regular"],
  },
  {
    id: 3,
    name: "Jeans Black Edition",
    price: 85000,
    originalPrice: 100000,
    image: product3,
    category: "Pantalones",
    rating: 4.7,
    description: "Jeans de corte clásico con acabado premium. Durabilidad y comodidad garantizada. Perfecto para cualquier ocasión, desde casual hasta semi-formal.",
    sizes: ["28", "30", "32", "34", "36", "38"],
    colors: ["Negro", "Azul Oscuro"],
    features: ["Denim premium", "5 bolsillos", "Corte slim fit", "Resistente al desgaste"],
  },
  {
    id: 4,
    name: "Camiseta Street Style",
    price: 30000,
    image: product1,
    category: "Camisetas",
    rating: 4.6,
    description: "Camiseta de diseño exclusivo con estampado street. Para quienes no necesitan permiso para pisar fuerte. Expresa tu personalidad con este diseño único.",
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["Blanco", "Negro", "Naranja"],
    features: ["Estampado exclusivo", "Algodón suave", "Diseño urbano", "Tallas disponibles"],
  },
];

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [product, setProduct] = useState<any>(null);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    const productId = parseInt(id || "1");
    const foundProduct = allProducts.find(p => p.id === productId);
    if (foundProduct) {
      setProduct(foundProduct);
      setSelectedSize(foundProduct.sizes?.[0] || "");
      setSelectedColor(foundProduct.colors?.[0] || "");
    }
  }, [id]);

  useEffect(() => {
    if (product) {
      const favorites = JSON.parse(localStorage.getItem('stepup-favorites') || '[]');
      setIsLiked(favorites.some((fav: any) => fav.id === product.id));
    }
  }, [product]);

  const toggleFavorite = () => {
    if (!product) return;
    
    const favorites = JSON.parse(localStorage.getItem('stepup-favorites') || '[]');
    
    if (isLiked) {
      const updatedFavorites = favorites.filter((fav: any) => fav.id !== product.id);
      localStorage.setItem('stepup-favorites', JSON.stringify(updatedFavorites));
      toast({
        title: "Eliminado de favoritos",
        description: `${product.name} se eliminó de tus favoritos`,
      });
    } else {
      const updatedFavorites = [...favorites, product];
      localStorage.setItem('stepup-favorites', JSON.stringify(updatedFavorites));
      toast({
        title: "Agregado a favoritos",
        description: `${product.name} se agregó a tus favoritos`,
      });
    }
    
    setIsLiked(!isLiked);
  };

  const handleAddToCart = () => {
    if (!product) return;
    
    toast({
      title: "Producto agregado",
      description: `${quantity}x ${product.name} se agregó al carrito`,
    });
  };

  if (!product) {
    return <div>Producto no encontrado</div>;
  }

  const discount = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar cartItems={0} onCartClick={() => {}} />
      
      <main className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Product Image */}
            <div className="relative">
              <Card className="overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-[600px] object-cover"
                />
                
                {/* Badges */}
                <div className="absolute top-6 left-6 flex flex-col gap-2">
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

                {/* Favorite Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className={`absolute top-6 right-6 rounded-full ${
                    isLiked ? "text-red-500 bg-white/90" : "text-gray-600 bg-white/90"
                  } hover:bg-white`}
                  onClick={toggleFavorite}
                >
                  <Heart className={`h-5 w-5 ${isLiked ? "fill-current" : ""}`} />
                </Button>
              </Card>
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <Badge variant="outline" className="mb-3">
                  {product.category}
                </Badge>
                
                <h1 className="text-4xl font-bold text-card-foreground mb-4">
                  {product.name}
                </h1>

                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-1">
                    <Star className="h-5 w-5 text-yellow-400 fill-current" />
                    <span className="font-medium">{product.rating}</span>
                  </div>
                  <span className="text-muted-foreground">(128 reseñas)</span>
                </div>

                <div className="flex items-center gap-4 mb-6">
                  <span className="text-4xl font-bold text-primary">
                    ${product.price.toLocaleString()}
                  </span>
                  {product.originalPrice && (
                    <span className="text-2xl text-muted-foreground line-through">
                      ${product.originalPrice.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Descripción</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Features */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Características</h3>
                <ul className="grid grid-cols-2 gap-2">
                  {product.features.map((feature: string, index: number) => (
                    <li key={index} className="flex items-center text-sm text-muted-foreground">
                      <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Size Selection */}
              {product.sizes && (
                <div>
                  <h3 className="font-semibold text-lg mb-3">Talla</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((size: string) => (
                      <Button
                        key={size}
                        variant={selectedSize === size ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedSize(size)}
                        className="min-w-[60px]"
                      >
                        {size}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Color Selection */}
              {product.colors && (
                <div>
                  <h3 className="font-semibold text-lg mb-3">Color</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.colors.map((color: string) => (
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

              {/* Quantity */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Cantidad</h3>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="text-xl font-medium min-w-[3rem] text-center">
                    {quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Add to Cart */}
              <div className="pt-4">
                <Button
                  onClick={handleAddToCart}
                  className="w-full bg-gradient-stepup hover:shadow-red transition-all duration-300"
                  size="lg"
                >
                  <ShoppingBag className="h-5 w-5 mr-2" />
                  Agregar al Carrito - ${(product.price * quantity).toLocaleString()}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <AccessibilityMenu />
    </div>
  );
};

export default ProductDetail;