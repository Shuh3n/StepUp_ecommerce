import { useState, useEffect, useMemo } from "react";
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
  id: number;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
  category: string; // uuid
  id_category: string; // uuid (para filtros)
  category_name: string;
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

// Carga categorías y filtra solo válidas
async function fetchCategoriesFromEdge(): Promise<{ id: string; name: string }[]> {
  try {
    const res = await fetch("https://xrflzmovtmlfrjhtoejs.supabase.co/functions/v1/get-categories");
    const result = await res.json();
    if (result.ok && Array.isArray(result.categories)) {
      return result.categories.filter((c: any) => c.id && c.name);
    }
    return [];
  } catch {
    return [];
  }
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
  const [categoriesMap, setCategoriesMap] = useState<Record<string, string>>({});
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

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

  // Carga productos, variantes y tallas en paralelo
  useEffect(() => {
    setLoadingProducts(true);
    supabase
      .from('products')
      .select(`
        id,
        name,
        description,
        price,
        image_url,
        created_at,
        category,
        categories (
          name
        ),
        products_variants (
          id_variante,
          id_producto,
          id_talla,
          codigo_sku,
          stock,
          precio_ajuste
        )
      `)
      .order('id', { ascending: false })
      .then(async ({ data: productsData, error: productsError }) => {
        if (productsError || !productsData) {
          setProducts([]);
          toast({
            title: 'Error al cargar productos',
            description: productsError?.message || 'No se pudieron cargar los productos.',
            variant: 'destructive'
          });
          setLoadingProducts(false);
          return;
        }

        // Trae tallas aparte
        const { data: sizesData } = await supabase.from('sizes').select('*');

        // Mapea productos para incluir el nombre de la categoría y variantes con talla
        const transformedProducts = productsData.map(product => {
          const variants = (product.products_variants || []).map(variant => ({
            ...variant,
            size: (sizesData || []).find(s => s.id_talla === variant.id_talla)
          }));
          return {
            ...product,
            category_name: product.categories?.name || 'Sin categoría',
            variants
          };
        });
        setProducts(transformedProducts);
        setLoadingProducts(false);
      });
  }, [toast]);

  // Carga categorías
  useEffect(() => {
    setLoadingCategories(true);
    supabase
      .from('categories')
      .select('id, name')
      .order('name', { ascending: true })
      .then(({ data, error }) => {
        if (error || !data) {
          setCategories([]);
        } else {
          setCategories(data);
        }
        setLoadingCategories(false);
      });
  }, []);

  // Memoiza maxPrice
  const maxPrice = useMemo(
    () => products.reduce((max, p) => Math.max(max, p.price), 0),
    [products]
  );

  // Productos filtrados y ordenados - CORREGIDO
  const sortedProducts = useMemo(() => {
    console.log('🔍 Aplicando filtros:', {
      selectedCategory,
      priceRange,
      selectedSizes,
      totalProducts: products.length
    });

    const filtered = products.filter(product => {
      // CORREGIDO: Usar product.category en lugar de product.id_category
      const categoryMatch = selectedCategory === "all" || product.category === selectedCategory;
      
      const priceMatch = product.price >= priceRange[0] && product.price <= priceRange[1];
      
      const sizeMatch = selectedSizes.length === 0 ||
        product.variants?.some(v =>
          v.size && selectedSizes.includes(v.size.nombre_talla?.trim() || '') && v.stock > 0
        );

      console.log(`Producto ${product.name}:`, {
        category: product.category,
        categoryMatch,
        priceMatch,
        sizeMatch,
        passes: categoryMatch && priceMatch && sizeMatch
      });

      return categoryMatch && priceMatch && sizeMatch;
    });

    console.log(`✅ Productos filtrados: ${filtered.length} de ${products.length}`);

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        default:
          return b.id - a.id;
      }
    });
  }, [products, selectedCategory, priceRange, selectedSizes, sortBy]);

  // Handlers de carrito - CORREGIDO
  const handleAddToCart = (product: Product) => {
    setCartItems(prev => {
      const existingItem = prev.find(item => item.id === product.id);
      const cartItem: CartItem = {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image_url || '',
        category: product.category_name, // CORREGIDO: Usar category_name
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

  // Arma categorías para el filtro, siempre incluye "Todas"
  const categoriesForFilters = useMemo(() => {
    return [{ id: "all", name: "Todas" }, ...categories];
  }, [categories]);

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
                  allCategoryId={"all"}
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
                        id={product.id}
                        name={product.name}
                        price={product.price}
                        image={product.image_url}
                        category={product.category_name}
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