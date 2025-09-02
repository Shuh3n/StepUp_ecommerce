import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import ProductCard from "@/components/ProductCard";
import ProductFilters from "@/components/ProductFilters";
import ProductDetailModal from "@/components/ProductDetailModal";
import Navbar from "@/components/Navbar";
import Cart from "@/components/Cart";
import product1 from "@/assets/products/product-1.jpg";
import product2 from "@/assets/products/product-2.jpg";
import product3 from "@/assets/products/product-3.jpg";

interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  rating: number;
  isNew?: boolean;
  sizes: string[];
}

interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
  quantity: number;
}

const allProducts: Product[] = [
  {
    id: 1,
    name: "Camiseta Urban Turquoise",
    price: 25000,
    originalPrice: 35000,
    image: product1,
    category: "Camisetas",
    rating: 4.8,
    isNew: true,
    sizes: ["S", "M", "L", "XL"],
  },
  {
    id: 2,
    name: "Hoodie Coral Vibes",
    price: 75000,
    image: product2,
    category: "Hoodies",
    rating: 4.9,
    isNew: true,
    sizes: ["M", "L", "XL", "XXL"],
  },
  {
    id: 3,
    name: "Jeans Black Edition",
    price: 85000,
    originalPrice: 100000,
    image: product3,
    category: "Pantalones",
    rating: 4.7,
    sizes: ["S", "M", "L", "XL"],
  },
  {
    id: 4,
    name: "Camiseta Street Style",
    price: 30000,
    image: product1,
    category: "Camisetas",
    rating: 4.6,
    sizes: ["XS", "S", "M", "L"],
  },
  {
    id: 5,
    name: "Hoodie Oversized",
    price: 80000,
    image: product2,
    category: "Hoodies",
    rating: 4.8,
    sizes: ["L", "XL", "XXL"],
  },
  {
    id: 6,
    name: "Jeans Slim Fit",
    price: 70000,
    originalPrice: 85000,
    image: product3,
    category: "Pantalones",
    rating: 4.5,
    sizes: ["S", "M", "L", "XL"],
  },
  {
    id: 7,
    name: "Camiseta Basic White",
    price: 20000,
    image: product1,
    category: "Camisetas",
    rating: 4.4,
    sizes: ["XS", "S", "M", "L", "XL"],
  },
  {
    id: 8,
    name: "Hoodie Neon Green",
    price: 90000,
    originalPrice: 110000,
    image: product2,
    category: "Hoodies",
    rating: 4.7,
    isNew: true,
    sizes: ["M", "L", "XL"],
  },
  {
    id: 9,
    name: "Jeans Ripped Style",
    price: 95000,
    image: product3,
    category: "Pantalones",
    rating: 4.6,
    sizes: ["S", "M", "L"],
  },
  {
    id: 10,
    name: "Camiseta Graphic Tee",
    price: 35000,
    image: product1,
    category: "Camisetas",
    rating: 4.5,
    isNew: true,
    sizes: ["S", "M", "L", "XL", "XXL"],
  },
  {
    id: 11,
    name: "Hoodie Premium Cotton",
    price: 120000,
    originalPrice: 140000,
    image: product2,
    category: "Hoodies",
    rating: 4.9,
    sizes: ["M", "L", "XL"],
  },
  {
    id: 12,
    name: "Jeans Wide Leg",
    price: 110000,
    image: product3,
    category: "Pantalones",
    rating: 4.8,
    isNew: true,
    sizes: ["S", "M", "L", "XL"],
  },
];

const Products = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 150000]);
  const [sortBy, setSortBy] = useState("newest");
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const { toast } = useToast();

  const categories = ["all", ...Array.from(new Set(allProducts.map(p => p.category)))];

  const filteredProducts = allProducts.filter(product => {
    const categoryMatch = selectedCategory === "all" || product.category === selectedCategory;
    const priceMatch = product.price >= priceRange[0] && product.price <= priceRange[1];
    const sizeMatch = selectedSizes.length === 0 || selectedSizes.some(size => product.sizes.includes(size));
    
    return categoryMatch && priceMatch && sizeMatch;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return a.price - b.price;
      case "price-high":
        return b.price - a.price;
      case "rating":
        return b.rating - a.rating;
      default:
        return b.id - a.id; // newest first
    }
  });

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

  const handleClearFilters = () => {
    setSelectedCategory("all");
    setPriceRange([0, 150000]);
    setSelectedSizes([]);
    setSortBy("newest");
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
              {sortedProducts.length === 0 ? (
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
                        onAddToCart={handleAddToCart}
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

      <ProductDetailModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        product={selectedProduct}
        onAddToCart={handleAddToCart}
      />
    </div>
  );
};

export default Products;