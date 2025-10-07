import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Cart from "@/components/Cart";
import { ArrowLeft } from "lucide-react";
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

            <div className="text-center py-8">
              <p className="text-lg">Funcionalidad en desarrollo...</p>
              <p className="text-sm text-muted-foreground">
                Revisa la consola para ver los datos del producto
              </p>
            </div>
          </div>
        </div>
      </main>

      <Cart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={() => {}}
        onRemoveItem={() => {}}
      />
    </div>
  );
};

export default ProductDetail;