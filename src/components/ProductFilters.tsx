import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Filter, X } from "lucide-react";

interface CategoryOption {
  id: string;
  name: string;
}
interface ProductFiltersProps {
  categories: CategoryOption[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  priceRange: [number, number];
  onPriceRangeChange: (range: [number, number]) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  selectedSizes: string[];
  onSizeChange: (sizes: string[]) => void;
  onClearFilters?: () => void;
  maxPrice?: number;
  // Optional: id of the category that represents "All/Todas" in DB
  allCategoryId?: string;
  // Optional: size labels to render (from DB)
  sizes?: string[];
}

const ProductFilters = ({
  categories,
  selectedCategory,
  onCategoryChange,
  priceRange,
  onPriceRangeChange,
  sortBy,
  onSortChange,
  selectedSizes,
  onSizeChange,
  onClearFilters,
  maxPrice = 300000, // Nuevo prop con valor por defecto
  allCategoryId,
  sizes: sizesProp,
}: ProductFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);
  // Prefer DB-provided sizes; fallback to common list
  const sizes = sizesProp && sizesProp.length > 0 ? sizesProp : [ "S", "M", "L", "XL" ];

  const handleSizeToggle = (size: string) => {
    const newSizes = selectedSizes.includes(size)
      ? selectedSizes.filter(s => s !== size)
      : [...selectedSizes, size];
    onSizeChange(newSizes);
  };

  const defaultAllId = allCategoryId ?? "all";
  const hasActiveFilters = selectedCategory !== defaultAllId || 
                          priceRange[0] > 0 || 
                          priceRange[1] < maxPrice || 
                          selectedSizes.length > 0;
  

  return (
    <div className="space-y-6">
      {/* Mobile Filter Toggle */}
      <div className="lg:hidden">
        <Button
          variant="glass"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full justify-between"
        >
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros
            {hasActiveFilters && (
              <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                Activos
              </span>
            )}
          </div>
          <X className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </Button>
      </div>

      {/* Filters Panel */}
      <div className={`space-y-6 ${isOpen ? "block" : "hidden lg:block"}`}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Filtros</h3>
        </div>

        {/* Sort */}
        <div className="space-y-3">
          <h4 className="font-medium">Ordenar por</h4>
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className="rounded-xl glass border-white/20">
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

        {/* Categories */}
        <div className="space-y-3">
          <h4 className="font-medium">Categorías</h4>
          <Select value={selectedCategory} onValueChange={onCategoryChange}>
            <SelectTrigger className="rounded-xl glass border-white/20">
              <SelectValue placeholder="Seleccionar categoría" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Price Range */}
        <div className="space-y-4">
          <h4 className="font-medium">Rango de precio</h4>
          <div className="px-2">
            <Slider
              value={priceRange}
              onValueChange={(value) => onPriceRangeChange(value as [number, number])}
              max={maxPrice}
              min={0}
              step={5000}
              className="w-full"
            />
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>${priceRange[0].toLocaleString()}</span>
            <span>${priceRange[1].toLocaleString()}</span>
          </div>
        </div>

        {/* Sizes */}
        <div className="space-y-3">
          <h4 className="font-medium">Tallas</h4>
          <div className="grid grid-cols-3 gap-2">
            {sizes.map(size => (
              <div key={size} className="flex items-center space-x-2">
                <Checkbox
                  id={size}
                  checked={selectedSizes.includes(size)}
                  onCheckedChange={() => handleSizeToggle(size)}
                />
                <label
                  htmlFor={size}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {size}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Color Filter */}
        <div className="space-y-3">
          <h4 className="font-medium">Colores</h4>
          <div className="grid grid-cols-4 gap-2">
            {[
              { name: "Negro", color: "bg-black" },
              { name: "Blanco", color: "bg-white border border-gray-300" },
              { name: "Turquesa", color: "bg-primary" },
              { name: "Coral", color: "bg-secondary" },
              { name: "Azul", color: "bg-blue-500" },
              { name: "Verde", color: "bg-green-500" },
              { name: "Rosa", color: "bg-pink-500" },
              { name: "Gris", color: "bg-gray-500" },
            ].map(({ name, color }) => (
              <button
                key={name}
                className={`w-8 h-8 rounded-full ${color} border-2 border-transparent hover:border-primary transition-all`}
                title={name}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductFilters;