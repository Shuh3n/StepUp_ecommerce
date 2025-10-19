import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import ProductCard from "@/components/ProductCard";
import ProductFilters from "@/components/ProductFilters";
import Navbar from "@/components/Navbar";
import Cart from "@/components/Cart";
import FavoritesModal from "@/components/FavoritesModal";
import { getFavoritesFromEdgeRaw } from "@/lib/api/favorites";
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
  [x: string]: any;
  id: number;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  id_category: string; // uuid
  category_name: string;
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
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000000]);
  const [sortBy, setSortBy] = useState("newest");
  const [favoritesMap, setFavoritesMap] = useState<Record<number, boolean>>({});

  // Carga favoritos
  const refreshFavorites = async () => {
    const favorites = await getFavoritesFromEdgeRaw();
    const map: Record<number, boolean> = {};
    favorites.forEach((fav: any) => {
      map[fav.product_id] = true;
    });
    setFavoritesMap(map);
  };

  useEffect(() => {
    refreshFavorites();
  }, []);

  // Carga productos de supabase
  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .order('id', { ascending: false });

        if (productsError) throw productsError;
        if (!productsData || productsData.length === 0) {
          setProducts([]);
          return;
        }

        const { data: variantsData } = await supabase
          .from('products_variants')
          .select('*');
        const { data: sizesData, error: sizesError } = await supabase
          .from('sizes')
          .select('*');
        if (sizesError) {
          // Continuar sin tallas si hay error
        }

        const transformedProducts = productsData?.map(product => {
          const productVariants = (variantsData || [])
            .filter(variant => variant.id_producto === product.id)
            .map(variant => {
              const size = sizesData?.find(s => s.id_talla === variant.id_talla);
              return { ...variant, size };
            });
          return { ...product, variants: productVariants };
        }) || [];
        setProducts(transformedProducts);
      } catch (error: any) {
        toast({
          title: 'Error al cargar productos',
          description: `No se pudieron cargar los productos. ${error.message || 'Error desconocido'}`,
          variant: 'destructive'
        });
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchProducts();
  }, [toast]);

  // Categories para filtros
  const categoriesForFilters = ["all", ...Array.from(new Set(products.map(p => p.category_name || p.category || "Sin categoría")))];

  // Filtrado de productos
  const filteredProducts = products.filter(product => {
    const categoryMatch = selectedCategory === "all" || product.category_name === selectedCategory;
    const priceMatch = product.price >= priceRange[0] && product.price <= priceRange[1];
    const sizeMatch = selectedSizes.length === 0 ||
      product.variants?.some(v =>
        v.size && selectedSizes.includes(v.size.nombre_talla?.trim() || '') && v.stock > 0
      );
    return categoryMatch && priceMatch && sizeMatch;
  });

  // Ordenamiento
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return a.price - b.price;
      case "price-high":
        return b.price - a.price;
      default:
        return b.id - a.id;
    }
  });

  // Calcular precio máximo para filtro
  const maxPrice = products.reduce((max, p) => Math.max(max, p.price), 0);

  // Handlers de carrito
  const handleAddToCart = (product: Product) => {
    setCartItems(prev => {
      const existingItem = prev.find(item => item.id === product.id);
      const cartItem: CartItem = {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image_url || '',
        category: product.category_name || '',
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
    setPriceRange([0, maxPrice]);
    setSelectedSizes([]);
    setSortBy("newest");
  };

  const handleProductClick = (product: Product) => {
    navigate(`/productos/${product.id}`);
  };

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-background">
      <Navbar
        cartItems={totalItems}
        onCartClick={() => setIsCartOpen(true)}
        onContactClick={() => {}}
        onFavoritesClick={() => setIsFavoritesOpen(true)}
      />

      <main className="pt-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4">
              <span className="gradient-text">Todos los</span> Productos
            </h1>
            <p className="text-muted-foreground text-lg">
              Descubre toda nuestra colección de moda juvenil - {sortedProducts.length} productos encontrados de {products.length} totales
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <ProductFilters
                  categories={categoriesForFilters}
                  selectedCategory={selectedCategory}
                  onCategoryChange={setSelectedCategory}
                  priceRange={priceRange}
                  onPriceRangeChange={setPriceRange}
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                  selectedSizes={selectedSizes}
                  onSizeChange={setSelectedSizes}
                  onClearFilters={handleClearFilters}
                  maxPrice={maxPrice}
                  allCategoryId={undefined}
                />
              </div>
            </div>

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
                        key={product.id}
                        id={product.id}
                        name={product.name}
                        price={product.price}
                        image={product.image_url}
                        category={product.category_name || ''}
                        variants={product.variants || []}
                        description={product.description}
                        created_at={product.created_at}
                        onAddToCart={() => handleAddToCart(product)}
                        onClick={() => handleProductClick(product)}
                        isFavorite={!!favoritesMap[product.id]}
                        onFavoriteChange={refreshFavorites}
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

      <FavoritesModal
        isOpen={isFavoritesOpen}
        onClose={() => setIsFavoritesOpen(false)}
        onFavoritesChange={refreshFavorites}
      />
    </div>
  );
};

export default Products;
