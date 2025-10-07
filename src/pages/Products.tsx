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
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 300000]); // Valor inicial temporal
  const [sortBy, setSortBy] = useState("newest");
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [maxPrice, setMaxPrice] = useState(300000); // Estado para el precio máximo dinámico

  // Update the useEffect to fetch only products first
  useEffect(() => {
    let productsChannel: ReturnType<typeof supabase.channel> | null = null;
    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
        console.log('[DEBUG] Iniciando fetchProducts...');
        
        // Primero obtenemos todos los productos (incluyendo los inactivos para debugging)
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .order('id', { ascending: false });

        console.log('[DEBUG] Productos obtenidos:', productsData?.length || 0);
        console.log('[DEBUG] Datos de productos:', productsData);
        
        if (productsError) {
          console.error('[DEBUG] Error al obtener productos:', productsError);
          throw productsError;
        }

        if (!productsData || productsData.length === 0) {
          console.warn('[DEBUG] No se encontraron productos en la base de datos');
          setProducts([]);
          return;
        }

        // Luego obtenemos las variantes para cada producto
        const { data: variantsData, error: variantsError } = await supabase
          .from('products_variants')
          .select('*');

        console.log('[DEBUG] Variantes obtenidas:', variantsData?.length || 0);

        if (variantsError) {
          console.warn('[DEBUG] Error al obtener variantes:', variantsError);
          // Continuamos sin variantes si hay error
        }

        // Obtenemos las tallas
        const { data: sizesData, error: sizesError } = await supabase
          .from('sizes')
          .select('*');

        console.log('[DEBUG] Tallas obtenidas:', sizesData?.length || 0);

        if (sizesError) {
          console.warn('[DEBUG] Error al obtener tallas:', sizesError);
        }

        // Transformamos los datos para incluir variantes y tallas
        const transformedProducts = productsData.map(product => {
          const productVariants = variantsData?.filter(v => v.id_producto === product.id) || [];
          
          const variantsWithSizes = productVariants.map(variant => ({
            ...variant,
            size: sizesData?.find(size => size.id_talla === variant.id_talla) || null
          }));

          return {
            ...product,
            variants: variantsWithSizes
          };
        }).filter(product => {
          // Filtrar solo productos activos (si existe el campo active)
          // Si no existe el campo, asumir que está activo
          return product.active !== false;
        });

        console.log('[DEBUG] Productos transformados:', transformedProducts.length);
        console.log('[DEBUG] Ejemplo de producto transformado:', transformedProducts[0]);
        
        // Calcular precio máximo dinámicamente
        if (transformedProducts.length > 0) {
          const calculatedMaxPrice = Math.max(...transformedProducts.map(p => p.price));
          const roundedMaxPrice = Math.ceil(calculatedMaxPrice / 50000) * 50000; // Redondear hacia arriba a múltiplos de 50k
          setMaxPrice(roundedMaxPrice);
          
          // Solo actualizar el rango de precio si es la primera carga (inicial)
          if (priceRange[1] === 300000) { // Valor inicial
            setPriceRange([0, roundedMaxPrice]);
          }
          
          console.log('[DEBUG] Precio máximo calculado:', roundedMaxPrice);
        }
        
        setProducts(transformedProducts);
      } catch (error: unknown) {
        console.error('[DEBUG] Error completo en fetchProducts:', error);
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        toast({ 
          title: 'Error al cargar productos', 
          description: errorMessage, 
          variant: 'destructive' 
        });
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();

    // Suscripción en tiempo real a la tabla products
    productsChannel = supabase
      .channel('products-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        (payload) => {
          console.log('[Realtime] Cambio detectado en products:', payload);
          fetchProducts();
        }
      )
      .subscribe();

    return () => {
      if (productsChannel) {
        supabase.removeChannel(productsChannel);
      }
    };
  }, [toast, priceRange]);

  const categories = ["all", ...Array.from(new Set(products.map(p => p.category)))];

  // Permitir mostrar productos aunque no tengan variantes
  const filteredProducts = products.filter(product => {
    const categoryMatch = selectedCategory === "all" || product.category === selectedCategory;
    const priceMatch = product.price >= priceRange[0] && product.price <= priceRange[1];
    
    // Mejorar el filtro de tallas para incluir productos sin variantes
    let sizeMatch = true;
    if (selectedSizes.length > 0) {
      if (product.variants && product.variants.length > 0) {
        // Si tiene variantes, verificar que al menos una coincida con la talla seleccionada
        sizeMatch = product.variants.some(v => v.size && selectedSizes.includes(v.size.talla) && v.stock > 0);
      } else {
        // Si no tiene variantes y hay filtros de talla activos, aún mostrar el producto
        // porque es mejor mostrar productos sin variantes que ocultarlos completamente
        sizeMatch = true; // Cambiado de false a true para mostrar productos sin variantes
      }
    }
    
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
    setPriceRange([0, maxPrice]); // Usar el precio máximo dinámico
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
              Descubre toda nuestra colección de moda juvenil - {sortedProducts.length} productos encontrados de {products.length} totales
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
                  maxPrice={maxPrice} // Pasar el precio máximo dinámico
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
                        id={product.id}
                        name={product.name}
                        price={product.price}
                        image={product.image_url}
                        category={product.category}
                        variants={product.variants || []}
                        onAddToCart={() => handleAddToCart(product)}
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

