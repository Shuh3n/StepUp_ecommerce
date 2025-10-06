import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import ProductCard from "@/components/ProductCard";
import ProductFilters from "@/components/ProductFilters";
import Navbar from "@/components/Navbar";
import Cart from "@/components/Cart";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useNavigate } from 'react-router-dom';

interface Size {
  id_talla: number;
  talla: string;
}

interface ProductVariant {
  id_variante: number;
  id_producto: number;
  id_talla: number;
  codigo_sku: string;
  stock: number;
  precio_ajuste: number;
  size?: Size;
}

interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  category: string;
  created_at?: string;
  updated_at?: string;
  variants: ProductVariant[];
}

export interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
  quantity: number;
}

const Products = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 150000]);
  const [sortBy, setSortBy] = useState("newest");
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Update the useEffect to fetch only products first
  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
        // Fetch products first
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*');

        if (productsError) throw productsError;

        // Fetch all variants separately
        const { data: variantsData, error: variantsError } = await supabase
          .from('products_variants')
          .select('*');

        if (variantsError) throw variantsError;

        console.log('Products data:', productsData);
        console.log('Variants data:', variantsData);

        // Transform the data to use codigo_sku as the size directly
        const transformedProducts = productsData?.map(product => ({
          ...product,
          variants: (variantsData || [])
            .filter(variant => variant.id_producto === product.id)
            .map((variant: ProductVariant) => ({
              ...variant,
              size: {
                id_talla: variant.id_talla,
                talla: variant.codigo_sku // Use codigo_sku directly as the size
              }
            }))
        })) || [];

        setProducts(transformedProducts);
      } catch (error: any) {
        console.error('Error fetching products:', error);
        toast({ 
          title: 'Error al cargar productos', 
          description: error.message, 
          variant: 'destructive' 
        });
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, [toast]);

  const categories = ["all", ...Array.from(new Set(products.map(p => p.category)))];

  // Update the product filtering to consider variants
  const filteredProducts = products.filter(product => {
    const categoryMatch = selectedCategory === "all" || product.category === selectedCategory;
    const priceMatch = product.price >= priceRange[0] && product.price <= priceRange[1];
    const sizeMatch = selectedSizes.length === 0 || 
      product.variants?.some(v => 
        v.size && selectedSizes.includes(v.size.talla) && v.stock > 0
      ) || false;
    return categoryMatch && priceMatch && sizeMatch;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return a.price - b.price;
      case "price-high":
        return b.price - a.price;
      default:
        return b.id - a.id; // newest first
    }
  });

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

  const handleClearFilters = () => {
    setSelectedCategory("all");
    setPriceRange([0, 150000]);
    setSelectedSizes([]);
    setSortBy("newest");
  };

  const handleProductClick = (product: Product) => {
    console.log('Navigating to product:', product); // Debug log
    navigate(`/productos/${product.id}`);
  };

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-background">
      // En tu componente Layout o padre
      <Navbar 
        cartItems={totalItems}
        onCartClick={() => setIsCartOpen(true)}
        onContactClick={() => {}} // Pass empty function if not needed
        onFavoritesClick={() => {}} // Pass empty function if not needed
      />
      
      <main className="pt-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4">
              <span className="gradient-text">Todos los</span> Productos
            </h1>
            <p className="text-muted-foreground text-lg">
              Descubre toda nuestra colección de moda juvenil - {sortedProducts.length} productos encontrados
            </p>
          </div>

          {/* Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Filters Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <ProductFilters
                  categories={categories}
                  selectedCategory={selectedCategory}
                  onCategoryChange={setSelectedCategory}
                  priceRange={priceRange}
                  onPriceRangeChange={setPriceRange}
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                  selectedSizes={selectedSizes}
                  onSizeChange={setSelectedSizes}
                  onClearFilters={handleClearFilters}
                />
              </div>
            </div>

            {/* Products Grid */}
            <div className="lg:col-span-3">
              {loadingProducts ? (
                <div className="text-center py-16">
                  <p>Cargando productos...</p>
                </div>
              ) : sortedProducts.length === 0 ? (
                <div className="text-center py-16">
                  <h3 className="text-2xl font-medium mb-4">No se encontraron productos</h3>
                  <p className="text-muted-foreground mb-6">
                    Intenta ajustar tus filtros para encontrar lo que buscas
                  </p>
                  <button
                    onClick={handleClearFilters}
                    className="text-primary hover:underline"
                  >
                    Limpiar todos los filtros
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {sortedProducts.map((product, index) => (
                    <div
                      key={product.id}
                      className="animate-fade-in-up"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <ProductCard
                        {...product}
                        image={product.image_url}
                        onAddToCart={() => handleAddToCart(product)} // Changed this line
                        onClick={() => handleProductClick(product)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Cart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
      />
    </div>
  );
};

export default Products;

