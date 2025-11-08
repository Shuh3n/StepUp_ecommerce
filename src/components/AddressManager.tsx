import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import {
  MapPin,
  Plus,
  Edit,
  Trash2,
  Check,
  X,
  Loader,
  Home,
  Building2,
  Users,
  AlertTriangle
} from 'lucide-react';

// Datos de departamentos y ciudades de Colombia
const colombianDepartments = {
  "Amazonas": ["Leticia", "Puerto Nariño"],
  "Antioquia": ["Medellín", "Bello", "Itagüí", "Envigado", "Apartadó", "Turbo", "Rionegro", "Sabaneta", "La Estrella", "Caldas"],
  "Arauca": ["Arauca", "Tame", "Saravena", "Fortul", "Arauquita", "Puerto Rondón", "Cravo Norte"],
  "Atlántico": ["Barranquilla", "Soledad", "Malambo", "Sabanagrande", "Puerto Colombia", "Galapa", "Baranoa", "Usiacurí"],
  "Bolívar": ["Cartagena", "Magangué", "Turbaco", "Arjona", "El Carmen de Bolívar", "San Pablo", "Mompós", "Turbana"],
  "Boyacá": ["Tunja", "Duitama", "Sogamoso", "Chiquinquirá", "Paipa", "Villa de Leyva", "Puerto Boyacá", "Nobsa"],
  "Caldas": ["Manizales", "Villamaría", "Chinchiná", "La Dorada", "Riosucio", "Anserma", "Viterbo", "Palestina"],
  "Caquetá": ["Florencia", "San Vicente del Caguán", "Puerto Rico", "El Paujil", "La Montañita", "Curillo", "Albania"],
  "Casanare": ["Yopal", "Aguazul", "Villanueva", "Tauramena", "Monterrey", "Sabanalarga", "Recetor", "Chameza"],
  "Cauca": ["Popayán", "Santander de Quilichao", "Puerto Tejada", "Patía", "Corinto", "Guapi", "López de Micay"],
  "Cesar": ["Valledupar", "Aguachica", "Codazzi", "Bosconia", "Curumaní", "El Copey", "Chiriguaná", "Gamarra"],
  "Chocó": ["Quibdó", "Istmina", "Condoto", "Tadó", "Acandí", "Capurganá", "Nuquí", "Bahía Solano"],
  "Córdoba": ["Montería", "Cereté", "Sahagún", "Lorica", "Planeta Rica", "Montelíbano", "Tierralta", "Ayapel"],
  "Cundinamarca": ["Bogotá", "Soacha", "Facatativá", "Zipaquirá", "Chía", "Mosquera", "Fusagasugá", "Madrid", "Funza", "Girardot"],
  "Guainía": ["Inírida", "Barranco Minas", "Mapiripana", "San Felipe", "Puerto Colombia", "La Guadalupe", "Cacahual"],
  "Guaviare": ["San José del Guaviare", "Calamar", "El Retorno", "Miraflores"],
  "Huila": ["Neiva", "Pitalito", "Garzón", "La Plata", "Campoalegre", "San Agustín", "Timaná", "Gigante"],
  "La Guajira": ["Riohacha", "Maicao", "Uribia", "Manaure", "San Juan del Cesar", "Villanueva", "El Molino", "Fonseca"],
  "Magdalena": ["Santa Marta", "Ciénaga", "Fundación", "Zona Bananera", "El Banco", "Plato", "Pivijay", "Aracataca"],
  "Meta": ["Villavicencio", "Acacías", "Granada", "Puerto López", "Cumaral", "San Martín", "Restrepo", "Puerto Gaitán"],
  "Nariño": ["Pasto", "Tumaco", "Ipiales", "Túquerres", "Samaniego", "La Cruz", "Barbacoas", "Sandona"],
  "Norte de Santander": ["Cúcuta", "Ocaña", "Pamplona", "Villa del Rosario", "Los Patios", "Tibú", "El Zulia", "Sardinata"],
  "Putumayo": ["Mocoa", "Puerto Asís", "Orito", "Valle del Guamuez", "San Miguel", "Villagarzón", "Sibundoy"],
  "Quindío": ["Armenia", "Calarcá", "La Tebaida", "Montenegro", "Quimbaya", "Circasia", "Filandia", "Salento"],
  "Risaralda": ["Pereira", "Dosquebradas", "Santa Rosa de Cabal", "La Virginia", "Marsella", "Belén de Umbría", "Apía"],
  "San Andrés y Providencia": ["San Andrés", "Providencia"],
  "Santander": ["Bucaramanga", "Floridablanca", "Girón", "Piedecuesta", "Barrancabermeja", "San Gil", "Socorro", "Málaga"],
  "Sucre": ["Sincelejo", "Corozal", "Sampués", "San Marcos", "Tolú", "Coveñas", "Majagual", "Ovejas"],
  "Tolima": ["Ibagué", "Espinal", "Melgar", "Honda", "Líbano", "Chaparral", "Flandes", "Mariquita"],
  "Valle del Cauca": ["Cali", "Palmira", "Buenaventura", "Tuluá", "Cartago", "Buga", "Jamundí", "Yumbo"],
  "Vaupés": ["Mitú", "Caruru", "Pacoa", "Taraira", "Papunaua", "Yavaraté"],
  "Vichada": ["Puerto Carreño", "La Primavera", "Santa Rosalía", "Cumaribo"]
};

// Definir interfaces
interface Address {
  id: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  address_type: 'home' | 'work' | 'other' | 'parents' | 'friend' | 'office' | 'warehouse';
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

interface AddressManagerProps {
  mode: 'select' | 'manage';
  onAddressSelect?: (address: Address) => void;
  selectedAddressId?: string;
  onNavigateToProfile?: () => void;
  compact?: boolean;
}

const AddressManager: React.FC<AddressManagerProps> = ({
  mode,
  onAddressSelect,
  selectedAddressId,
  onNavigateToProfile,
  compact = false
}) => {
  const { toast } = useToast();
  
  // Estados principales
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  
  // Estados para confirmación de eliminación
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<Address | null>(null);
  
  // Estados de carga para acciones específicas
  const [actionLoading, setActionLoading] = useState({
    submit: false,
    delete: '' // ID de la dirección siendo eliminada
  });

  // Estado del formulario
  const [formData, setFormData] = useState<{
    address_line_1: string;
    address_line_2: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    address_type: Address['address_type'];
    is_default: boolean;
  }>({
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'CO',
    address_type: 'home',
    is_default: false
  });

  // Ciudades disponibles basadas en el departamento seleccionado
  const availableCities = formData.state ? colombianDepartments[formData.state as keyof typeof colombianDepartments] || [] : [];

  // Fetch addresses cuando el componente se monte
  useEffect(() => {
    if (mode === 'manage' || mode === 'select') {
      fetchAddresses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // Limpiar ciudad cuando cambie el departamento
  useEffect(() => {
    if (formData.state && !availableCities.includes(formData.city)) {
      setFormData(prev => ({ ...prev, city: '' }));
    }
  }, [formData.state, formData.city, availableCities]);

  // Función para obtener direcciones
  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData?.session) {
        console.error('No session found');
        return;
      }

      const user = sessionData.session.user;
      console.log('🔍 Fetching addresses for user:', user.id);

      const { data, error } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      console.log('📡 Response status:', error ? 'Error' : 'Success');
      
      if (error) {
        console.error('❌ Error fetching addresses:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar las direcciones",
          variant: "destructive"
        });
      } else {
        console.log('✅ Addresses fetched:', { addresses: data || [] });
        setAddresses(data || []);
      }
    } catch (error) {
      console.error('❌ Unexpected error:', error);
      toast({
        title: "Error",
        description: "Error inesperado al cargar direcciones",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Función para resetear el formulario
  const resetForm = () => {
    setFormData({
      address_line_1: '',
      address_line_2: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'CO',
      address_type: 'home',
      is_default: false
    });
    setEditingAddress(null);
    setShowAddModal(false);
  };

  // Función para abrir modal para nueva dirección
  const handleAddNew = () => {
    resetForm();
    setShowAddModal(true);
  };

  // Función para manejar el envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.address_line_1.trim()) {
      toast({
        title: "Error de validación",
        description: "La dirección principal es obligatoria",
        variant: "destructive"
      });
      return;
    }

    if (!formData.city.trim()) {
      toast({
        title: "Error de validación", 
        description: "La ciudad es obligatoria",
        variant: "destructive"
      });
      return;
    }

    if (!formData.state.trim()) {
      toast({
        title: "Error de validación",
        description: "El departamento es obligatorio", 
        variant: "destructive"
      });
      return;
    }

    if (!formData.postal_code.trim()) {
      toast({
        title: "Error de validación",
        description: "El código postal es obligatorio",
        variant: "destructive"
      });
      return;
    }

    setActionLoading(prev => ({ ...prev, submit: true }));

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;

      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      const addressData = {
        ...formData,
        user_id: user.id,
        address_line_1: formData.address_line_1.trim(),
        address_line_2: formData.address_line_2.trim() || null,
        city: formData.city.trim(),
        state: formData.state.trim(),
        postal_code: formData.postal_code.trim(),
        updated_at: new Date().toISOString()
      };

      if (editingAddress) {
        // Actualizar dirección existente
        const { error } = await supabase
          .from('user_addresses')
          .update(addressData)
          .eq('id', editingAddress.id)
          .eq('user_id', user.id);

        if (error) throw error;

        toast({
          title: "✅ Dirección actualizada",
          description: "La dirección se ha actualizado correctamente",
          variant: "default"
        });
      } else {
        // Crear nueva dirección
        const { error } = await supabase
          .from('user_addresses')
          .insert([addressData]);

        if (error) throw error;

        toast({
          title: "✅ Dirección agregada",
          description: "La nueva dirección se ha guardado correctamente",
          variant: "default"
        });
      }

      // Recargar direcciones y cerrar modal
      await fetchAddresses();
      resetForm();

    } catch (error: any) {
      console.error('Error saving address:', error);
      toast({
        title: "❌ Error",
        description: error.message || "No se pudo guardar la dirección",
        variant: "destructive"
      });
    } finally {
      setActionLoading(prev => ({ ...prev, submit: false }));
    }
  };

  // Función para editar dirección
  const handleEditAddress = (address: Address) => {
    setFormData({
      address_line_1: address.address_line_1,
      address_line_2: address.address_line_2 || '',
      city: address.city,
      state: address.state,
      postal_code: address.postal_code,
      country: address.country,
      address_type: address.address_type,
      is_default: address.is_default
    });
    setEditingAddress(address);
    setShowAddModal(true);
  };

  // Función para abrir modal de confirmación de eliminación
  const handleDeleteClick = (address: Address) => {
    setAddressToDelete(address);
    setShowDeleteModal(true);
  };

  // Función para eliminar dirección después de confirmación
  const handleConfirmDelete = async () => {
    if (!addressToDelete) return;

    setActionLoading(prev => ({ ...prev, delete: addressToDelete.id }));

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;

      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      const { error } = await supabase
        .from('user_addresses')
        .delete()
        .eq('id', addressToDelete.id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "✅ Dirección eliminada",
        description: "La dirección se ha eliminado correctamente",
        variant: "default"
      });

      // Recargar direcciones
      await fetchAddresses();

    } catch (error: any) {
      console.error('Error deleting address:', error);
      toast({
        title: "❌ Error",
        description: error.message || "No se pudo eliminar la dirección",
        variant: "destructive"
      });
    } finally {
      setActionLoading(prev => ({ ...prev, delete: '' }));
      setShowDeleteModal(false);
      setAddressToDelete(null);
    }
  };

  // Obtener icono según el tipo de dirección
  const getAddressTypeIcon = (type: string) => {
    switch (type) {
      case 'home':
        return <Home className="h-4 w-4" />;
      case 'work':
        return <Building2 className="h-4 w-4" />;
      case 'parents':
        return <Users className="h-4 w-4" />;
      case 'friend':
        return <Users className="h-4 w-4" />;
      case 'office':
        return <Building2 className="h-4 w-4" />;
      case 'warehouse':
        return <Building2 className="h-4 w-4" />;
      case 'other':
      default:
        return <MapPin className="h-4 w-4" />;
    }
  };

  // Obtener texto del tipo de dirección
  const getAddressTypeText = (type: string) => {
    switch (type) {
      case 'home':
        return 'Casa';
      case 'work':
        return 'Trabajo';
      case 'parents':
        return 'Padres';
      case 'friend':
        return 'Amigo/a';
      case 'office':
        return 'Oficina';
      case 'warehouse':
        return 'Bodega';
      case 'other':
        return 'Otra';
      default:
        return type;
    }
  };

  return (
    <>
      <div className="space-y-4">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader className="h-5 w-5 animate-spin text-white mr-2" />
            <span className="text-white text-sm">Cargando direcciones...</span>
          </div>
        )}

        {!loading && mode === 'select' && (
          <>
            {addresses.length === 0 ? (
              <div className={`text-center ${compact ? 'py-6' : 'py-8'}`}>
                <div className={`${compact ? 'w-16 h-16' : 'w-20 h-20'} mx-auto mb-3 rounded-full bg-white/5 flex items-center justify-center`}>
                  <MapPin className={`${compact ? 'h-8 w-8' : 'h-10 w-10'} text-white/50`} />
                </div>
                <h4 className="text-white font-medium mb-2">Sin direcciones</h4>
                <p className="text-white/70 text-sm mb-4">
                  {compact 
                    ? "Necesitas agregar una dirección para continuar"
                    : "Agrega tu primera dirección para realizar pedidos"
                  }
                </p>
                <Button
                  onClick={() => setShowAddModal(true)}
                  variant={compact ? "outline" : "hero"}
                  size="sm"
                  className={compact ? "text-white border-white/30" : ""}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  <span className={compact ? "" : "hidden sm:inline"}>
                    {compact ? "Agregar Dirección" : "Agregar Primera Dirección"}
                  </span>
                  {!compact && <span className="sm:hidden">Agregar Dirección</span>}
                </Button>
              </div>
            ) : (
              <div className={`space-y-${compact ? '2' : '3'}`}>
                {addresses.map((address) => (
                  <div
                    key={address.id}
                    onClick={() => onAddressSelect?.(address)}
                    className={`${compact ? 'p-3' : 'p-4'} rounded-lg border cursor-pointer transition-all duration-200 ${
                      selectedAddressId === address.id
                        ? 'border-primary bg-primary/10'
                        : 'border-white/20 bg-white/5 hover:border-primary/50 hover:bg-primary/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`${compact ? 'w-3 h-3' : 'w-4 h-4'} rounded-full border-2 flex-shrink-0 ${
                        selectedAddressId === address.id
                          ? 'border-primary bg-primary'
                          : 'border-white/30'
                      }`}>
                        {selectedAddressId === address.id && (
                          <Check className="h-full w-full text-white p-0.5" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge 
                            variant={address.is_default ? "default" : "secondary"}
                            className={`${compact ? 'text-xs px-2 py-0.5' : 'text-xs px-2 py-1'}`}
                          >
                            {getAddressTypeIcon(address.address_type)}
                            <span className="ml-1">{getAddressTypeText(address.address_type)}</span>
                          </Badge>
                          {address.is_default && (
                            <Badge variant="outline" className={`${compact ? 'text-xs px-2 py-0.5' : 'text-xs px-2 py-1'} text-green-400 border-green-400`}>
                              <Check className="h-3 w-3 mr-1" />
                              {compact ? "Principal" : "Predeterminada"}
                            </Badge>
                          )}
                        </div>
                        
                        <div className={`${compact ? 'text-sm' : 'text-sm'} space-y-0.5`}>
                          <p className="text-white font-medium truncate">
                            {address.address_line_1}
                          </p>
                          {!compact && address.address_line_2 && (
                            <p className="text-white/70 text-xs truncate">{address.address_line_2}</p>
                          )}
                          <p className="text-white/70 text-xs truncate">
                            {address.city}, {address.state}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Botón agregar nueva dirección */}
                <Button
                  onClick={() => setShowAddModal(true)}
                  variant="ghost"
                  size="sm"
                  className="w-full text-white/70 border border-dashed border-white/30 hover:border-white/50 hover:bg-white/5"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="text-sm">Agregar nueva dirección</span>
                </Button>
              </div>
            )}
          </>
        )}

        {!loading && mode === 'manage' && (
          <>
            {addresses.length === 0 ? (
              <div className="text-center py-8 px-4">
                <MapPin className="h-16 w-16 text-white/50 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No tienes direcciones guardadas</h3>
                <p className="text-white/70 mb-6 text-sm sm:text-base">
                  Agrega tu primera dirección para realizar pedidos
                </p>
                <Button
                  onClick={handleAddNew}
                  variant="hero"
                  className="w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Agregar Primera Dirección</span>
                  <span className="sm:hidden">Agregar Dirección</span>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Header con botón agregar */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3 className="text-white font-medium text-lg">Tus Direcciones</h3>
                    <p className="text-white/70 text-sm">
                      {addresses.length} dirección{addresses.length !== 1 ? 'es' : ''} guardada{addresses.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  
                  <Button
                    onClick={handleAddNew}
                    variant="hero"
                    size="sm"
                    className="w-full sm:w-auto flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Nueva Dirección</span>
                    <span className="sm:hidden">Agregar</span>
                  </Button>
                </div>

                {/* Grid de direcciones */}
                <div className="grid gap-4 sm:gap-6">
                  {addresses.map((address) => (
                    <Card
                      key={address.id}
                      className="relative bg-white/5 border border-white/20 transition-all duration-300 hover:bg-white/10"
                    >
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge
                                variant={address.is_default ? "default" : "secondary"}
                                className="text-xs"
                              >
                                {getAddressTypeIcon(address.address_type)}
                                <span className="ml-1">{getAddressTypeText(address.address_type)}</span>
                              </Badge>
                              {address.is_default && (
                                <Badge variant="outline" className="text-xs text-green-400 border-green-400">
                                  <Check className="h-3 w-3 mr-1" />
                                  <span className="hidden sm:inline">Predeterminada</span>
                                  <span className="sm:hidden">Principal</span>
                                </Badge>
                              )}
                            </div>

                            <div className="text-white space-y-1">
                              <p className="font-medium text-sm sm:text-base">{address.address_line_1}</p>
                              {address.address_line_2 && (
                                <p className="text-white/70 text-sm">{address.address_line_2}</p>
                              )}
                              <p className="text-white/70 text-sm">
                                {address.city}, {address.state} {address.postal_code}
                              </p>
                              {address.country !== 'CO' && (
                                <p className="text-white/70 text-sm">{address.country}</p>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-row sm:flex-col gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditAddress(address);
                              }}
                              className="text-white hover:bg-white/10 w-full sm:w-auto"
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(address);
                              }}
                              className="text-red-400 hover:bg-red-500/10 w-full sm:w-auto"
                              title="Eliminar"
                              disabled={actionLoading.delete === address.id}
                            >
                              {actionLoading.delete === address.id ? (
                                <Loader className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal para agregar/editar dirección */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent 
          className="max-w-lg w-[90vw] max-h-[85vh] overflow-y-auto bg-card/95 backdrop-blur-md border border-white/20"
          style={{ zIndex: 10002 }}
        >
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {editingAddress ? 'Editar Dirección' : 'Nueva Dirección'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {/* Dirección principal */}
            <div className="space-y-2">
              <Label className="text-white font-medium text-sm">Dirección principal *</Label>
              <Input
                required
                value={formData.address_line_1}
                onChange={(e) => setFormData(prev => ({ ...prev, address_line_1: e.target.value }))}
                placeholder="Ej: Calle 123 #45-67"
                className="bg-white/10 border-white/30 text-white placeholder:text-white/50 focus:border-primary h-9"
              />
            </div>

            {/* Dirección secundaria (opcional) */}
            <div className="space-y-2">
              <Label className="text-white font-medium text-sm">Información adicional</Label>
              <Input
                value={formData.address_line_2}
                onChange={(e) => setFormData(prev => ({ ...prev, address_line_2: e.target.value }))}
                placeholder="Apartamento, edificio, etc. (opcional)"
                className="bg-white/10 border-white/30 text-white placeholder:text-white/50 focus:border-primary h-9"
              />
            </div>

            {/* Departamento y Ciudad */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-white font-medium text-sm">Departamento *</Label>
                <Select
                  value={formData.state}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, state: value, city: '' }))}
                  required
                >
                  <SelectTrigger className="bg-white/10 border-white/30 text-white focus:border-primary h-9">
                    <SelectValue placeholder="Selecciona" />
                  </SelectTrigger>
                  <SelectContent 
                    className="max-h-60 bg-black/90 border-white/20"
                    style={{ zIndex: 10003 }}
                  >
                    {Object.keys(colombianDepartments).map((department) => (
                      <SelectItem key={department} value={department} className="text-white hover:bg-white/10">
                        {department}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-white font-medium text-sm">Ciudad *</Label>
                <Select
                  value={formData.city}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, city: value }))}
                  disabled={!formData.state}
                  required
                >
                  <SelectTrigger className="bg-white/10 border-white/30 text-white focus:border-primary h-9">
                    <SelectValue placeholder={formData.state ? "Selecciona" : "Primero dpto."} />
                  </SelectTrigger>
                  <SelectContent 
                    className="max-h-60 bg-black/90 border-white/20"
                    style={{ zIndex: 10003 }}
                  >
                    {availableCities.map((city) => (
                      <SelectItem key={city} value={city} className="text-white hover:bg-white/10">
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Código postal */}
            <div className="space-y-2">
              <Label className="text-white font-medium text-sm">Código postal *</Label>
              <Input
                required
                value={formData.postal_code}
                onChange={(e) => setFormData(prev => ({ ...prev, postal_code: e.target.value }))}
                placeholder="Ej: 110111"
                className="bg-white/10 border-white/30 text-white placeholder:text-white/50 focus:border-primary h-9"
              />
            </div>

            {/* Tipo de dirección */}
            <div className="space-y-2">
              <Label className="text-white font-medium text-sm">Tipo de dirección</Label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries({
                  home: { label: 'Casa', icon: Home },
                  work: { label: 'Trabajo', icon: Building2 },
                  parents: { label: 'Padres', icon: Users },
                  friend: { label: 'Amigo/a', icon: Users },
                  office: { label: 'Oficina', icon: Building2 },
                  warehouse: { label: 'Bodega', icon: Building2 },
                  other: { label: 'Otra', icon: MapPin }
                }).map(([value, { label, icon: Icon }]) => (
                  <Button
                    key={value}
                    type="button"
                    variant={formData.address_type === value ? "default" : "outline"}
                    onClick={() => setFormData(prev => ({ ...prev, address_type: value as Address['address_type'] }))}
                    className={`flex items-center justify-center gap-1 h-9 text-xs ${
                      formData.address_type === value
                        ? "bg-primary text-primary-foreground border-primary"
                        : "text-white border-white/30 hover:bg-white/10 hover:border-white/50"
                    }`}
                  >
                    <Icon className="h-3 w-3" />
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Checkbox para dirección predeterminada */}
            <div className="flex items-center space-x-2 p-3 bg-white/5 rounded-lg border border-white/10">
              <input
                type="checkbox"
                id="is_default"
                checked={formData.is_default}
                onChange={(e) => setFormData(prev => ({ ...prev, is_default: e.target.checked }))}
                className="w-4 h-4 text-primary bg-white/10 border-white/30 rounded focus:ring-primary focus:ring-2"
              />
              <Label htmlFor="is_default" className="text-white cursor-pointer text-sm">
                Establecer como dirección predeterminada
              </Label>
            </div>

            {/* Botones del formulario */}
            <div className="flex gap-2 pt-2">
              <Button
                type="submit"
                disabled={actionLoading.submit}
                variant="hero"
                className="flex-1 h-9"
              >
                {actionLoading.submit ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    {editingAddress ? 'Actualizando...' : 'Guardando...'}
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    {editingAddress ? 'Actualizar' : 'Guardar'}
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddModal(false)}
                disabled={actionLoading.submit}
                className="flex-1 h-9 text-white border-white/30 hover:bg-white/10"
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmación para eliminar */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent 
          className="max-w-md bg-card/95 backdrop-blur-md border border-red-500/20"
          style={{ zIndex: 10004 }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="h-5 w-5" />
              Confirmar eliminación
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <p className="text-white/80 text-sm">
              ¿Estás seguro de que deseas eliminar esta dirección?
            </p>
            
            {/* Vista previa de la dirección a eliminar */}
            {addressToDelete && (
              <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-xs border-red-400/50">
                    {getAddressTypeIcon(addressToDelete.address_type)}
                    <span className="ml-1">{getAddressTypeText(addressToDelete.address_type)}</span>
                  </Badge>
                  {addressToDelete.is_default && (
                    <Badge variant="outline" className="text-xs text-green-400 border-green-400/50">
                      Principal
                    </Badge>
                  )}
                </div>
                <p className="text-white font-medium text-sm">{addressToDelete.address_line_1}</p>
                <p className="text-white/70 text-xs">{addressToDelete.city}, {addressToDelete.state}</p>
              </div>
            )}
            
            <p className="text-red-400 text-xs font-medium">
              ⚠️ Esta acción no se puede deshacer.
            </p>
          </div>
          
          <div className="flex gap-2 justify-end mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false);
                setAddressToDelete(null);
              }}
              className="text-white border-white/30 hover:bg-white/10"
              disabled={actionLoading.delete !== ''}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={actionLoading.delete !== ''}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {actionLoading.delete !== '' ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Sí, eliminar
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AddressManager;