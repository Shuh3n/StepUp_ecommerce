import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Cart from "@/components/Cart";
import { ArrowLeft, Plus, Minus } from "lucide-react";
import { supabase } from '@/lib/supabase';

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
  variants: ProductVariant[];
}

export interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
  quantity: number;
  selectedSize: string;
  variantId: number;
}

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      
      try {
        console.log('Fetching product with ID:', id);

        // Get product data
        const { data: productOnly, error: productOnlyError } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single();

        if (productOnlyError) {
          console.error('Product fetch error:', productOnlyError);
          throw productOnlyError;
        }

        console.log('Product data:', productOnly);

        // Get variants data
        const { data: variantsData, error: variantsError } = await supabase
          .from('products_variants')
          .select('*')
          .eq('id_producto', id);

        if (variantsError) {
          console.error('Variants fetch error:', variantsError);
          throw variantsError;
        }

        console.log('Raw variants data:', variantsData);

        // Get sizes data
        const { data: sizesData, error: sizesError } = await supabase
          .from('sizes')
          .select('*');

        if (sizesError) {
          console.error('Sizes fetch error:', sizesError);
          throw sizesError;
        }

        console.log('Sizes data:', sizesData);

        // Manually join the data
        const variantsWithSizes = variantsData?.map(variant => {
          const size = sizesData?.find(s => s.id_talla === variant.id_talla);
          return {
            ...variant,
            size: size
          };
        }) || [];

        console.log('Variants with sizes (manual join):', variantsWithSizes);

        // Transform the product with variants and size data
        const transformedProduct = {
          ...productOnly,
          variants: variantsWithSizes
        };

        console.log('Transformed product:', transformedProduct);
        
        setProduct(transformedProduct);
      } catch (error: any) {
        console.error('Detailed error:', error);
        toast({
          title: 'Error al cargar el producto',
          description: error.message || 'No se pudo cargar el producto',
          variant: 'destructive',
        });
        navigate('/productos');
      } finally {
        setLoading(false);
      }
    };

    if (id && !isNaN(Number(id))) {
      fetchProduct();
    }
  }, [id, navigate, toast]);

  // Calculate total items for cart badge
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  

  // Get available sizes with stock
  const getAvailableSizes = (): Array<{name: string; stock: number; variant: ProductVariant}> => {
    if (!product?.variants) {
      console.log('No product variants available');
      return [];
    }

    const availableSizes = product.variants
      .filter(variant => {
        console.log('Checking variant:', variant);
        console.log('Stock:', variant.stock, 'Type:', typeof variant.stock);
        console.log('Size:', variant.size);
        
        const hasStock = Number(variant.stock) > 0;
        const hasSize = variant.size && variant.size.nombre_talla;
        
        console.log('Has stock:', hasStock, 'Has size:', hasSize);
        
        return hasStock && hasSize;
      })
      .map(variant => ({
        name: variant.size!.nombre_talla.trim(),
        stock: Number(variant.stock),
        variant
      }));

    console.log('Available sizes:', availableSizes);
    return availableSizes;
  };

  // Get selected variant by size
  const getVariantBySize = (sizeName: string): ProductVariant | null => {
    if (!product?.variants) return null;
    
    return product.variants.find(variant => 
      variant.size && variant.size.nombre_talla.trim() === sizeName.trim()
    ) || null;
  };

  // Get max stock for selected size
  const getMaxStock = (): number => {
    if (!selectedSize) return 0;
    const variant = getVariantBySize(selectedSize);
    return variant ? variant.stock : 0;
  };

  // Handle quantity change
  const handleQuantityChange = (delta: number) => {
    const maxStock = getMaxStock();
    const newQuantity = selectedQuantity + delta;
    
    if (newQuantity >= 1 && newQuantity <= maxStock) {
      setSelectedQuantity(newQuantity);
    }
  };

  // Reset quantity when size changes
  useEffect(() => {
    setSelectedQuantity(1);
  }, [selectedSize]);

  // Handle add to cart with quantity control
  const handleAddToCart = () => {
    if (!selectedSize) {
      toast({
        title: "Selecciona una talla",
        description: "Por favor, selecciona una talla antes de agregar al carrito",
        variant: "destructive",
      });
      return;
    }

    const variant = getVariantBySize(selectedSize);
    if (!variant || variant.stock <= 0) {
      toast({
        title: "Sin stock",
        description: "Esta talla no tiene stock disponible",
        variant: "destructive",
      });
      return;
    }

    // Check current cart quantity for this item+size combination
    const existingCartItem = cartItems.find(item => 
      item.id === product!.id && item.selectedSize === selectedSize
    );
    
    const currentCartQuantity = existingCartItem ? existingCartItem.quantity : 0;
    const totalQuantity = currentCartQuantity + selectedQuantity;

    if (totalQuantity > variant.stock) {
      toast({
        title: "Stock insuficiente",
        description: `Solo hay ${variant.stock} unidades disponibles. Ya tienes ${currentCartQuantity} en el carrito.`,
        variant: "destructive",
      });
      return;
    }

    const newItem: CartItem = {
      id: product!.id,
      name: product!.name,
      price: product!.price + (variant.precio_ajuste || 0),
      image: product!.image_url || '',
      category: product!.category,
      quantity: selectedQuantity,
      selectedSize: selectedSize,
      variantId: variant.id_variante
    };

    setCartItems(prev => {
      if (existingCartItem) {
        return prev.map(item =>
          item.id === newItem.id && item.selectedSize === newItem.selectedSize
            ? { ...item, quantity: item.quantity + selectedQuantity }
            : item
        );
      }
      return [...prev, newItem];
    });

    toast({
      title: "Producto agregado",
      description: `${selectedQuantity} x ${product!.name} (${selectedSize}) agregado al carrito`,
    });

    // Reset quantity
    setSelectedQuantity(1);
  };

  // Handle cart updates
  const handleUpdateQuantity = (id: number, newQuantity: number, selectedSize?: string) => {
    if (newQuantity <= 0) {
      handleRemoveItem(id, selectedSize);
      return;
    }

    // Find the variant to check stock
    const variant = product?.variants.find(v => 
      v.size && v.size.nombre_talla.trim() === selectedSize?.trim()
    );

    if (variant && newQuantity > variant.stock) {
      toast({
        title: "Stock insuficiente",
        description: `Solo hay ${variant.stock} unidades disponibles`,
        variant: "destructive",
      });
      return;
    }

    setCartItems(prev =>
      prev.map(item =>
        item.id === id && item.selectedSize === selectedSize
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const handleRemoveItem = (id: number, selectedSize?: string) => {
    setCartItems(prev =>
      prev.filter(item => !(item.id === id && item.selectedSize === selectedSize))
    );
  };

  const handleChangeSizeInCart = (id: number, oldSize: string, newSize: string) => {
    const item = cartItems.find(item => item.id === id && item.selectedSize === oldSize);
    if (!item) return;

    // Find the new variant
    const newVariant = product?.variants.find(v => 
      v.size && v.size.nombre_talla.trim() === newSize.trim()
    );

    if (!newVariant) {
      toast({
        title: "Error",
        description: "Talla no disponible",
        variant: "destructive",
      });
      return;
    }

    // Check if there's already an item with the new size
    const existingItemWithNewSize = cartItems.find(existingItem => 
      existingItem.id === id && existingItem.selectedSize === newSize
    );

    if (existingItemWithNewSize) {
      // Merge quantities
      const totalQuantity = existingItemWithNewSize.quantity + item.quantity;
      
      if (totalQuantity > newVariant.stock) {
        toast({
          title: "Stock insuficiente",
          description: `Solo hay ${newVariant.stock} unidades disponibles en talla ${newSize}`,
          variant: "destructive",
        });
        return;
      }

      setCartItems(prev => prev
        .filter(cartItem => !(cartItem.id === id && cartItem.selectedSize === oldSize))
        .map(cartItem => 
          cartItem.id === id && cartItem.selectedSize === newSize
            ? { ...cartItem, quantity: totalQuantity }
            : cartItem
        )
      );
    } else {
      // Check stock for new size
      if (item.quantity > newVariant.stock) {
        toast({
          title: "Stock insuficiente",
          description: `Solo hay ${newVariant.stock} unidades disponibles en talla ${newSize}`,
          variant: "destructive",
        });
        return;
      }

      // Update the item with new size and price
      setCartItems(prev =>
        prev.map(cartItem =>
          cartItem.id === id && cartItem.selectedSize === oldSize
            ? { 
                ...cartItem, 
                selectedSize: newSize,
                price: product!.price + (newVariant.precio_ajuste || 0),
                variantId: newVariant.id_variante
              }
            : cartItem
        )
      );
    }

    toast({
      title: "Talla actualizada",
      description: `Talla cambiada de ${oldSize} a ${newSize}`,
    });
  };

  const availableSizes = getAvailableSizes();
  const hasStock = availableSizes.length > 0;
  const maxStock = getMaxStock();

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar 
          cartItems={totalItems}
          onCartClick={() => setIsCartOpen(true)}
          onContactClick={() => {}}
          onFavoritesClick={() => {}}
        />
        <div className="pt-24 px-4 flex items-center justify-center">
          <p className="text-lg">Cargando producto...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar 
          cartItems={totalItems}
          onCartClick={() => setIsCartOpen(true)}
          onContactClick={() => {}}
          onFavoritesClick={() => {}}
        />
        <div className="pt-24 px-4 flex flex-col items-center justify-center gap-4">
          <p className="text-xl">Producto no encontrado</p>
          <Button onClick={() => navigate('/productos')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Productos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar 
        cartItems={totalItems}
        onCartClick={() => setIsCartOpen(true)}
        onContactClick={() => {}}
        onFavoritesClick={() => {}}
      />

      <main className="w-[60%] mx-auto pt-24 px-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/productos')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Productos
        </Button>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Product Image */}
          <div className="aspect-square rounded-xl overflow-hidden bg-muted">
            <img
              src={product.image_url || '/placeholder.png'}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div className="space-y-2">
              <p className="text-sm uppercase tracking-wider text-muted-foreground">
                {product.category}
              </p>
              <h1 className="text-3xl font-bold">{product.name}</h1>
              <p className="text-2xl font-bold text-primary">
                ${product.price.toLocaleString()}
              </p>
            </div>

            {product.description && (
              <div className="prose prose-sm">
                <p>{product.description}</p>
              </div>
            )}

            {/* Size Selection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Tallas disponibles</h3>
                {selectedSize && (
                  <span className="text-sm text-muted-foreground">
                    Seleccionada: {selectedSize} (Stock: {maxStock})
                  </span>
                )}
              </div>

              {hasStock ? (
                <div className="grid grid-cols-4 gap-2">
                  {availableSizes.map((sizeInfo) => (
                    <button
                      key={sizeInfo.name}
                      onClick={() => setSelectedSize(sizeInfo.name)}
                      className={`
                        p-3 rounded-lg border-2 text-center transition-all
                        ${selectedSize === sizeInfo.name
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border hover:border-primary/50'
                        }
                      `}
                    >
                      <div className="font-semibold">{sizeInfo.name}</div>
                      <div className="text-xs opacity-75">
                        Stock: {sizeInfo.stock}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No hay tallas disponibles</p>
                  <p className="text-destructive text-sm">Producto agotado</p>
                </div>
              )}
            </div>

            {/* Quantity Selection */}
            {selectedSize && maxStock > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Cantidad</h3>
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={selectedQuantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  
                  <span className="text-xl font-semibold w-12 text-center">
                    {selectedQuantity}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleQuantityChange(1)}
                    disabled={selectedQuantity >= maxStock}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  
                  <span className="text-sm text-muted-foreground">
                    de {maxStock} disponibles
                  </span>
                </div>
              </div>
            )}

            {/* Add to Cart Button */}
            <Button
              onClick={handleAddToCart}
              disabled={!hasStock || !selectedSize}
              className="w-full"
              size="lg"
            >
              {!hasStock 
                ? 'Producto Agotado'
                : !selectedSize 
                ? 'Selecciona una talla'
                : `Agregar ${selectedQuantity} al Carrito`
              }
            </Button>
          </div>
        </div>
      </main>

      <Cart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onChangeSizeInCart={handleChangeSizeInCart}
        availableSizes={availableSizes}
      />
    </div>
  );
};

export default ProductDetail;