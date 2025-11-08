import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  MapPin, 
  Plus, 
  Edit, 
  Trash2, 
  Home, 
  Building, 
  Check,
  Loader,
  AlertCircle
} from "lucide-react";
import { supabase } from "@/lib/supabase";

// URLs de las Edge Functions
const EDGE_GET_ADDRESSES = "https://xrflzmovtmlfrjhtoejs.supabase.co/functions/v1/get-user-addresses";
const EDGE_CREATE_ADDRESS = "https://xrflzmovtmlfrjhtoejs.supabase.co/functions/v1/add-user-address";
const EDGE_UPDATE_ADDRESS = "https://xrflzmovtmlfrjhtoejs.supabase.co/functions/v1/update-user-address";
const EDGE_DELETE_ADDRESS = "https://xrflzmovtmlfrjhtoejs.supabase.co/functions/v1/delete-user-address";

interface Address {
  id: string;
  address_type: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
  is_active: boolean;
}

interface AddressManagerProps {
  mode: 'select' | 'manage';
  onAddressSelect?: (address: Address) => void;
  selectedAddressId?: string;
  onNavigateToProfile?: () => void;
  compact?: boolean; // Nueva prop
}

const AddressManager = ({ 
  onAddressSelect, 
  selectedAddressId, 
  mode = 'manage',
  onNavigateToProfile, 
  compact = false // ← Agregar con valor por defecto
}: AddressManagerProps) => {
  const { toast } = useToast();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    address_type: 'home',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'CO',
    is_default: false
  });

  const colombianStates = [
    "Amazonas", "Antioquia", "Arauca", "Atlántico", "Bolívar", "Boyacá", "Caldas", 
    "Caquetá", "Casanare", "Cauca", "Cesar", "Chocó", "Córdoba", "Cundinamarca", 
    "Guainía", "Guaviare", "Huila", "La Guajira", "Magdalena", "Meta", "Nariño", 
    "Norte de Santander", "Putumayo", "Quindío", "Risaralda", "San Andrés y Providencia", 
    "Santander", "Sucre", "Tolima", "Valle del Cauca", "Vaupés", "Vichada"
  ];

  const fetchAddresses = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        throw new Error(`Error de sesión: ${sessionError.message}`);
      }

      const access_token = sessionData?.session?.access_token;
      const user_id = sessionData?.session?.user?.id;

      if (!access_token || !user_id) {
        throw new Error("No hay sesión activa. Por favor, inicia sesión nuevamente.");
      }

      console.log("🔍 Fetching addresses for user:", user_id);

      const response = await fetch(`${EDGE_GET_ADDRESSES}?user_id=${user_id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json',
          'apikey': access_token
        }
      });

      console.log("📡 Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Error response:", errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log("✅ Addresses fetched:", result);

      if (result.error) {
        throw new Error(result.error);
      }

      setAddresses(result.addresses || []);
      
    } catch (error) {
      console.error("❌ Error fetching addresses:", error);
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      setError(errorMessage);
      
      if (errorMessage.includes("sesión") || errorMessage.includes("401")) {
        toast({
          title: "Error de sesión",
          description: "Por favor, inicia sesión nuevamente",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error al cargar direcciones",
          description: errorMessage,
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const resetForm = () => {
    setFormData({
      address_type: 'home',
      address_line_1: '',
      address_line_2: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'CO',
      is_default: false
    });
    setEditingAddress(null);
  };

  const handleEdit = (address: Address) => {
    setFormData({
      address_type: address.address_type,
      address_line_1: address.address_line_1,
      address_line_2: address.address_line_2 || '',
      city: address.city,
      state: address.state,
      postal_code: address.postal_code,
      country: address.country,
      is_default: address.is_default
    });
    setEditingAddress(address);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.address_line_1.trim() || !formData.city.trim() || !formData.state.trim() || !formData.postal_code.trim()) {
      toast({
        title: "Error de validación",
        description: "Todos los campos marcados con * son obligatorios",
        variant: "destructive"
      });
      return;
    }

    setFormLoading(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const access_token = sessionData?.session?.access_token;
      const user_id = sessionData?.session?.user?.id;

      if (!access_token || !user_id) {
        throw new Error("No hay sesión activa");
      }

      const payload = {
        user_id,
        ...formData,
        address_line_2: formData.address_line_2.trim() || null
      };

      let response;
      if (editingAddress) {
        // Actualizar dirección existente
        response = await fetch(EDGE_UPDATE_ADDRESS, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json',
            'apikey': access_token
          },
          body: JSON.stringify({
            address_id: editingAddress.id,
            ...payload
          })
        });
      } else {
        // Crear nueva dirección
        response = await fetch(EDGE_CREATE_ADDRESS, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json',
            'apikey': access_token
          },
          body: JSON.stringify(payload)
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      toast({
        title: editingAddress ? "Dirección actualizada" : "Dirección creada",
        description: editingAddress ? "La dirección ha sido actualizada correctamente" : "Nueva dirección agregada exitosamente"
      });
      
      setShowForm(false);
      resetForm();
      fetchAddresses();
      
    } catch (error) {
      console.error("Error saving address:", error);
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      toast({
        title: "Error al guardar",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (address: Address) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const access_token = sessionData?.session?.access_token;
      const user_id = sessionData?.session?.user?.id;

      if (!access_token || !user_id) {
        throw new Error("No hay sesión activa");
      }

      const response = await fetch(`${EDGE_DELETE_ADDRESS}?address_id=${address.id}&user_id=${user_id}&soft_delete=true`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json',
          'apikey': access_token
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      toast({
        title: "Dirección eliminada",
        description: "La dirección ha sido eliminada correctamente"
      });
      fetchAddresses();
      
    } catch (error) {
      console.error("Error deleting address:", error);
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      toast({
        title: "Error al eliminar",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const getAddressIcon = (type: string) => {
    switch (type) {
      case 'home': return <Home className="h-4 w-4" />;
      case 'work': return <Building className="h-4 w-4" />;
      default: return <MapPin className="h-4 w-4" />;
    }
  };

  const getAddressTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'home': 'Casa',
      'work': 'Trabajo',
      'billing': 'Facturación',
      'shipping': 'Envío',
      'other': 'Otra'
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-4">
      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader className="h-5 w-5 animate-spin text-white mr-2" />
          <span className="text-white text-sm">Cargando direcciones...</span>
        </div>
      )}

      {/* Modo select */}
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
                onClick={onNavigateToProfile || (() => setShowAddForm(true))}
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
                          {address.address_type}
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
                onClick={onNavigateToProfile || (() => setShowAddForm(true))}
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

      {/* Modo manage (sin cambios) */}
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
                onClick={() => setShowAddForm(true)}
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
                  onClick={() => setShowAddForm(true)}
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
                              {address.address_type}
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
                              handleEdit(address);
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
                              handleDelete(address);
                            }}
                            className="text-red-400 hover:bg-red-500/10 w-full sm:w-auto"
                            title="Eliminar"
                            disabled={formLoading}
                          >
                            {formLoading ? (
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

      {/* Form para agregar/editar dirección */}
      {showForm && (
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingAddress ? 'Editar Dirección' : 'Nueva Dirección'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="address_type">Tipo de dirección</Label>
                <Select
                  value={formData.address_type}
                  onValueChange={(value) => setFormData({ ...formData, address_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="home">🏠 Casa</SelectItem>
                    <SelectItem value="work">🏢 Trabajo</SelectItem>
                    <SelectItem value="billing">📋 Facturación</SelectItem>
                    <SelectItem value="shipping">📦 Envío</SelectItem>
                    <SelectItem value="other">📍 Otra</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="address_line_1">Dirección principal *</Label>
                <Input
                  id="address_line_1"
                  value={formData.address_line_1}
                  onChange={(e) => setFormData({ ...formData, address_line_1: e.target.value })}
                  placeholder="Calle, número, barrio"
                  required
                />
              </div>

              <div>
                <Label htmlFor="address_line_2">Dirección secundaria</Label>
                <Input
                  id="address_line_2"
                  value={formData.address_line_2}
                  onChange={(e) => setFormData({ ...formData, address_line_2: e.target.value })}
                  placeholder="Apartamento, casa, edificio (opcional)"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">Ciudad *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Ciudad"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="postal_code">Código postal *</Label>
                  <Input
                    id="postal_code"
                    value={formData.postal_code}
                    onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                    placeholder="Ej: 110111"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="state">Departamento *</Label>
                <Select
                  value={formData.state}
                  onValueChange={(value) => setFormData({ ...formData, state: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {colombianStates.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="country">País</Label>
                <Select
                  value={formData.country}
                  onValueChange={(value) => setFormData({ ...formData, country: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CO">🇨🇴 Colombia</SelectItem>
                    <SelectItem value="MX">🇲🇽 México</SelectItem>
                    <SelectItem value="US">🇺🇸 Estados Unidos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_default"
                  checked={formData.is_default}
                  onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                  className="w-4 h-4"
                />
                <Label htmlFor="is_default" className="text-sm">
                  Establecer como dirección por defecto
                </Label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="hero"
                  disabled={formLoading}
                  className="flex-1"
                >
                  {formLoading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin mr-2" />
                      Guardando...
                    </>
                  ) : (
                    editingAddress ? 'Actualizar' : 'Guardar'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AddressManager;