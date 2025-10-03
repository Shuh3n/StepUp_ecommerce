import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';
import { ArrowLeft } from 'lucide-react';

interface Size {
  id_talla: number;
  talla: string;  // Assuming this column exists in sizes table
}

interface ProductVariant {
  id_variante: number;
  id_talla: number;
  codigo_sku: string;
  stock: number;
  precio_ajuste: number;
  size: Size;
}

interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  image_url?: string;
  category: string;
  rating: number;
  description?: string;
  variants: ProductVariant[];
}

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<string>('');

  useEffect(() => {
    const fetchProduct = async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          variants:products_variants(
            id_variante,
            codigo_sku,
            stock,
            precio_ajuste,
            size:sizes(id_talla, talla)
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching product:', error);
        toast({
          title: 'Error',
          description: 'No se pudo cargar el producto',
          variant: 'destructive',
        });
        navigate('/productos');
        return;
      }

      if (!data) {
        toast({
          title: 'Error',
          description: 'Producto no encontrado',
          variant: 'destructive',
        });
        navigate('/productos');
        return;
      }

      // Transform the data
      const transformedProduct = {
        ...data,
        variants: data.variants || [],
        sizes: data.variants?.map((v: any) => v.size.talla) || []
      };

      console.log('Product data:', transformedProduct); // Debug log
      setProduct(transformedProduct);
      setLoading(false);
    };

    if (id) {
      fetchProduct();
    }
  }, [id, navigate, toast]);

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (!product) {
    return <div>Producto no encontrado</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar cartItems={0} onCartClick={() => { } } onContactClick={function (): void {
        throw new Error('Function not implemented.');
      } } onFavoritesClick={function (): void {
        throw new Error('Function not implemented.');
      } } />
      
      <main className="pt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/productos')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Productos
        </Button>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Imagen del producto */}
          <div className="aspect-square relative">
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover rounded-lg"
            />
          </div>

          {/* Información del producto */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold">{product.name}</h1>
              <p className="text-muted-foreground">{product.category}</p>
            </div>

            <div className="space-y-2">
              <p className="text-2xl font-bold">${product.price.toLocaleString()}</p>
              {product.originalPrice && (
                <p className="text-muted-foreground line-through">
                  ${product.originalPrice.toLocaleString()}
                </p>
              )}
            </div>

            {product.variants && (
              <div className="space-y-4">
                <p className="font-medium">Tallas disponibles:</p>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((variant) => (
                    <Button
                      key={variant.id_variante}
                      variant={selectedSize === variant.size.talla ? "default" : "outline"}
                      onClick={() => setSelectedSize(variant.size.talla)}
                      disabled={variant.stock <= 0}
                      className="relative"
                    >
                      {variant.size.talla}
                      {variant.stock <= 0 && (
                        <span className="absolute -top-1 -right-1 text-xs text-red-500">
                          Agotado
                        </span>
                      )}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            
            <Button 
              className="w-full" 
              size="lg"
              disabled={!selectedSize || !product.variants.some(v => 
                v.size.talla === selectedSize && v.stock > 0
              )}
            >
              {!selectedSize ? 'Selecciona una talla' : 'Agregar al carrito'}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProductDetail;