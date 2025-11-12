import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Search, Package, Truck, AlertCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import TrackingModal from '@/components/TrackingModal';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import PackageQuery from '@/components/PackageQuery';

const Tracking = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Campo requerido",
        description: "Por favor ingresa un código de seguimiento",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const trackingCode = searchQuery.trim().toUpperCase();
      
      // Validar formato: SP + 8 caracteres alfanuméricos (10 total)
      if (!trackingCode.match(/^SP[A-Z0-9]{8}$/)) {
        toast({
          title: "Formato inválido",
          description: "El código debe tener el formato: SP + 8 caracteres (ej: SP779D9879)",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      
      console.log(`🔍 Buscando por código de seguimiento: ${trackingCode}`);

      // Buscar el pedido por código de seguimiento
      const { data: order, error } = await supabase
        .from("orders")
        .select("id, tracking_number, status, user_id")
        .eq("tracking_number", trackingCode)
        .single();

      if (error || !order) {
        // Si no encuentra con tracking_number, intentar generar y buscar
        // (para pedidos antiguos que no tienen tracking_number)
        console.log("❌ No encontrado por tracking_number, intentando búsqueda alternativa...");
        
        // Extraer posible ID del código (caracteres 3-6 después de SP)
        const extractedPart = trackingCode.slice(2, 6);
        
        // Buscar pedidos que contengan esta parte en su ID
        const { data: orders, error: searchError } = await supabase
          .from("orders")
          .select("id, status, user_id, created_at")
          .ilike("id", `%${extractedPart.toLowerCase()}%`)
          .order("created_at", { ascending: false })
          .limit(5);

        if (searchError || !orders || orders.length === 0) {
          toast({
            title: "Pedido no encontrado",
            description: "No se encontró ningún pedido con ese código de seguimiento",
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }

        // Tomar el primer resultado (más reciente)
        const foundOrder = orders[0];
        
        // Generar y asignar tracking number al pedido encontrado (formato 10 caracteres)
        const generateRandomChar = () => {
          const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
          return chars.charAt(Math.floor(Math.random() * chars.length));
        };
        
        const shortId = foundOrder.id.slice(-4).toUpperCase();
        const randomPart = Array.from({length: 4}, () => generateRandomChar()).join('');
        const generatedTracking = `SP${shortId}${randomPart}`;
        
        await supabase
          .from("orders")
          .update({ tracking_number: generatedTracking })
          .eq("id", foundOrder.id);

        console.log(`✅ Pedido encontrado y tracking asignado: ${foundOrder.id}`);
        
        toast({
          title: "Código generado",
          description: `Tu código de seguimiento es: ${generatedTracking}`,
          variant: "default"
        });

        setSelectedOrderId(foundOrder.id);
        setTrackingModalOpen(true);
      } else {
        console.log(`✅ Pedido encontrado: ${order.id}`);
        setSelectedOrderId(order.id);
        setTrackingModalOpen(true);
      }

    } catch (error: any) {
      console.error("Error en búsqueda:", error);
      toast({
        title: "Error",
        description: "No se pudo procesar la búsqueda. Inténtalo de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseModal = () => {
    setTrackingModalOpen(false);
    setSelectedOrderId(null);
  };

  return (
    <div className="min-h-screen">
      <Navbar 
        cartItems={0} 
        onCartClick={() => {}} 
        onContactClick={() => {}} 
        onFavoritesClick={() => {}} 
      />
      
      <main className="pt-24 px-4 sm:px-6 lg:px-8 pb-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/20 rounded-full mb-6">
              <Truck className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">
              Seguimiento de Paquetes
            </h1>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Rastrea tu pedido en tiempo real desde Medellín hasta tu puerta
            </p>
          </div>

          {/* Formulario de búsqueda */}
          <Card className="glass border border-primary/30 shadow-xl mb-8">
            <CardHeader>
              <CardTitle className="text-white text-2xl flex items-center gap-2">
                <Search className="h-6 w-6" />
                Buscar por Código de Seguimiento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="search" className="text-white font-medium">
                    Código de Seguimiento
                  </Label>
                  <Input
                    id="search"
                    placeholder="Ej: SP779D9879"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                    className="bg-white/10 border-white/30 text-white placeholder:text-white/50 font-mono text-lg"
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    maxLength={10} // SP + 8 caracteres = 10 total
                  />
                  <p className="text-white/60 text-sm">
                    El código debe tener el formato: SP + 8 caracteres alfanuméricos
                  </p>
                </div>
                
                <Button 
                  onClick={handleSearch}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/80 hover:to-secondary/80"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Package className="h-5 w-5 mr-2 animate-spin" />
                      Buscando...
                    </>
                  ) : (
                    <>
                      <Search className="h-5 w-5 mr-2" />
                      Rastrear Paquete
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Información adicional */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-blue-500/10 border-blue-500/20">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Package className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-2">¿Dónde encontrar tu código de seguimiento?</h3>
                    <ul className="text-blue-100/80 text-sm space-y-1">
                      <li>• En el email de confirmación de compra</li>
                      <li>• En tu perfil, sección "Mis Pedidos"</li>
                      <li>• En el comprobante de pago</li>
                      <li>• Formato: SP + 8 caracteres alfanuméricos</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-500/10 border-green-500/20">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <Truck className="h-6 w-6 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-2">Estados de Seguimiento</h3>
                    <ul className="text-green-100/80 text-sm space-y-1">
                      <li>• <span className="text-green-400">●</span> Confirmado - Pedido recibido</li>
                      <li>• <span className="text-blue-400">●</span> Preparando - En empaque</li>
                      <li>• <span className="text-purple-400">●</span> En tránsito - Enviado</li>
                      <li>• <span className="text-yellow-400">●</span> Fuera para entrega - Llegando hoy</li>
                      <li>• <span className="text-emerald-400">●</span> Entregado - Completado</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Ejemplo de código */}
          <Card className="mt-8 bg-purple-500/10 border-purple-500/20">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Search className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-purple-300 font-semibold mb-2">Ejemplo de Código de Seguimiento</h3>
                  <div className="bg-black/20 p-3 rounded border font-mono text-primary text-xl">
                    SP779D9879
                  </div>
                  <p className="text-purple-100/80 text-sm mt-2">
                    Los códigos siempre comienzan con "SP" seguido de 8 caracteres alfanuméricos.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ayuda */}
          <Card className="mt-8 bg-yellow-500/10 border-yellow-500/20">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="h-6 w-6 text-yellow-400 mt-1" />
                <div>
                  <h3 className="text-yellow-300 font-semibold mb-2">¿No encuentras tu código?</h3>
                  <p className="text-yellow-100/80 text-sm mb-3">
                    Si compraste antes de que implementáramos los códigos de seguimiento, 
                    ingresa cualquier código con el formato SP + 8 caracteres y nosotros 
                    generaremos automáticamente tu nuevo código de seguimiento.
                  </p>
                  <Button variant="outline" size="sm" className="border-yellow-400/50 text-yellow-400 hover:bg-yellow-400/10">
                    Contactar Soporte
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Agregar consulta específica del paquete SP1206OQ6S */}
          
        </div>

        {/* Modal de tracking */}
        {selectedOrderId && (
          <TrackingModal
            isOpen={trackingModalOpen}
            onClose={handleCloseModal}
            orderId={selectedOrderId}
          />
        )}
      </main>
    </div>
  );
};

export default Tracking;