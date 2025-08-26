import { useState } from "react";
import ProductCard from "./ProductCard";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter } from "lucide-react";
import product1 from "@/assets/product-1.jpg";
import product2 from "@/assets/product-2.jpg";
import product3 from "@/assets/product-3.jpg";

interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  rating: number;
  isNew?: boolean;
}

const initialProducts: Product[] = [
  {
    id: 1,
    name: "Camiseta Urban Turquoise",
    price: 25000,
    originalPrice: 35000,
    image: product1,
    category: "Camisetas",
    rating: 4.8,
    isNew: true,
  },
  {
    id: 2,
    name: "Hoodie Coral Vibes",
    price: 75000,
    image: product2,
    category: "Hoodies",
    rating: 4.9,
    isNew: true,
  },
  {
    id: 3,
    name: "Jeans Black Edition",
    price: 85000,
    originalPrice: 100000,
    image: product3,
    category: "Pantalones",
    rating: 4.7,
  },
  {
    id: 4,
    name: "Camiseta Street Style",
    price: 30000,
    image: product1,
    category: "Camisetas",
    rating: 4.6,
  },
  {
    id: 5,
    name: "Hoodie Oversized",
    price: 80000,
    image: product2,
    category: "Hoodies",
    rating: 4.8,
  },
  {
    id: 6,
    name: "Jeans Slim Fit",
    price: 70000,
    originalPrice: 85000,
    image: product3,
    category: "Pantalones",
    rating: 4.5,
  },
];

interface ProductGridProps {
  onAddToCart: (product: any) => void;
}

const ProductGrid = ({ onAddToCart }: ProductGridProps) => {
  const [products] = useState<Product[]>(initialProducts);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");

  const categories = ["all", ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = products.filter(product => 
    selectedCategory === "all" || product.category === selectedCategory
  );

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

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">
            <span className="gradient-text">Productos</span> Destacados
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Descubre nuestra colección de ropa juvenil con los últimos trends y estilos urbanos
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-8 p-6 glass rounded-2xl">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <span className="text-muted-foreground">Filtros:</span>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-[180px] rounded-xl glass border-white/20">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {categories.slice(1).map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-[180px] rounded-xl glass border-white/20">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Más nuevos</SelectItem>
                <SelectItem value="price-low">Precio: Menor a mayor</SelectItem>
                <SelectItem value="price-high">Precio: Mayor a menor</SelectItem>
                <SelectItem value="rating">Mejor valorados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedProducts.map((product, index) => (
            <div
              key={product.id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <ProductCard
                {...product}
                onAddToCart={onAddToCart}
              />
            </div>
          ))}
        </div>

        {/* Load More Button */}
        <div className="text-center mt-12">
          <Button variant="floating" size="lg" className="px-8">
            Cargar Más Productos
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ProductGrid;