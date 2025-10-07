import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ProductDetailModal from "@/components/ProductDetailModal";
import Cart from "@/components/Cart";
import ProductGrid from "@/components/ProductGrid";
import { ArrowRight } from "lucide-react";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import AccessibilityMenu from "@/components/AccessibilityMenu";

interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
  quantity: number;
}

interface ProductVariant {
  id_variante: number;
  id_producto: number;
  id_talla: number;
  codigo_sku: string;
  stock: number;
  precio_ajuste: number;
}

interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  category: string;
  created_at?: string;
  products_variants?: ProductVariant[];
  variants?: ProductVariant[];
}

const Index = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isFavoritesModalOpen, setIsFavoritesModalOpen] = useState(false);
  const { toast } = useToast();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
        // Traer productos con join a products_variants
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select(`
            id,
            name,
            description,
            price,
            image_url,
            category,
            created_at,
            products_variants (
              id_variante,
              id_producto,
              id_talla,
              codigo_sku,
              stock,
              precio_ajuste
            )
          `);

        if (productsError) throw productsError;

        // Transformar para que todos tengan variants
        const featured = productsData?.map(product => ({
          ...product,
          variants: Array.isArray(product.products_variants)
            ? product.products_variants
            : []
        })) || [];
  console.log('[DEBUG] featuredProducts:', featured);
  setFeaturedProducts(featured);
      } catch (error) {
        toast({ title: 'Error al cargar productos', description: error?.message, variant: 'destructive' });
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchProducts();
  }, [toast]);

  const handleAddToCart = (product: Product) => {
    setCartItems(prev => {
      const existingItem = prev.find(item => item.id === product.id);
      
      // Create cart item from product
      const cartItem: CartItem = {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image_url || '',
        category: product.category,
        quantity: 1
      };
      
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
        return [...prev, cartItem];
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

  const handleProductClick = (product: Product) => {
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

            {loadingProducts ? (
              <div className="text-center py-8 text-muted-foreground">Cargando productos...</div>
            ) : featuredProducts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No hay productos disponibles.</div>
            ) : (
              <ProductGrid products={featuredProducts} onAddToCart={handleAddToCart} />
            )}

            <div className="text-center mt-12">
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
        product={selectedProduct ? {
          ...selectedProduct,
          rating: 4.5, // Valor por defecto
          image: selectedProduct.image_url
        } : null}
        onAddToCart={handleAddToCart}
      />

      <AccessibilityMenu />
    </div>
  );
};

export default Index;
