import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
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

const ProductDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      
      try {
        console.log('Fetching product with ID:', id);

        // Modified query to correctly join with sizes table
        const { data, error } = await supabase
          .from('products')
          .select(`
            *,
            products_variants (
              id_variante,
              id_producto,
              id_talla,
              codigo_sku,
              stock,
              precio_ajuste,
              sizes (
                id_talla,
                talla
              )
            )
          `)
          .eq('id', id)
          .single();

        if (error) {
          console.error('Supabase error:', error);
          throw error;
        }

        if (!data) {
          console.error('No data returned for ID:', id);
          throw new Error('Product not found');
        }

        console.log('Raw data:', data); // Debug log

        // Transform the data to match our interface
        const transformedProduct = {
          ...data,
          variants: data.products_variants.map((variant: any) => ({
            ...variant,
            size: variant.sizes // Change from size to sizes to match the query
          }))
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar 
          cartItems={0}
          onCartClick={() => {}}
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
          cartItems={0}
          onCartClick={() => {}}
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

  // Function to check if variant has stock
  const hasStock = (variant: ProductVariant) => variant.stock > 0;

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

  return (
    <div className="min-h-screen bg-background">
      <Navbar 
        cartItems={0}
        onCartClick={() => {}}
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
              <div className="flex flex-wrap gap-2">
                {['S', 'M', 'L'].map(size => {
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
                          {hasStock(variant) ? (
                            <span className="bg-primary/20 text-primary px-1 rounded-full">
                              {variant.stock}
                            </span>
                          ) : (
                            <span className="bg-destructive/20 text-destructive px-1 rounded-full">
                              Agotado
                            </span>
                          )}
                        </span>
                      )}
                    </Button>
                  );
                })}
              </div>
            </div>

            <Button 
              size="lg" 
              className="w-full"
              disabled={!selectedSize || !getVariantBySize(selectedSize)?.stock}
            >
              {!selectedSize 
                ? 'Selecciona una talla' 
                : !getVariantBySize(selectedSize)?.stock 
                  ? 'Agotado'
                  : 'Agregar al Carrito'
              }
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProductDetail;