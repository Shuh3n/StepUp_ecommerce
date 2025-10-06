import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Cart from "@/components/Cart";
import { ArrowLeft } from "lucide-react";
import { supabase } from '@/lib/supabase';

interface Size {
  id_talla: number;
  talla: string;  // S, M, L, etc.
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
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      
      try {
        console.log('Fetching product with ID:', id);

        // Get product and variants separately to avoid relation issues
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

        // Get variants separately
        const { data: variantsData, error: variantsError } = await supabase
          .from('products_variants')
          .select('*')
          .eq('id_producto', id);

        if (variantsError) {
          console.error('Variants fetch error:', variantsError);
          throw variantsError;
        }

        console.log('Variants data:', variantsData);

        // Transform the data to use codigo_sku as the size
        const transformedProduct = {
          ...productOnly,
          variants: (variantsData || []).map((variant: any) => {
            console.log('Processing variant:', variant);
            return {
              ...variant,
              size: {
                id_talla: variant.id_talla,
                talla: variant.codigo_sku // Use codigo_sku directly as the size
              }
            };
          })
        };

        console.log('Transformed product:', transformedProduct);
        console.log('Product variants:', transformedProduct.variants);
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
    } else {
      console.error('Invalid ID:', id);
      toast({
        title: 'Error',
        description: 'ID de producto inválido',
        variant: 'destructive',
      });
      navigate('/productos');
    }
  }, [id, navigate, toast]);

  // Calculate total items for cart badge
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

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

  // Function to get available sizes from variants
  const getAvailableSizes = () => {
    if (!product?.variants) {
      return [];
    }
    
    const availableSizes = product.variants
      .filter(variant => {
        const hasValidStock = variant.stock && Number(variant.stock) > 0;
        const hasValidSize = variant.size && variant.size.talla;
        return hasValidStock && hasValidSize;
      })
      .map(variant => variant.size!.talla)
      .filter((size, index, self) => self.indexOf(size) === index) // Remove duplicates
      .sort();
    
    return availableSizes;
  };

  // Function to check if variant has stock
  const hasStock = (variant: ProductVariant) => {
    return Number(variant.stock) > 0;
  };

  // Function to get variant by size
  const getVariantBySize = (size: string) => {
    return product?.variants.find(v => v.size?.talla === size);
  };

  // Function to handle size selection
  const handleSizeSelect = (size: string) => {
    const variant = getVariantBySize(size);
    if (variant && hasStock(variant)) {
      setSelectedSize(size);
    }
  };

  // Function to add product to cart
  const handleAddToCart = () => {
    if (!product || !selectedSize) return;
    
    const variant = getVariantBySize(selectedSize);
    if (!variant || !hasStock(variant)) {
      toast({
        title: "Error",
        description: "No hay stock disponible para esta talla",
        variant: "destructive",
      });
      return;
    }

    const cartItem: CartItem = {
      id: product.id,
      name: product.name,
      price: product.price + (variant.precio_ajuste || 0),
      image: product.image_url || '',
      category: product.category,
      quantity: 1,
      selectedSize: selectedSize,
      variantId: variant.id_variante
    };

    setCartItems(prev => {
      const existingItem = prev.find(item => 
        item.id === product.id && item.selectedSize === selectedSize
      );
      
      if (existingItem) {
        toast({
          title: "Producto actualizado",
          description: `Se aumentó la cantidad de ${product.name} talla ${selectedSize}`,
        });
        return prev.map(item =>
          item.id === product.id && item.selectedSize === selectedSize
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        toast({
          title: "Producto agregado",
          description: `${product.name} talla ${selectedSize} se agregó al carrito`,
        });
        return [...prev, cartItem];
      }
    });
  };

  // Functions to handle cart operations
  const handleUpdateQuantity = (id: number, quantity: number, selectedSize: string) => {
    if (quantity <= 0) {
      handleRemoveItem(id, selectedSize);
      return;
    }
    
    setCartItems(prev =>
      prev.map(item =>
        item.id === id && item.selectedSize === selectedSize
          ? { ...item, quantity }
          : item
      )
    );
  };

  const handleRemoveItem = (id: number, selectedSize: string) => {
    setCartItems(prev => prev.filter(item => 
      !(item.id === id && item.selectedSize === selectedSize)
    ));
    toast({
      title: "Producto eliminado",
      description: "El producto se eliminó del carrito",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar 
        cartItems={totalItems}
        onCartClick={() => setIsCartOpen(true)}
        onContactClick={() => {}}
        onFavoritesClick={() => {}}
      />

      <main className="w-[60%] mx-auto pt-24 px-4"> {/* Changed from container to w-[60%] */}
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
                <p className="font-medium">Tallas disponibles</p>
                <p className="text-sm text-muted-foreground">
                  {selectedSize ? `Talla seleccionada: ${selectedSize}` : 'Selecciona una talla'}
                </p>
              </div>
              
              {getAvailableSizes().length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">No hay tallas disponibles</p>
                  <p className="text-sm text-destructive">Producto agotado</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {getAvailableSizes().map(size => {
                    const variant = getVariantBySize(size);
                    const isAvailable = variant && hasStock(variant);
                    
                    return (
                      <Button
                        key={size}
                        variant={selectedSize === size ? "default" : "outline"}
                        onClick={() => handleSizeSelect(size)}
                        disabled={!isAvailable}
                        className="min-w-[4rem] relative"
                      >
                        {size}
                        {variant && (
                          <span className="absolute -top-2 -right-2 text-xs">
                            <span className="bg-primary/20 text-primary px-1 rounded-full">
                              {variant.stock}
                            </span>
                          </span>
                        )}
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>

            <Button 
              size="lg" 
              className="w-full"
              onClick={handleAddToCart}
              disabled={!selectedSize || !getVariantBySize(selectedSize)?.stock || getAvailableSizes().length === 0}
            >
              {getAvailableSizes().length === 0
                ? 'Producto Agotado'
                : !selectedSize 
                  ? 'Selecciona una talla' 
                  : !getVariantBySize(selectedSize)?.stock 
                    ? 'Agotado'
                    : 'Agregar al Carrito'
              }
            </Button>
          </div>
        </div>
      </main>

      <Cart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={(id, quantity, selectedSize) => {
          if (selectedSize) {
            handleUpdateQuantity(id, quantity, selectedSize);
          }
        }}
        onRemoveItem={(id, selectedSize) => {
          if (selectedSize) {
            handleRemoveItem(id, selectedSize);
          }
        }}
      />
    </div>
  );
};

export default ProductDetail;