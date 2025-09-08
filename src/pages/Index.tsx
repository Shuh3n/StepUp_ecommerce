
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ProductDetailModal from "@/components/ProductDetailModal";
import ContactModal from "@/components/ContactModal";
import FavoritesModal from "@/components/FavoritesModal";
import AccessibilityMenu from "@/components/AccessibilityMenu";

import Cart from "@/components/Cart";
import ProductCard from "@/components/ProductCard";
import { ArrowRight } from "lucide-react";
import product1 from "@/assets/products/product-1.jpg";
import product2 from "@/assets/products/product-2.jpg";
import product3 from "@/assets/products/product-3.jpg";

interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
  quantity: number;
}

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

const Index = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isFavoritesModalOpen, setIsFavoritesModalOpen] = useState(false);
  const { toast } = useToast();
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true);
      const { data, error } = await supabase.from('products').select('*');
      if (!error && data) {
        setFeaturedProducts(data);
      } else {
        toast({ title: 'Error al cargar productos', description: error?.message, variant: 'destructive' });
      }
      setLoadingProducts(false);
    };
    fetchProducts();
  }, []);

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
        onFavoritesClick={() => setIsFavoritesModalOpen(true)}
      />
      
      <main className="pt-16">
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
              {loadingProducts ? (
                <div className="col-span-4 text-center py-8 text-muted-foreground">Cargando productos...</div>
              ) : featuredProducts.length === 0 ? (
                <div className="col-span-4 text-center py-8 text-muted-foreground">No hay productos disponibles.</div>
              ) : (
                featuredProducts.map((product, index) => (
                  <div
                    key={product.id}
                    className="animate-fade-in-up"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <a href={`/producto/${product.id}`} className="block">
                      <ProductCard
                        {...product}
                        image={product.image_url}
                        onAddToCart={handleAddToCart}
                      />
                    </a>
                  </div>
                ))
              )}
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

      <FavoritesModal
        isOpen={isFavoritesModalOpen}
        onClose={() => setIsFavoritesModalOpen(false)}
        onAddToCart={handleAddToCart}
      />

      <AccessibilityMenu />
    </div>
  );
};

export default Index;
