
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ProductDetailModal from "@/components/ProductDetailModal";
import ContactModal from "@/components/ContactModal";
import AccessibilityMenu from "@/components/AccessibilityMenu";
import StepUpLogo from "@/components/StepUpLogo";

import Cart from "@/components/Cart";
import ProductCard from "@/components/ProductCard";
import { ArrowRight } from "lucide-react";
import product1 from "@/assets/product-1.jpg";
import product2 from "@/assets/product-2.jpg";
import product3 from "@/assets/product-3.jpg";

interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
  quantity: number;
}

const featuredProducts = [
  {
    id: 1,
    name: "Camiseta Urban Orange",
    price: 25000,
    originalPrice: 35000,
    image: product1,
    category: "Camisetas",
    rating: 4.8,
    isNew: true,
    description: "Camiseta de algodón premium con diseño urbano. Perfecta para un look casual y moderno.",
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["Naranja", "Negro", "Blanco"],
  },
  {
    id: 2,
    name: "Hoodie Fire Edition",
    price: 75000,
    image: product2,
    category: "Hoodies",
    rating: 4.9,
    isNew: true,
    description: "Hoodie con capucha de alta calidad. Comodidad y estilo en una sola prenda.",
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: ["Rojo", "Negro", "Gris"],
  },
  {
    id: 3,
    name: "Jeans Black Edition",
    price: 85000,
    originalPrice: 100000,
    image: product3,
    category: "Pantalones",
    rating: 4.7,
    description: "Jeans de corte clásico con acabado premium. Durabilidad y comodidad garantizada.",
    sizes: ["28", "30", "32", "34", "36", "38"],
    colors: ["Negro", "Azul Oscuro"],
  },
  {
    id: 4,
    name: "Camiseta Street Style",
    price: 30000,
    image: product1,
    category: "Camisetas",
    rating: 4.6,
    description: "Camiseta de diseño exclusivo con estampado street. Para quienes no necesitan permiso para pisar fuerte.",
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["Blanco", "Negro", "Naranja"],
  },
];

const Index = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const { toast } = useToast();

  const handleAddToCart = (product: any) => {
    setCartItems(prev => {
      const existingItem = prev.find(item => item.id === product.id);
      
      if (existingItem) {
        toast({
          title: "Producto actualizado",
          description: `Se aumentó la cantidad de ${product.name}`,
        });
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        toast({
          title: "Producto agregado",
          description: `${product.name} se agregó al carrito`,
        });
        return [...prev, { ...product, quantity: 1 }];
      }
    });
  };

  const handleUpdateQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(id);
      return;
    }
    
    setCartItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveItem = (id: number) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
    toast({
      title: "Producto eliminado",
      description: "El producto se eliminó del carrito",
    });
  };

  const handleProductClick = (product: any) => {
    setSelectedProduct(product);
    setIsProductModalOpen(true);
  };

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-background">
      <Navbar 
        cartItems={totalItems} 
        onCartClick={() => setIsCartOpen(true)}
        onContactClick={() => setIsContactModalOpen(true)}
      />
      
      <main className="pt-16">
        {/* Step Up Logo Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-stepup">
          <div className="max-w-4xl mx-auto text-center">
            <StepUpLogo />
          </div>
        </section>
        
        <Hero />
        
        {/* Featured Products Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">
                <span className="gradient-text">Productos</span> Destacados
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Descubre algunos de nuestros productos más populares
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {featuredProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div onClick={() => handleProductClick(product)} className="cursor-pointer">
                    <ProductCard
                      {...product}
                      onAddToCart={handleAddToCart}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center">
              <Button 
                variant="hero" 
                size="lg" 
                className="px-8"
                onClick={() => window.location.href = '/productos'}
              >
                Más Productos
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Cart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
      />

      <ProductDetailModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        product={selectedProduct}
        onAddToCart={handleAddToCart}
      />

      <ContactModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
      />

      <AccessibilityMenu />
    </div>
  );
};

export default Index;
