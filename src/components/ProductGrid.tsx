import { useState } from "react";
import ProductCard from "./ProductCard";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter } from "lucide-react";
import product1 from "@/assets/product-1.jpg";
import product2 from "@/assets/product-2.jpg";
import product3 from "@/assets/product-3.jpg";

interface ProductGridProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
}

interface Product {
  id: number;
  name: string;
  price: number;
  image_url?: string;
  image?: string;
  category: string;
}

const ProductGrid = ({ products, onAddToCart }: ProductGridProps) => {
  return (
    <div className="w-full flex justify-center">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl">
        {products.map((product, index) => (
          <div
            key={product.id}
            className="animate-fade-in-up"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <ProductCard
              {...product}
              image={product.image_url || product.image}
              onAddToCart={() => onAddToCart(product)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductGrid;