import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import ProductCard from "@/components/ProductCard";
import ProductFilters from "@/components/ProductFilters";
import Navbar from "@/components/Navbar";
import Cart from "@/components/Cart";
import { supabase } from "@/lib/supabase";
import { useNavigate } from 'react-router-dom';

interface Size {
  id_talla: number;
  nombre_talla: string;
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

  // First, define categories
  const categories = ["all", ...Array.from(new Set(products.map(p => p.category)))];

  // Then define filteredProducts
  const filteredProducts = products.filter(product => {
    const categoryMatch = selectedCategory === "all" || product.category === selectedCategory;
    const priceMatch = product.price >= priceRange[0] && product.price <= priceRange[1];
    const sizeMatch = selectedSizes.length === 0 || 
      product.variants?.some(v => 
        v.size && selectedSizes.includes(v.size.nombre_talla?.trim() || '') && v.stock > 0
      ) || false;
    return categoryMatch && priceMatch && sizeMatch;
  });

  // Then define sortedProducts
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

  // Move the useEffect for fetching products here (before the logging useEffect)
  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
        console.log('🔄 Starting to fetch products...');
        console.log('🔗 Supabase URL:', supabase.supabaseUrl);

        // Fetch products directly without the count test
        console.log('📦 Fetching products...');
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .order('id', { ascending: false });

        if (productsError) {
          console.error('❌ Error fetching products:', productsError);
          console.error('❌ Full error object:', {
            message: productsError.message,
            details: productsError.details,
            hint: productsError.hint,
            code: productsError.code
          });
          throw productsError;
        }

        console.log('✅ Products fetched successfully:', productsData?.length || 0, 'products');
        console.log('📦 Raw products data:', productsData);

        // Verify specific products exist
        const expectedIds = [11, 12, 14, 15];
        expectedIds.forEach(id => {
          const found = productsData?.find(p => p.id === id);
          console.log(`🔍 Product ${id}:`, found ? '✅ Found' : '❌ Missing', found?.name || 'N/A');
        });

        // Fetch variants with simpler query
        console.log('📦 Fetching variants...');
        const { data: variantsData, error: variantsError } = await supabase
          .from('products_variants')
          .select('*');

        if (variantsError) {
          console.error('❌ Error fetching variants:', variantsError);
          console.warn('⚠️ Continuing without variants data');
        } else {
          console.log('✅ Variants fetched successfully:', variantsData?.length || 0, 'variants');
          console.log('📦 Variants data:', variantsData);
        }

        // Fetch sizes separately
        console.log('📦 Fetching sizes...');
        const { data: sizesData, error: sizesError } = await supabase
          .from('sizes')
          .select('*');

        if (sizesError) {
          console.error('❌ Error fetching sizes:', sizesError);
          console.warn('⚠️ Continuing without sizes data');
        } else {
          console.log('✅ Sizes fetched successfully:', sizesData?.length || 0, 'sizes');
          console.log('📦 Sizes data:', sizesData);
        }

        // Transform products with their variants and sizes
        const transformedProducts = productsData?.map(product => {
          const productVariants = (variantsData || [])
            .filter(variant => variant.id_producto === product.id)
            .map(variant => {
              // Manually join with sizes
              const size = sizesData?.find(s => s.id_talla === variant.id_talla);
              return {
                ...variant,
                size: size
              };
            });
          
          console.log(`📦 Product ${product.id} (${product.name}) has ${productVariants.length} variants`);
          
          return {
            ...product,
            variants: productVariants
          };
        }) || [];

        console.log('✅ Final transformed products:', transformedProducts.length);
        console.log('📦 Final products list:', transformedProducts.map(p => ({ 
          id: p.id, 
          name: p.name, 
          category: p.category,
          variantsCount: p.variants?.length || 0
        })));

        setProducts(transformedProducts);
      } catch (error: any) {
        console.error('💥 Error in fetchProducts:', error);
        
        toast({ 
          title: 'Error al cargar productos', 
          description: `No se pudieron cargar los productos. ${error.message || 'Error desconocido'}`, 
          variant: 'destructive' 
        });
      } finally {
        setLoadingProducts(false);
        console.log('🏁 fetchProducts completed');
      }
    };

    fetchProducts();
  }, [toast]);

  // Now the logging useEffect with correct dependencies
  useEffect(() => {
    console.log('🔍 Filter applied:');
    console.log('  - Category:', selectedCategory);
    console.log('  - Price range:', priceRange);
    console.log('  - Selected sizes:', selectedSizes);
    console.log('  - Sort by:', sortBy);
    console.log('  - Total products:', products.length);
    console.log('  - Filtered products count:', filteredProducts.length);
    console.log('  - Sorted products count:', sortedProducts.length);
  }, [selectedCategory, priceRange, selectedSizes, sortBy, products.length, filteredProducts.length, sortedProducts.length]);

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

