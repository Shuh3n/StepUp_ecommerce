import { useState, useEffect } from "react";
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
  categories?: CategoryOption[];
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
  allCategoryId?: string;
  sizes?: string[];
}

const ProductFilters = ({
  categories = [], // USAR LAS CATEGORÍAS PASADAS COMO PROP
  selectedCategory,
  onCategoryChange,
  priceRange,
  onPriceRangeChange,
  sortBy,
  onSortChange,
  selectedSizes,
  onSizeChange,
  onClearFilters,
  maxPrice = 300000,
  allCategoryId = "all",
  sizes: sizesProp,
}: ProductFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // Prefer DB-provided sizes; fallback to common list
  const sizes = sizesProp && sizesProp.length > 0 ? sizesProp : ["S", "M", "L", "XL"];

  const handleSizeToggle = (size: string) => {
    const newSizes = selectedSizes.includes(size)
      ? selectedSizes.filter(s => s !== size)
      : [...selectedSizes, size];
    onSizeChange(newSizes);
  };

  const hasActiveFilters = selectedCategory !== allCategoryId || 
                          priceRange[0] > 0 || 
                          priceRange[1] < maxPrice || 
                          selectedSizes.length > 0;

  const handleClearAllFilters = () => {
    onCategoryChange(allCategoryId);
    onPriceRangeChange([0, maxPrice]);
    onSizeChange([]);
    onSortChange("newest");
    if (onClearFilters) {
      onClearFilters();
    }
  };

  const handleCategoryChange = (categoryId: string) => {
    console.log('🏷️ Categoría seleccionada:', categoryId);
    console.log('📋 Categorías disponibles:', categories);
    onCategoryChange(categoryId);
  };

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
        {/* Header with Clear All */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Filtros</h3>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAllFilters}
              className="text-xs"
            >
              Limpiar todo
            </Button>
          )}
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
          <Select value={selectedCategory} onValueChange={handleCategoryChange}>
            <SelectTrigger className="rounded-xl glass border-white/20">
              <SelectValue placeholder="Seleccionar categoría" />
            </SelectTrigger>
            <SelectContent>
              {categories.length === 0 ? (
                <SelectItem value="no-categories" disabled>No hay categorías disponibles</SelectItem>
              ) : (
                categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {selectedCategory !== allCategoryId && (
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>
                Filtrando por: {categories.find(c => c.id === selectedCategory)?.name || 'Categoría'}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCategoryChange(allCategoryId)}
                className="text-xs h-6"
              >
                Quitar
              </Button>
            </div>
          )}
        </div>

        {/* Price Range */}
        <div className="space-y-4">
          <h4 className="font-medium">Rango de precio</h4>
          <div className="px-2">
            <Slider
              value={priceRange}
              onValueChange={onPriceRangeChange}
              min={0}
              max={maxPrice}
              step={Math.max(1000, Math.round(maxPrice / 50))}
              className="w-full"
            />
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>${priceRange[0].toLocaleString()}</span>
            <span>${priceRange[1].toLocaleString()}</span>
          </div>
          {(priceRange[0] > 0 || priceRange[1] < maxPrice) && (
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onPriceRangeChange([0, maxPrice])}
                className="text-xs h-6"
              >
                Limpiar rango
              </Button>
            </div>
          )}
        </div>

        {/* Sizes */}
        <div className="space-y-3">
          <h4 className="font-medium">Tallas</h4>
          <div className="grid grid-cols-2 gap-2">
            {sizes.map((size, idx) => (
              <div key={`${size}-${idx}`} className="flex items-center space-x-2">
                <Checkbox
                  id={`size-${size}-${idx}`}
                  checked={selectedSizes.includes(size)}
                  onCheckedChange={() => handleSizeToggle(size)}
                />
                <label
                  htmlFor={`size-${size}-${idx}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {size}
                </label>
              </div>
            ))}
          </div>
          {selectedSizes.length > 0 && (
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>{selectedSizes.length} talla(s) seleccionada(s)</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSizeChange([])}
                className="text-xs h-6"
              >
                Limpiar
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductFilters;

