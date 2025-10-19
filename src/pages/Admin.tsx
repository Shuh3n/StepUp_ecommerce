import React, { useState, useEffect, useCallback } from "react";
// ...existing imports...
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import JSZip from 'jszip';
// Interfaces de inventario
interface Product {
    id: number;
    name: string;
    description?: string;
    price: number;
    image_url?: string;
    category: string;
    category_name: string;
    created_at?: string;
    updated_at?: string;
    stock: number;
    stock_minimo: number;
    variants: Record<string, unknown>[];
    active?: boolean;
}

interface InventoryMovement {
    id: number;
    product_id: number;
    product_name: string;
    tipo: 'venta' | 'devolucion' | 'reposicion';
    cantidad: number;
    fecha: string;
    products?: { name: string };
    usuario_nombre?: string;
}
import { toast } from '@/hooks/use-toast';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Download, Eye, EyeOff, RefreshCw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChartContainer } from "@/components/ui/chart";
import { BarChart as ReBarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Users, Package, LayoutDashboard, AlertTriangle, TrendingUp, ShoppingCart, DollarSign, Clock, Store, ShoppingBag, Warehouse, ArrowRight, Activity, Bell, CheckCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import { supabase } from '../lib/supabase';
import ProductFilters from "@/components/ProductFilters";
import {
        Dialog,
        DialogTrigger,
        DialogContent,
        DialogHeader,
        DialogTitle,
        DialogDescription,
        DialogFooter,
        DialogClose
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogAction,
    AlertDialogCancel,
} from '@/components/ui/alert-dialog';

interface User {
    auth_id: string;
    identification: string;
    full_name: string;
    email: string;
    phone: string;
    created_at: string;
    updated_at: string;
    last_login: string;
    email_verified: boolean;
    login_count: number;
    order_count: number;
}

interface Order {
    id: string;
    user_id: string;
    status: string;
    total: number;
    address: string;
    phone: string;
    payment_method: string;
    payment_status: string;
    created_at: string;
    items: Array<{name: string; qty: number}> | string;
}

interface ProductWithActive extends Product {
    active?: boolean;
}

interface EditProduct {
    id: number;
    name: string;
    category: string;
    category_name: string;
    stock: number;
    stock_minimo: number;
    price: number;
    description: string;
    image_url: string;
    active?: boolean;
}

// Si quieres también puedes definir Order aquí...

// Tallas para variantes
interface SizeOption {
    id_talla: number;
    nombre_talla: string;
}

const Admin = () => {
    const { toast } = useToast();
    
    // Handler para crear producto
    const handleCreateProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        // Validar nombre único
        const nameExists = products.some(p => p.name === newProduct.name);
        if (nameExists) {
            setNameError('Ya existe un producto con ese nombre');
            return;
        }
        setNameError(null);
        // Validar imagen
        if (!imageFile) {
            setImageError('La imagen es obligatoria');
            return;
        }
        setImageError(null);
        // Subir imagen al bucket 'product-images' en Supabase Storage
        // Subir imagen al bucket 'product-images' en Supabase Storage
        if (!(imageFile instanceof File)) {
            setImageError('Archivo de imagen inválido');
            return;
        }

        const fileName = `product-${newProduct.name.replace(/\s+/g, '-')}-${Date.now()}`;
        const { data, error } = await supabase.storage
            .from('product-images')
            .upload(fileName, imageFile);

        if (error) {
            setImageError(`Error al subir la imagen: ${error.message}`);
            return;
        }
        // Obtener la URL pública de la imagen subida
        const publicUrl = supabase.storage.from('product-images').getPublicUrl(fileName).data.publicUrl;
        // Validar suma de variantes
        const totalVariants = Object.values(variantStocks).reduce((sum, v) => sum + (Number.isFinite(v) ? Number(v) : 0), 0);
        if (totalVariants > newProduct.stock) {
            toast({ title: 'Stock por tallas inválido', description: 'La suma de cantidades por talla no puede exceder el stock total.', variant: 'destructive' });
            return;
        }

        // Crear producto en Supabase con la URL pública de la imagen
        const { data: insertedProduct, error: insertError } = await supabase.from('products').insert({
            name: newProduct.name,
            category: newProduct.category,
            stock: newProduct.stock,
            stock_minimo: newProduct.stock_minimo,
            price: newProduct.price,
            image_url: publicUrl, // Usar publicUrl correctamente
            description: newProduct.description,
            active: true // Asegurar que el producto se crea como activo
        }).select('id').single();
        if (!insertError && insertedProduct?.id) {
            const newProductId = insertedProduct.id as number;
            // Insertar variantes con stock > 0
            const variantsToInsert = availableSizes
                .map(s => ({ id_talla: s.id_talla, qty: Number(variantStocks[s.id_talla] || 0) }))
                .filter(v => v.qty > 0)
                .map(v => ({
                    id_producto: newProductId,
                    id_talla: v.id_talla,
                    codigo_sku: `SKU-${newProductId}-${v.id_talla}`,
                    stock: v.qty,
                    precio_ajuste: 0
                }));
            if (variantsToInsert.length > 0) {
                const { error: variantsError } = await supabase
                    .from('products_variants')
                    .insert(variantsToInsert);
                if (variantsError) {
                    toast({ title: 'Producto creado con advertencia', description: 'Se creó el producto, pero ocurrió un error al crear variantes.', variant: 'destructive' });
                }
            }
            toast({ title: 'Producto creado exitosamente' });
            setShowCreateProductModal(false);
            setNewProduct({ name: '', category: '', category_name: '', stock: 1, stock_minimo: 0, price: 0, image_url: '', description: '' });
            setImageFile(null);
            setVariantStocks({});
            setProductsPage(1); // Regresar a la primera página para ver el nuevo producto
            // Pequeño delay para asegurar que la base de datos procese la inserción
            setTimeout(async () => {
                await fetchProducts(); // Actualizar la lista de productos
            }, 300);
        } else {
            toast({ title: 'Error al crear', description: insertError.message, variant: 'destructive' });
        }
    };

    // Handler para cambio de imagen en creación
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setImageError(null);
        }
    };

    // Handler para eliminar producto (con confirmación)
    const handleDeleteProduct = async () => {
        if (!confirmDeleteProductId) return;

        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', confirmDeleteProductId);

        if (!error) {
            toast({ 
                title: 'Producto eliminado',
                description: 'El producto ha sido eliminado exitosamente'
            });
            fetchProducts(); // Actualizar la lista de productos
        } else {
            toast({ 
                title: 'Error al eliminar', 
                description: error.message, 
                variant: 'destructive' 
            });
        }
        
        setConfirmDeleteProductId(null);
    };
    // --- CRUD Productos ---
    // Estado para modal de creación
    const [showCreateProductModal, setShowCreateProductModal] = useState(false);
    // Estado para nuevo producto
    const [newProduct, setNewProduct] = useState({
        name: '',
        category: '',
        category_name: '',
        stock: 1,
        stock_minimo: 0,
        price: 0,
        image_url: '',
        description: ''
    });
    const [nameError, setNameError] = useState<string | null>(null);
    const [imageError, setImageError] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    // Tallas/variantes para creación
    const [availableSizes, setAvailableSizes] = useState<SizeOption[]>([]);
    const [variantStocks, setVariantStocks] = useState<Record<number, number>>({});
    const [sizesLoading, setSizesLoading] = useState<boolean>(false);
    const [sizesError, setSizesError] = useState<string | null>(null);

    // Estado para edición de producto
    const [editProduct, setEditProduct] = useState<EditProduct | null>(null);
    const [editNameError, setEditNameError] = useState<string | null>(null);
    const [editImageError, setEditImageError] = useState<string | null>(null);
    const [editImageFile, setEditImageFile] = useState<File | null>(null);
    const [editVariantStocks, setEditVariantStocks] = useState<Record<number, number>>({});

    // Filtros de productos - inicializados con valores por defecto
    const [filterCategory, setFilterCategory] = useState<string>("all");
    const [filterPrice, setFilterPrice] = useState<[number, number]>([0, 500000]);
    const [filterActive, setFilterActive] = useState<string>("all");
    const [sortBy, setSortBy] = useState<string>("newest");
    // Filtros de tallas (desde BD)
    const [sizesForFilters, setSizesForFilters] = useState<string[]>([]);
    const [selectedSizesFilter, setSelectedSizesFilter] = useState<string[]>([]);
    const [sizeIdToName, setSizeIdToName] = useState<Record<number, string>>({});
    const [variantsByProduct, setVariantsByProduct] = useState<Record<number, string[]>>({});
    const [variantsReady, setVariantsReady] = useState<boolean>(false);
    // Para exportar CSV (compatibilidad con Excel: UTF-8 BOM, ; como separador, CRLF)
    const exportToCSV = () => {
        // Delimitador preferido por Excel en configuraciones regionales ES/CO
        const delimiter = ";";
        const newline = "\r\n";
        const headers = ["ID", "Nombre", "Categoría", "Stock", "Stock mínimo", "Precio", "Activo"];
        const escapeCell = (val: unknown) => {
            if (val === null || val === undefined) return "";
            // Normalizar booleanos
            if (typeof val === "boolean") return val ? "Sí" : "No";
            let s = String(val);
            // Escapar comillas dobles
            s = s.replace(/"/g, '""');
            // Envolver siempre en comillas por seguridad
            return `"${s}"`;
        };
        const rows = filteredProducts.map(p => [
            p.id,
            p.name,
            p.category_name,
            p.stock,
            p.stock_minimo,
            // Mantener precio como número simple (sin separadores) para que Excel lo detecte
            p.price,
            (p.active !== false)
        ]);
        const csvBody = [headers, ...rows]
            .map(r => r.map(escapeCell).join(delimiter))
            .join(newline);
        // Agregar BOM para acentos correctos en Excel
        const csvWithBom = "\uFEFF" + csvBody + newline;
        const blob = new Blob([csvWithBom], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "inventario.csv";
        a.click();
        URL.revokeObjectURL(url);
    };

    // Handler para abrir modal de edición
    const handleEditProduct = (product: Product & { active?: boolean }) => {
        // Mapear el producto real al tipo de edición asegurando campos requeridos
        const mapped: EditProduct = {
            id: product.id,
            name: product.name,
            category: product.category,
            category_name: product.category_name,
            stock: product.stock,
            stock_minimo: product.stock_minimo,
            price: product.price,
            description: product.description ?? '',
            image_url: product.image_url ?? '',
            active: product.active,
        };

        setEditProduct(mapped);
        setEditNameError(null);
        setEditImageError(null);
        setEditImageFile(null);
        // Preparar stocks por talla para edición (se cargarán al abrir el modal)
        setEditVariantStocks({});
    };

    // Handler para cambio de imagen en edición
    const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setEditImageFile(file);
            setEditImageError(null);
        }
    };

    // Handler para actualizar producto
    const handleUpdateProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editProduct) return;
        // Validar nombre único
        const nameExists = products.some(p => p.name === editProduct.name && p.id !== editProduct.id);
        if (nameExists) {
            setEditNameError('Ya existe un producto con ese nombre');
            return;
        }
        setEditNameError(null);
        // Si hay imagen nueva, subirla al bucket 'product-images'
        let imageUrl = editProduct.image_url;
        if (editImageFile) {
            // Obtener extensión del archivo de imagen
            const ext = editImageFile.name.split('.').pop();
            const fileName = `product-${editProduct.id}-${Date.now()}.${ext}`;
            const { data, error } = await supabase.storage.from('product-images').upload(fileName, editImageFile, { upsert: true });
            if (error) {
                setEditImageError('Error al subir la imagen');
                return;
            }
            imageUrl = supabase.storage.from('product-images').getPublicUrl(fileName).data.publicUrl;
        }
        // Actualizar en Supabase (producto)
        const { error: updateError } = await supabase.from('products').update({
            name: editProduct.name,
            category: editProduct.category,
            stock: editProduct.stock,
            stock_minimo: editProduct.stock_minimo,
            price: editProduct.price,
            image_url: imageUrl,
            description: editProduct.description
        }).eq('id', editProduct.id);
        if (!updateError) {
            // Persistir variantes: eliminar existentes y re-insertar las con stock > 0
            try {
                await supabase.from('products_variants').delete().eq('id_producto', editProduct.id);
                const variantsToInsert = availableSizes
                    .map(s => ({ id_talla: s.id_talla, qty: Number(editVariantStocks[s.id_talla] || 0) }))
                    .filter(v => v.qty > 0)
                    .map(v => ({
                        id_producto: editProduct.id,
                        id_talla: v.id_talla,
                        codigo_sku: `SKU-${editProduct.id}-${v.id_talla}`,
                        stock: v.qty,
                        precio_ajuste: 0
                    }));
                if (variantsToInsert.length > 0) {
                    const { error: vErr } = await supabase.from('products_variants').insert(variantsToInsert);
                    if (vErr) {
                        toast({ title: 'Producto actualizado con advertencia', description: 'No se pudieron actualizar las variantes.', variant: 'destructive' });
                    }
                }
            } catch (err) {
                // No bloquear la actualización del producto por fallos en variantes
                console.error('Error actualizando variantes:', err);
            }
            toast({ title: 'Producto actualizado' });
            setEditProduct(null);
            fetchProducts();
        } else {
            toast({ title: 'Error al actualizar', description: updateError.message, variant: 'destructive' });
        }
    };
    // Inventario
    const [products, setProducts] = useState<(Product & { active?: boolean })[]>([]);
    const [inventoryMovements, setInventoryMovements] = useState<InventoryMovement[]>([]);
    // Paginación para historial de movimientos
    const [movementPage, setMovementPage] = useState(1);
    const movementsPerPage = 10;
    // Ordenar por fecha descendente para ver primero los registros más recientes
    const sortedMovements = React.useMemo(() => {
        return [...inventoryMovements].sort((a, b) => {
            const da = new Date(a.fecha).getTime();
            const db = new Date(b.fecha).getTime();
            return db - da;
        });
    }, [inventoryMovements]);
    const totalMovementPages = Math.ceil(sortedMovements.length / movementsPerPage);
    const paginatedMovements = React.useMemo(() => {
        const start = (movementPage - 1) * movementsPerPage;
        return sortedMovements.slice(start, start + movementsPerPage);
    }, [sortedMovements, movementPage]);
    // Reiniciar a la primera página cuando cambia la data
    useEffect(() => { setMovementPage(1); }, [inventoryMovements.length]);
    const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
    const [movementType, setMovementType] = useState<'venta' | 'devolucion' | 'reposicion'>('venta');
    const [movementQty, setMovementQty] = useState<string>('1');
    const [qtyError, setQtyError] = useState<string | null>(null);
    const [alertStock, setAlertStock] = useState<string | null>(null);
    // Variantes por producto para registrar movimientos por talla
    const [productVariantOptions, setProductVariantOptions] = useState<Array<{ id_talla: number; nombre_talla: string; stock: number }>>([]);
    const [selectedSizeForMovement, setSelectedSizeForMovement] = useState<number | null>(null);
    // Consulta real de productos desde Supabase
    const fetchProducts = useCallback(async () => {
        const { data, error } = await supabase
            .from('products')
            .select('*, categories(id, name)');
        if (!error && data) {
            // Mapear productos para tener category (uuid) y category_name directo
            type SupabaseProduct = {
                id: number;
                name: string;
                description?: string;
                price: number;
                image_url?: string;
                created_at?: string;
                updated_at?: string;
                stock: number;
                stock_minimo: number;
                variants?: Record<string, unknown>[];
                categories?: { id: string; name: string };
                category?: string;
                active?: boolean;
            };
            const productsWithCategory = data.map((p: SupabaseProduct) => ({
                id: p.id,
                name: p.name,
                description: p.description,
                price: p.price,
                image_url: p.image_url,
                category: p.categories?.id || 'Sin categoría',
                category_name: p.categories?.name || '',
                created_at: p.created_at,
                updated_at: p.updated_at,
                stock: p.stock,
                stock_minimo: p.stock_minimo,
                variants: p.variants || [],
                active: p.active !== undefined ? p.active : true
            }));
            setProducts(productsWithCategory);
        } else {
            toast({ title: 'Error al cargar productos', description: error?.message, variant: 'destructive' });
        }
    }, [toast]);
    // Cambiar estado activo/inactivo
    const handleToggleActive = async (product: Product & { active?: boolean }) => {
        const newActive = !product.active;
        const { error } = await supabase.from('products').update({ active: newActive }).eq('id', product.id);
        if (!error) {
            setProducts(products.map(p => p.id === product.id ? { ...p, active: newActive } : p));
            toast({ title: `Producto ${newActive ? 'activado' : 'desactivado'}` });
        } else {
            toast({ title: 'Error al actualizar estado', description: error.message, variant: 'destructive' });
        }
    };
    // Categorías (debe declararse antes de usar en filtros)
    const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
    // Filtros y ordenamiento
    // Detectar si existe una categoría en BD llamada "Todos/Todas/All" y tratarla como "all"
    const dbAllCategoryId = React.useMemo(() => {
        const found = categories.find(cat => {
            const n = (cat.name || '').trim().toLowerCase();
            return n === 'todos' || n === 'todas' || n === 'all';
        });
        return found ? found.id : null;
    }, [categories]);
    const effectiveCategory = (filterCategory === 'all' || (dbAllCategoryId && filterCategory === dbAllCategoryId)) ? 'all' : filterCategory;
    // Si existe categoría "Todos/Todas/All" en DB, usarla como predeterminada en el filtro
    useEffect(() => {
        if (dbAllCategoryId && filterCategory === 'all') {
            setFilterCategory(dbAllCategoryId);
        }
    }, [dbAllCategoryId, filterCategory]);
    const filteredProducts = products
    .filter(p => effectiveCategory === "all" || p.category === effectiveCategory)
        .filter(p => p.price >= filterPrice[0] && p.price <= filterPrice[1])
        // Filtrar por tallas seleccionadas solo cuando tengamos variantes cargadas
        .filter(p => {
            if (selectedSizesFilter.length === 0) return true;
            if (!variantsReady) return true; // evitar ocultar productos mientras se cargan variantes
            const vars = variantsByProduct[p.id] || [];
            return vars.some(vn => selectedSizesFilter.includes(vn));
        })
        .filter(p => {
            if (filterActive === "all") return true;
            if (filterActive === "active") return p.active !== false; // incluye undefined/null como activo
            if (filterActive === "inactive") return p.active === false;
            return true;
        })
        .sort((a, b) => {
            if (sortBy === "price-low") return a.price - b.price;
            if (sortBy === "price-high") return b.price - a.price;
            if (sortBy === "newest") return b.id - a.id;
            return 0;
        });

    // Cargar categorías desde Supabase
    useEffect(() => {
        const fetchCategories = async () => {
            const { data, error } = await supabase
                .from('categories')
                .select('id, name');
            if (!error && data) {
                setCategories(data);
            } else {
                setCategories([]);
            }
        };
        fetchCategories();
    }, []);

    // Carga de tallas desde BD (tabla sizes)
    const fetchSizes = useCallback(async () => {
        try {
            setSizesLoading(true);
            setSizesError(null);
            const { data, error } = await supabase
                .from('sizes')
                .select('id_talla, nombre_talla')
                .order('id_talla', { ascending: true });
            if (error) {
                setAvailableSizes([]);
                setSizesError(error.message);
                toast({ title: 'Error al cargar tallas', description: error.message, variant: 'destructive' });
                return; // finally se encarga de apagar loading
            }
            const sizes = (data || []) as SizeOption[];
            setAvailableSizes(sizes);
            setVariantStocks(prev => {
                const next = { ...prev } as Record<number, number>;
                sizes.forEach(s => { if (next[s.id_talla] === undefined) next[s.id_talla] = 0; });
                return next;
            });
            // También preparar tallas para filtros (nombres) y mapa id->nombre
            const idToName: Record<number, string> = {};
            const names: string[] = [];
            sizes.forEach(s => {
                idToName[s.id_talla] = s.nombre_talla;
                names.push(s.nombre_talla);
            });
            setSizeIdToName(idToName);
            setSizesForFilters(names);
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Error desconocido obteniendo tallas';
            setSizesError(msg);
            toast({ title: 'Error al cargar tallas', description: msg, variant: 'destructive' });
        } finally {
            setSizesLoading(false);
        }
    }, [toast]);

    // Cargar tallas cuando se abre el modal de crear producto
    useEffect(() => {
        if (showCreateProductModal) fetchSizes();
    }, [showCreateProductModal, fetchSizes]);

    // Cargar tallas para filtros al montar (si aún no están cargadas)
    useEffect(() => {
        const loadSizesForFilters = async () => {
            try {
                // Reutilizamos fetchSizes si aún no hay tallas cargadas
                if (sizesForFilters.length === 0) {
                    const { data, error } = await supabase
                        .from('sizes')
                        .select('id_talla, nombre_talla')
                        .order('id_talla', { ascending: true });
                    if (!error && data) {
                        const idToName: Record<number, string> = {};
                        const names = (data as { id_talla: number; nombre_talla: string }[]).map(s => {
                            idToName[s.id_talla] = s.nombre_talla;
                            return s.nombre_talla;
                        });
                        setSizeIdToName(idToName);
                        setSizesForFilters(names);
                    }
                }
            } catch {
                // silencioso para no interrumpir la vista
            }
        };
        loadSizesForFilters();
    }, [sizesForFilters.length]);

    // Cargar variantes para todos los productos visibles (mapa productId -> nombres de talla)
    useEffect(() => {
        const loadVariants = async () => {
            try {
                setVariantsReady(false);
                if (products.length === 0) {
                    setVariantsByProduct({});
                    setVariantsReady(true);
                    return;
                }
                const productIds = products.map(p => p.id);
                const { data, error } = await supabase
                    .from('products_variants')
                    .select('id_producto, id_talla, stock')
                    .in('id_producto', productIds);
                if (error) {
                    setVariantsByProduct({});
                    setVariantsReady(true);
                    return;
                }
                const byProduct: Record<number, Set<string>> = {};
                (data || []).forEach((v: { id_producto: number; id_talla: number; stock: number }) => {
                    // Considerar solo tallas con stock > 0 para el filtro
                    if (v.stock <= 0) return;
                    const name = sizeIdToName[v.id_talla];
                    if (!name) return;
                    if (!byProduct[v.id_producto]) byProduct[v.id_producto] = new Set<string>();
                    byProduct[v.id_producto].add(name);
                });
                const result: Record<number, string[]> = {};
                Object.keys(byProduct).forEach(pid => {
                    result[Number(pid)] = Array.from(byProduct[Number(pid)]);
                });
                setVariantsByProduct(result);
            } finally {
                setVariantsReady(true);
            }
        };
        // Ejecutar cuando cambian los productos o el mapa de tallas
        loadVariants();
    }, [products, sizeIdToName]);

    // Cargar tallas y variantes cuando se abre el modal de editar producto
    useEffect(() => {
        const loadEditVariants = async () => {
            if (!editProduct) return;
            try {
                // Asegurar tallas cargadas (sin depender de availableSizes para evitar loops)
                let sizes = availableSizes;
                if (!sizes || sizes.length === 0) {
                    setSizesLoading(true);
                    const { data: sizesData, error: sizesErr } = await supabase
                        .from('sizes')
                        .select('id_talla, nombre_talla')
                        .order('id_talla', { ascending: true });
                    if (!sizesErr && sizesData) {
                        sizes = sizesData as SizeOption[];
                        setAvailableSizes(sizes);
                    } else if (sizesErr) {
                        setSizesError(sizesErr.message);
                        toast({ title: 'Error al cargar tallas', description: sizesErr.message, variant: 'destructive' });
                    }
                    setSizesLoading(false);
                }

                // Obtener variantes actuales del producto
                const { data, error } = await supabase
                    .from('products_variants')
                    .select('id_talla, stock')
                    .eq('id_producto', editProduct.id);
                if (!error) {
                    const map: Record<number, number> = {};
                    (data || []).forEach((v: { id_talla: number; stock: number }) => { map[v.id_talla] = v.stock || 0; });
                    const baseSizes = sizes || [];
                    setEditVariantStocks(() => {
                        const next: Record<number, number> = {};
                        baseSizes.forEach(s => { next[s.id_talla] = map[s.id_talla] ?? 0; });
                        return next;
                    });
                }
            } catch (e) {
                const msg = e instanceof Error ? e.message : 'Error desconocido cargando variantes';
                toast({ title: 'Error', description: msg, variant: 'destructive' });
            }
        };
        if (editProduct) loadEditVariants();
        // Intencionalmente sin dependencias de availableSizes/fetchSizes para evitar bucles
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editProduct]);

    // Cargar variantes (tallas y stock) cuando se selecciona un producto para movimiento
    useEffect(() => {
        const loadProductVariants = async () => {
            if (!selectedProductId) {
                setProductVariantOptions([]);
                setSelectedSizeForMovement(null);
                return;
            }
            try {
                const { data, error } = await supabase
                    .from('products_variants')
                    .select('id_talla, stock')
                    .eq('id_producto', selectedProductId);
                if (error) {
                    setProductVariantOptions([]);
                    return;
                }
                // Si no tenemos mapa id->nombre, intentar cargar tallas
                if (!sizeIdToName || Object.keys(sizeIdToName).length === 0) {
                    try {
                        await fetchSizes();
                    } catch {
                        // ignorar, seguiremos con ids si no hay nombres
                    }
                }
                // Mapear usando sizeIdToName para obtener nombre de talla
                const opts = (data || []).map((v: { id_talla: number; stock: number }) => ({
                    id_talla: v.id_talla,
                    nombre_talla: sizeIdToName[v.id_talla] || String(v.id_talla),
                    stock: v.stock || 0
                }));
                setProductVariantOptions(opts);
                // Si hay al menos una talla con stock, pre-seleccionar la primera
                const firstWithStock = opts.find(o => o.stock > 0);
                setSelectedSizeForMovement(firstWithStock ? firstWithStock.id_talla : (opts[0]?.id_talla ?? null));
            } catch (e) {
                setProductVariantOptions([]);
            }
        };
        loadProductVariants();
    }, [selectedProductId, sizeIdToName, fetchSizes]);

    // Calcular rango dinámico de precios basado en productos reales
    const maxPrice = products.length > 0 ? Math.max(...products.map(p => p.price)) : 500000;
    const minPrice = products.length > 0 ? Math.min(...products.map(p => p.price)) : 0;
    const dynamicMaxPrice = Math.ceil(maxPrice * 1.1); // 10% más que el producto más caro
    
    // Actualizar el rango cuando cambien los productos
    React.useEffect(() => {
        if (products.length > 0) {
            const newMaxPrice = Math.max(...products.map(p => p.price));
            const newMinPrice = Math.min(...products.map(p => p.price));
            const newDynamicMaxPrice = Math.ceil(newMaxPrice * 1.1);
            
            // Solo actualizar si el rango actual es insuficiente o si es la primera vez
            setFilterPrice(prev => {
                if (prev[1] < newMaxPrice || (prev[0] === 0 && prev[1] === 500000)) {
                    return [newMinPrice, newDynamicMaxPrice];
                }
                return prev;
            });
        }
    }, [products]);

    // Estados para gestión de categorías
    const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false);
    const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [editingCategory, setEditingCategory] = useState<string | null>(null);
    const [editCategoryName, setEditCategoryName] = useState('');
    const [confirmDeleteCategory, setConfirmDeleteCategory] = useState<string | null>(null);

    // Estados para configuración
    const [companyConfig, setCompanyConfig] = useState({
        name: 'StepUp',
        email: 'contacto@stepup.com',
        phone: '+57 300 123 4567',
        address: 'Calle 123 #45-67, Bogotá'
    });

    const [systemConfig, setSystemConfig] = useState({
        minStock: 5,
        currency: 'COP',
        taxRate: 19
    });

    // Estados adicionales para funcionalidades del administrador
    const [confirmDeleteProductId, setConfirmDeleteProductId] = useState<number | null>(null);

    // Funciones para gestión de categorías
    const handleCreateCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        const name = newCategoryName.trim();
        if (!name) return;

        // Verificar si la categoría ya existe (insensible a mayúsculas/minúsculas)
        const exists = categories.some(cat => (cat.name || '').trim().toLowerCase() === name.toLowerCase());
        if (exists) {
            toast({ 
                title: 'Error', 
                description: 'Ya existe una categoría con ese nombre',
                variant: 'destructive'
            });
            return;
        }

        // Guardar en la base de datos
        const { data, error } = await supabase
            .from('categories')
            .insert({ name })
            .select('id, name')
            .single();

        if (error) {
            toast({ 
                title: 'Error', 
                description: error.message,
                variant: 'destructive'
            });
            return;
        }

        // Actualizar estado local y limpiar formulario
        setCategories(prev => [...prev, { id: data.id, name: data.name }]);
        setNewCategoryName('');
        setShowCreateCategoryModal(false);
        toast({ 
            title: 'Categoría creada', 
            description: `La categoría "${data.name}" ha sido creada exitosamente`
        });
    };

    const handleEditCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        const name = editCategoryName.trim();
        if (!name || !editingCategory) return;

        // Verificar si la nueva categoría ya existe (ignorando la actual)
        const exists = categories.some(cat => cat.id !== editingCategory && (cat.name || '').trim().toLowerCase() === name.toLowerCase());
        if (exists) {
            toast({ 
                title: 'Error', 
                description: 'Ya existe una categoría con ese nombre',
                variant: 'destructive'
            });
            return;
        }

        // Actualizar en la base de datos
        const { error } = await supabase
            .from('categories')
            .update({ name })
            .eq('id', editingCategory);
        if (error) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
            return;
        }

        // Actualizar estado local: categorías y productos mostrados
        setCategories(prev => prev.map(c => c.id === editingCategory ? { ...c, name } : c));
        const updatedProducts = products.map(p => 
            p.category === editingCategory 
                ? { ...p, category: editingCategory, category_name: name }
                : p
        );
        setProducts(updatedProducts);

        toast({ 
            title: 'Categoría actualizada', 
            description: `La categoría ha sido renombrada a "${name}"`
        });
        
        setEditingCategory(null);
        setEditCategoryName('');
        setShowEditCategoryModal(false);
    };

    const handleDeleteCategory = async () => {
        if (!confirmDeleteCategory) return;
        const categoryName = categories.find(c => c.id === confirmDeleteCategory)?.name || confirmDeleteCategory;
        
        // Verificar que no hay productos con esta categoría
    const productsWithCategory = products.filter(p => p.category === confirmDeleteCategory);
        if (productsWithCategory.length > 0) {
            toast({ 
                title: 'Error', 
                description: `No se puede eliminar la categoría "${categoryName}" porque tiene productos asignados`,
                variant: 'destructive'
            });
            return;
        }

        // Eliminar de la base de datos
        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', confirmDeleteCategory);
        if (error) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
            return;
        }

        // Actualizar estado local y filtros si estaban apuntando a la categoría eliminada
        setCategories(prev => prev.filter(c => c.id !== confirmDeleteCategory));
        if (filterCategory === confirmDeleteCategory) {
            setFilterCategory(dbAllCategoryId ?? 'all');
        }

        toast({ 
            title: 'Categoría eliminada', 
            description: `La categoría "${categoryName}" ha sido eliminada con éxito`
        });
        
        setConfirmDeleteCategory(null);
    };

    // Funciones para configuración
    const handleSaveConfiguration = async () => {
        // Aquí guardarías la configuración en la base de datos
        // Por ahora solo mostramos un mensaje de éxito
        toast({ 
            title: 'Configuración guardada', 
            description: 'Los cambios se han guardado exitosamente'
        });
    };

    const handleExportData = async () => {
        // Helpers para CSV compatible con Excel
        const delimiter = ";";
        const newline = "\r\n";
        const escapeCell = (val: unknown) => {
            if (val === null || val === undefined) return "";
            if (typeof val === "boolean") return val ? "Sí" : "No";
            let s = String(val);
            s = s.replace(/"/g, '""');
            return `"${s}"`;
        };
        const buildCsv = (headers: string[], rows: unknown[][]) => {
            const body = [headers, ...rows].map(r => r.map(escapeCell).join(delimiter)).join(newline);
            return "\uFEFF" + body + newline; // BOM + CRLF
        };

        // Construir CSVs
        const productsHeaders = ["ID", "Nombre", "Categoría", "Stock", "Stock mínimo", "Precio", "Activo"];
        const productsRows = products.map(p => [p.id, p.name, p.category_name, p.stock, p.stock_minimo, p.price, p.active !== false]);
        const productsCsv = buildCsv(productsHeaders, productsRows);

        const usersHeaders = ["Auth ID", "Identificación", "Nombre", "Email", "Teléfono", "Creado", "Actualizado", "Último login", "Verificado", "# Logins", "# Pedidos"];
        const usersRows = userData.map(u => [u.auth_id, u.identification, u.full_name, u.email, u.phone, u.created_at, u.updated_at, u.last_login, u.email_verified, u.login_count, u.order_count]);
        const usersCsv = buildCsv(usersHeaders, usersRows);

        const ordersHeaders = ["ID", "Usuario", "Estado", "Total", "Dirección", "Teléfono", "Método pago", "Estado pago", "Creado"];
        const ordersRows = ordersData.map(o => [o.id, o.user_id, o.status, o.total, o.address, o.phone, o.payment_method, o.payment_status, o.created_at]);
        const ordersCsv = buildCsv(ordersHeaders, ordersRows);

        const invHeaders = ["ID", "Producto ID", "Producto", "Tipo", "Cantidad", "Fecha", "Usuario"];
        const invRows = inventoryMovements.map(h => [h.id, h.product_id, h.product_name, h.tipo, h.cantidad, h.fecha, h.usuario_nombre || ""]);
        const invCsv = buildCsv(invHeaders, invRows);

    // Crear ZIP y descargar
        const zip = new JSZip();
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const ts = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    zip.file(`productos-${ts}.csv`, productsCsv);
    zip.file(`usuarios-${ts}.csv`, usersCsv);
    zip.file(`pedidos-${ts}.csv`, ordersCsv);
    zip.file(`inventario-${ts}.csv`, invCsv);
        const content = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = `stepup-datos-${new Date().toISOString().split('T')[0]}.zip`;
        a.click();
        URL.revokeObjectURL(url);

        toast({ title: 'Datos exportados', description: 'Se descargó un ZIP con CSVs compatibles con Excel' });
    };

    // Función para activar/desactivar productos
    const handleToggleProductActive = async (productId: number, newActiveState: boolean) => {
        const { error } = await supabase
            .from('products')
            .update({ active: newActiveState })
            .eq('id', productId);

        if (!error) {
            setProducts(products.map(p => 
                p.id === productId ? { ...p, active: newActiveState } : p
            ));
            toast({ 
                title: `Producto ${newActiveState ? 'activado' : 'desactivado'}`,
                description: 'El estado del producto se ha actualizado'
            });
        } else {
            toast({ 
                title: 'Error', 
                description: 'No se pudo actualizar el estado del producto',
                variant: 'destructive'
            });
        }
    };

    // Función para eliminar producto (eliminamos la duplicada)


    // Actualizar inventario y registrar movimiento
    const [confirmMovementOpen, setConfirmMovementOpen] = useState(false);

    // Función que ejecuta realmente la actualización de inventario (reutilizable)
    const performInventoryMovement = async () => {
        if (!selectedProductId) return toast({ title: 'Selecciona un producto' });
        const prod = products.find(p => p.id === selectedProductId);
        if (!prod) return toast({ title: 'Producto no encontrado' });
        const qtyNum = Number(movementQty);
        if (!movementQty || isNaN(qtyNum) || qtyNum < 1) {
            setQtyError('La cantidad debe ser un número mayor a 0');
            return;
        }
        setQtyError(null);

        // Calcular nuevo stock total del producto
        let newStock = prod.stock;
        if (movementType === 'venta') newStock -= qtyNum;
        if (movementType === 'devolucion' || movementType === 'reposicion') newStock += qtyNum;
        if (newStock < 0) return toast({ title: 'No se permiten cantidades negativas en inventario', variant: 'destructive' });

        // Si hay una talla seleccionada, actualizar también la variante
        let newVariantStock: number | null = null;
        if (selectedSizeForMovement) {
            const variant = productVariantOptions.find(v => v.id_talla === selectedSizeForMovement);
            if (!variant) return toast({ title: 'Talla no encontrada para este producto', variant: 'destructive' });
            newVariantStock = variant.stock;
            if (movementType === 'venta') newVariantStock -= qtyNum;
            if (movementType === 'devolucion' || movementType === 'reposicion') newVariantStock += qtyNum;
            if (newVariantStock < 0) return toast({ title: 'No hay suficiente stock en la talla seleccionada', variant: 'destructive' });

            // Actualizar la variante en DB
            const { error: variantUpdateErr } = await supabase
                .from('products_variants')
                .update({ stock: newVariantStock })
                .match({ id_producto: prod.id, id_talla: selectedSizeForMovement });
            if (variantUpdateErr) {
                toast({ title: 'Error', description: 'No se pudo actualizar la talla seleccionada', variant: 'destructive' });
                return;
            }
        }

        // Actualiza el stock total en la tabla products
        const { error: updateError } = await supabase
            .from('products')
            .update({ stock: newStock })
            .eq('id', prod.id);
        if (updateError) {
            toast({ title: 'Error al actualizar stock', description: updateError.message, variant: 'destructive' });
            return;
        }

        // Actualizar estado local de variantes y producto
        setProducts(prev => prev.map(p => p.id === prod.id ? { ...p, stock: newStock } : p));
        if (newVariantStock !== null) {
            setProductVariantOptions(prev => prev.map(v => v.id_talla === selectedSizeForMovement ? { ...v, stock: newVariantStock as number } : v));
            // actualizar mapa de variantes por producto para filtros (si aplica)
            setVariantsByProduct(prev => {
                const next = { ...prev };
                const names = (productVariantOptions || [])
                    .map(v => ({ name: v.nombre_talla, stock: v.id_talla === selectedSizeForMovement ? newVariantStock : v.stock }))
                    .filter(x => x.stock > 0)
                    .map(x => x.name);
                next[prod.id] = names;
                return next;
            });
        }

        // Obtener el nombre del usuario actual (ajusta según tu lógica de autenticación)
        const usuario_nombre = userData.find(u => u.auth_id === supabase.auth.getUser()?.data?.user?.id)?.full_name || 'Desconocido';

        // Registrar en historial (adjuntamos la talla al nombre del producto si fue seleccionada)
        const tallaNombre = selectedSizeForMovement ? productVariantOptions.find(v => v.id_talla === selectedSizeForMovement)?.nombre_talla : null;
        const productNameForHistory = tallaNombre ? `${prod.name} (${tallaNombre})` : prod.name;

        const { error: historyError } = await supabase
            .from('inventory_history')
            .insert({
                product_id: prod.id,
                product_name: productNameForHistory,
                tipo: movementType,
                cantidad: qtyNum,
                fecha: new Date().toISOString(),
                usuario_nombre
            });
        if (historyError) {
            toast({ title: 'Error al registrar historial', description: historyError.message, variant: 'destructive' });
            return;
        }

    // Toast más descriptivo
    const tallaNombreToast = selectedSizeForMovement ? ` (${productVariantOptions.find(v => v.id_talla === selectedSizeForMovement)?.nombre_talla})` : '';
    toast({ title: 'Inventario actualizado', description: `${movementType === 'venta' ? 'Venta' : movementType === 'reposicion' ? 'Reposición' : 'Devolución'} registrada: ${prod.name}${tallaNombreToast} — ${qtyNum} unidad${qtyNum === 1 ? '' : 'es'}. Nuevo stock: ${newStock}` });
        if (newStock < prod.stock_minimo) {
            setAlertStock(`¡Stock bajo para ${prod.name}! (${newStock} unidades, mínimo ${prod.stock_minimo})`);
        } else {
            setAlertStock(null);
        }
    };

    const handleInventoryMovement = async () => {
        // Para ventas pedimos confirmación
        if (movementType === 'venta') {
            setConfirmMovementOpen(true);
            return;
        }
        // Para otros tipos, ejecutar directamente
        await performInventoryMovement();
    };

    // Consulta de movimientos de inventario desde Supabase
    // Consulta de historial de inventario desde Supabase
    const fetchInventoryMovements = useCallback(async () => {
        const { data, error } = await supabase
            .from('inventory_history')
            .select('*');
        if (!error && data) {
            setInventoryMovements(data);
        } else {
            toast({ title: 'Error al cargar historial', description: error?.message, variant: 'destructive' });
        }
    }, [toast]);

    //Consulta del historial de movimientos de inventario
    const [inventoryHistory, setInventoryHistory] = useState([]);
    const fetchInventoryHistory = useCallback(async () => {
        const { data, error } = await supabase.from('inventory_history').select('*');
        if (!error && data) {
            setInventoryHistory(data);
        } else {
            toast({ title: 'Error al cargar historial', description: error?.message, variant: 'destructive' });
        }
    }, [toast]);
    const [viewOrder, setViewOrder] = useState<Order | null>(null);
    const [editOrder, setEditOrder] = useState<Order | null>(null);
    const [confirmDeleteUserId, setConfirmDeleteUserId] = useState<string | null>(null);
    const [confirmDeleteOrderId, setConfirmDeleteOrderId] = useState<string | null>(null);
    const [loadingAction, setLoadingAction] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState("dashboard");

    // Declarar ordersData antes del useEffect para evitar el error de uso antes de declaración
    const [userData, setUserData] = useState<User[]>([]);
    const [ordersData, setOrdersData] = useState<Order[]>([]);
    const [orderColumns, setOrderColumns] = useState<string[]>([]);
    const [siteStats, setSiteStats] = useState({ totalUsers: 0, totalOrders: 0 });
    const [dashboardKPIs, setDashboardKPIs] = useState({
        totalProducts: 0,
        lowStock: 0,
        salesThisMonth: 0,
        pendingOrders: 0,
        totalIncome: 0,
        recentOrders: [],
        notifications: []
    });

    // Usuarios: búsqueda, filtro y paginación
    const [userSearch, setUserSearch] = useState('');
    const [userVerifiedFilter, setUserVerifiedFilter] = useState<'all' | 'verified' | 'unverified'>('all');
    const [userSort, setUserSort] = useState<'name-asc' | 'name-desc' | 'created-newest' | 'created-oldest'>('created-newest');
    const [usersPage, setUsersPage] = useState(1);
    const usersPerPage = 10;
    const filteredUsers = React.useMemo(() => {
        const q = userSearch.trim().toLowerCase();
        let list = [...userData];
        if (q) {
            list = list.filter(u =>
                (u.full_name || '').toLowerCase().includes(q) ||
                (u.email || '').toLowerCase().includes(q) ||
                (u.phone || '').toLowerCase().includes(q)
            );
        }
        if (userVerifiedFilter === 'verified') list = list.filter(u => u.email_verified === true);
        if (userVerifiedFilter === 'unverified') list = list.filter(u => u.email_verified === false);
        // Ordenamiento
        const safeDate = (d: string | undefined) => d ? new Date(d).getTime() : 0;
        list.sort((a, b) => {
            switch (userSort) {
                case 'name-asc':
                    return (a.full_name || '').localeCompare(b.full_name || '');
                case 'name-desc':
                    return (b.full_name || '').localeCompare(a.full_name || '');
                case 'created-oldest':
                    return safeDate(a.created_at) - safeDate(b.created_at);
                case 'created-newest':
                default:
                    return safeDate(b.created_at) - safeDate(a.created_at);
            }
        });
        return list;
    }, [userData, userSearch, userVerifiedFilter, userSort]);
    const totalUsersPages = Math.ceil(filteredUsers.length / usersPerPage) || 1;
    const paginatedUsers = React.useMemo(() => {
        const start = (usersPage - 1) * usersPerPage;
        return filteredUsers.slice(start, start + usersPerPage);
    }, [filteredUsers, usersPage]);
    // Resetear a la primera página cuando cambien filtros/búsqueda
    useEffect(() => { setUsersPage(1); }, [userSearch, userVerifiedFilter, userSort]);

    // Calcular KPIs cuando cambian los datos relevantes
    useEffect(() => {
        // Total de productos
        const totalProducts = products.length;
        // Stock bajo o agotado
        const lowStock = products.filter(p => p.stock <= p.stock_minimo).length;
        // Ventas del mes (sumar total de pedidos completados este mes)
        const now = new Date();
        const month = now.getMonth();
        const year = now.getFullYear();
        const salesThisMonth = ordersData.filter(o => {
            const d = o.created_at ? new Date(o.created_at) : null;
            return d && d.getMonth() === month && d.getFullYear() === year && (o.status === 'Entregado' || o.status === 'Completado');
        }).length;
        // Pedidos pendientes
        const pendingOrders = ordersData.filter(o => o.status === 'Pendiente' || o.status === 'procesando').length;
        // Ingresos totales del mes
        const totalIncome = ordersData.filter(o => {
            const d = o.created_at ? new Date(o.created_at) : null;
            return d && d.getMonth() === month && d.getFullYear() === year && (o.status === 'Entregado' || o.status === 'Completado');
        }).reduce((acc, o) => acc + (o.total || 0), 0);
        // Últimas actividades/pedidos recientes (últimos 5)
        const recentOrders = [...ordersData].sort((a, b) => {
            const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
            return dateB - dateA;
        }).slice(0, 5);
        // Notificaciones importantes
        const notifications = [];
        if (lowStock > 0) notifications.push(`¡Hay ${lowStock} productos con stock bajo o agotado!`);
        setDashboardKPIs({
            totalProducts,
            lowStock,
            salesThisMonth,
            pendingOrders,
            totalIncome,
            recentOrders,
            notifications
        });
    }, [products, ordersData]);

    // (Ya declaradas arriba para evitar error de uso antes de declaración)
    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    // Estado para el formulario de edición de usuario y control del modal
    const [editForm, setEditForm] = useState<{ full_name?: string; email?: string; phone?: string }>({});
    const [editModalOpen, setEditModalOpen] = useState(false);
    // Fetch users: Obtiene la lista de usuarios desde Supabase
    const fetchUserData = async () => {
        const { data, error } = await supabase.from("users").select("*");
        if (!error) setUserData(data as User[]);
    };

    // Fetch orders
    const fetchOrdersData = async () => {
        const { data, error } = await supabase.from("orders").select("*");
        if (!error) {
            setOrdersData(data || []);
            if (data && data.length > 0) {
                setOrderColumns(Object.keys(data[0]));
            }
        }
    };

    // Fetch stats
    const fetchSiteStats = async () => {
        const { count: userCount } = await supabase.from("users").select("*", { count: "exact", head: true });
        const { count: orderCount } = await supabase.from("orders").select("*", { count: "exact", head: true });
        setSiteStats({
            totalUsers: userCount || 0,
            totalOrders: orderCount || 0,
        });
    };

    //Edit user
    const startEditUser = (user: User) => {
        setEditingUserId(user.auth_id);
        setEditForm({
            full_name: user.full_name,
            email: user.email,
            phone: user.phone,
        });
    };

    useEffect(() => {
        fetchUserData();
        fetchSiteStats();
        fetchOrdersData();
        fetchInventoryHistory();
        fetchInventoryMovements();
        fetchProducts();

        // Suscripción en tiempo real a la tabla users
        const usersChannel = supabase
            .channel('users-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'users' },
                () => {
                    fetchUserData();
                    fetchSiteStats();
                }
            )
            .subscribe();

        // Suscripción en tiempo real a la tabla orders
        const ordersChannel = supabase
            .channel('orders-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'orders' },
                () => {
                    fetchOrdersData();
                    fetchSiteStats();
                }
            )
            .subscribe();

    // ...existing code...
        // Suscripción en tiempo real a la tabla inventory_history
        const historyChannel = supabase
            .channel('inventory-history-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'inventory_history' },
                () => {
                    fetchInventoryMovements(); // Actualiza la tabla principal de historial
                }
            )
            .subscribe();

        // Suscripción en tiempo real a la tabla products
        const productsChannel = supabase
            .channel('products-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'products' },
                (payload) => {
                    console.log('[Realtime] Cambio detectado en products:', payload);
                    fetchProducts();
                }
            )
            .subscribe();

        // Limpieza al desmontar
        return () => {
            supabase.removeChannel(usersChannel);
            supabase.removeChannel(ordersChannel);
            supabase.removeChannel(productsChannel);
            supabase.removeChannel(historyChannel);
        };
    }, [fetchInventoryHistory, fetchInventoryMovements, fetchProducts]);

    // Delete user
    const handleDeleteUser = async (auth_id: string) => {
        await supabase.from("users").delete().eq("auth_id", auth_id);
        toast({ title: "Usuario eliminado" });
        fetchUserData();
        fetchSiteStats();
    };

    // Save user edits
    const saveEditUser = async (auth_id: string) => {
        const { error } = await supabase
            .from("users")
            .update(editForm)
            .eq("auth_id", auth_id);

        if (!error) {
            toast({ title: "Usuario actualizado" });
            setEditingUserId(null);
            setEditForm({});
            fetchUserData();
        } else {
            toast({ title: "Error al actualizar", description: error.message, variant: "destructive" });
        }
    };

    // Actualizar estado del pedido
    const handleUpdateOrderStatus = async (id: string, status: string) => {
        const { error } = await supabase.from("orders").update({ status }).eq("id", id);
        if (!error) {
            toast({ title: "Estado actualizado", description: `Pedido marcado como ${status}` });
        } else {
            toast({ title: "Error al actualizar pedido", description: error.message, variant: "destructive" });
        }
    };

    // Eliminar pedido
    const handleDeleteOrder = async (id: string) => {
        const { error } = await supabase.from("orders").delete().eq("id", id);
        if (!error) {
            toast({ title: "Pedido eliminado" });
        } else {
            toast({ title: "Error al eliminar pedido", description: error.message, variant: "destructive" });
        }
    };

    // Estados de paginación
    const [ordersPage, setOrdersPage] = useState(1);
    const ordersPerPage = 10;
    const totalOrdersPages = Math.ceil(ordersData.length / ordersPerPage);
    const paginatedOrders = ordersData.slice((ordersPage - 1) * ordersPerPage, ordersPage * ordersPerPage);

    const [productsPage, setProductsPage] = useState(1);
    const productsPerPage = 10;
    const totalProductsPages = Math.ceil(filteredProducts.length / productsPerPage);
    const paginatedProducts = filteredProducts.slice((productsPage - 1) * productsPerPage, productsPage * productsPerPage);

    // Deshabilitar Confirmar si la cantidad es inválida o excede el stock de la talla (en ventas)
    const parsedQty = Number(movementQty);
    const selectedVariantStock = selectedSizeForMovement ? (productVariantOptions.find(v => v.id_talla === selectedSizeForMovement)?.stock ?? 0) : null;
    const confirmDisabled = !movementQty || isNaN(parsedQty) || parsedQty < 1 || (movementType === 'venta' && selectedVariantStock !== null && parsedQty > selectedVariantStock);

    return (
        <div className="min-h-screen bg-background">
            <Navbar cartItems={0} onCartClick={() => {}} onContactClick={() => {}} onFavoritesClick={() => {}} />
            <main className="pt-24 px-4 sm:px-6 lg:px-8 pb-16">
                <div className="w-[70vw] mx-auto">
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold">
                            <span className="gradient-text">Panel</span> de Administración
                        </h1>
                        <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
                            Gestiona usuarios, pedidos y estadísticas del sitio
                        </p>
                    </div>

                    <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6 lg:space-y-8">
                        <div className="overflow-x-auto overflow-y-hidden scrollbar-hide">
                            <TabsList className="flex items-center justify-start gap-2 sm:gap-4 px-2 py-2 bg-transparent border-0 min-w-max">
                                <TabsTrigger 
                                    value="dashboard" 
                                    className="admin-nav-link flex items-center gap-1 sm:gap-2 text-foreground hover:text-primary transition-all duration-300 hover:scale-105 px-2 sm:px-3 py-2 data-[state=active]:text-primary text-sm sm:text-base whitespace-nowrap flex-shrink-0"
                                >
                                    <BarChart className="h-3 w-3 sm:h-4 sm:w-4" />
                                    <span className="font-medium">Dashboard</span>
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="users"
                                    className="admin-nav-link flex items-center gap-1 sm:gap-2 text-foreground hover:text-primary transition-all duration-300 hover:scale-105 px-2 sm:px-3 py-2 data-[state=active]:text-primary text-sm sm:text-base whitespace-nowrap flex-shrink-0"
                                >
                                    <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                                    <span className="font-medium">Usuarios</span>
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="orders"
                                    className="admin-nav-link flex items-center gap-1 sm:gap-2 text-foreground hover:text-primary transition-all duration-300 hover:scale-105 px-2 sm:px-3 py-2 data-[state=active]:text-primary text-sm sm:text-base whitespace-nowrap flex-shrink-0"
                                >
                                    <ShoppingBag className="h-3 w-3 sm:h-4 sm:w-4" />
                                    <span className="font-medium">Pedidos</span>
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="inventory"
                                    className="admin-nav-link flex items-center gap-1 sm:gap-2 text-foreground hover:text-primary transition-all duration-300 hover:scale-105 px-2 sm:px-3 py-2 data-[state=active]:text-primary text-sm sm:text-base whitespace-nowrap flex-shrink-0"
                                >
                                    <Warehouse className="h-3 w-3 sm:h-4 sm:w-4" />
                                    <span className="font-medium">Inventario</span>
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="products"
                                    className="admin-nav-link flex items-center gap-1 sm:gap-2 text-foreground hover:text-primary transition-all duration-300 hover:scale-105 px-2 sm:px-3 py-2 data-[state=active]:text-primary text-sm sm:text-base whitespace-nowrap flex-shrink-0"
                                >
                                    <Store className="h-3 w-3 sm:h-4 sm:w-4" />
                                    <span className="font-medium">Productos</span>
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="stats"
                                    className="admin-nav-link flex items-center gap-1 sm:gap-2 text-foreground hover:text-primary transition-all duration-300 hover:scale-105 px-2 sm:px-3 py-2 data-[state=active]:text-primary text-sm sm:text-base whitespace-nowrap flex-shrink-0"
                                >
                                    <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
                                    <span className="font-medium">Estadísticas</span>
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="categories"
                                    className="admin-nav-link flex items-center gap-1 sm:gap-2 text-foreground hover:text-primary transition-all duration-300 hover:scale-105 px-2 sm:px-3 py-2 data-[state=active]:text-primary text-sm sm:text-base whitespace-nowrap flex-shrink-0"
                                >
                                    <Package className="h-3 w-3 sm:h-4 sm:w-4" />
                                    <span className="font-medium">Categorías</span>
                                </TabsTrigger>
                            </TabsList>
                        </div>
                        {/* Dashboard */}
                        <TabsContent value="dashboard" className="space-y-4 sm:space-y-6">
                            <Card className="glass border-white/20">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                                        <BarChart className="h-4 w-4 sm:h-5 sm:w-5" />
                                        Dashboard Principal
                                    </CardTitle>
                                    <CardDescription className="text-sm sm:text-base">Panel de control con métricas clave del negocio</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
                                        <div 
                                            className="group cursor-pointer flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-4 sm:p-6 bg-gradient-to-r from-blue-500/10 to-blue-600/10 rounded-xl border border-blue-500/20 hover:border-blue-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20"
                                            onClick={() => setActiveTab("products")}
                                        >
                                            <div className="p-2 sm:p-3 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors">
                                                <Store className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="text-xl sm:text-2xl font-bold text-blue-500">{dashboardKPIs.totalProducts}</div>
                                                <div className="text-muted-foreground text-sm sm:text-base">Total productos</div>
                                                <div className="flex items-center text-xs text-blue-600 mt-1">
                                                    <ArrowRight className="h-3 w-3 mr-1" />
                                                    Ver productos
                                                </div>
                                            </div>
                                        </div>
                                        <div 
                                            className="group cursor-pointer flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-4 sm:p-6 bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 rounded-xl border border-yellow-500/20 hover:border-yellow-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-yellow-500/20"
                                            onClick={() => setActiveTab("inventory")}
                                        >
                                            <div className="p-2 sm:p-3 bg-yellow-500/20 rounded-lg group-hover:bg-yellow-500/30 transition-colors">
                                                <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="text-xl sm:text-2xl font-bold text-yellow-500">{dashboardKPIs.lowStock}</div>
                                                <div className="text-muted-foreground text-sm sm:text-base">Stock bajo o agotado</div>
                                                <div className="flex items-center text-xs text-yellow-600 mt-1">
                                                    <ArrowRight className="h-3 w-3 mr-1" />
                                                    Ver inventario
                                                </div>
                                            </div>
                                        </div>
                                        <div 
                                            className="group cursor-pointer flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-4 sm:p-6 bg-gradient-to-r from-green-500/10 to-green-600/10 rounded-xl border border-green-500/20 hover:border-green-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/20"
                                            onClick={() => setActiveTab("stats")}
                                        >
                                            <div className="p-2 sm:p-3 bg-green-500/20 rounded-lg group-hover:bg-green-500/30 transition-colors">
                                                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="text-xl sm:text-2xl font-bold text-green-500">{dashboardKPIs.salesThisMonth}</div>
                                                <div className="text-muted-foreground text-sm sm:text-base">Ventas del mes</div>
                                                <div className="flex items-center text-xs text-green-600 mt-1">
                                                    <ArrowRight className="h-3 w-3 mr-1" />
                                                    Ver estadísticas
                                                </div>
                                            </div>
                                        </div>
                                        <div 
                                            className="group cursor-pointer flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-4 sm:p-6 bg-gradient-to-r from-purple-500/10 to-purple-600/10 rounded-xl border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20"
                                            onClick={() => setActiveTab("orders")}
                                        >
                                            <div className="p-2 sm:p-3 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition-colors">
                                                <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="text-xl sm:text-2xl font-bold text-purple-500">{dashboardKPIs.pendingOrders}</div>
                                                <div className="text-muted-foreground text-sm sm:text-base">Pedidos pendientes</div>
                                                <div className="flex items-center text-xs text-purple-600 mt-1">
                                                    <ArrowRight className="h-3 w-3 mr-1" />
                                                    Ver pedidos
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Income Card */}
                                    <div className="mb-8">
                                        <div className="bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 p-6 rounded-xl border border-emerald-500/20">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-emerald-500/20 rounded-lg">
                                                    <DollarSign className="h-6 w-6 text-emerald-500" />
                                                </div>
                                                <div>
                                                    <div className="text-3xl font-bold text-emerald-500">
                                                        {dashboardKPIs.totalIncome.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}
                                                    </div>
                                                    <div className="text-muted-foreground">Ingresos del mes</div>
                                                    <div className="flex items-center text-xs text-emerald-600 mt-1">
                                                        <Activity className="h-3 w-3 mr-1" />
                                                        Ingresos totales
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Recent Activity */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {/* Recent Orders */}
                                        <div className="bg-card/30 p-6 rounded-xl border border-white/10">
                                            <h3 className="font-semibold mb-4 flex items-center gap-2">
                                                <Clock className="h-5 w-5 text-blue-500" />
                                                Pedidos Recientes
                                            </h3>
                                            <div className="space-y-3">
                                                {dashboardKPIs.recentOrders.length === 0 ? (
                                                    <p className="text-muted-foreground text-sm">No hay pedidos recientes</p>
                                                ) : (
                                                    dashboardKPIs.recentOrders.slice(0, 5).map((order, idx) => (
                                                        <div key={order.id || idx} className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-white/5 hover:bg-white/5 transition-colors">
                                                            <div>
                                                                <p className="font-medium">#{order.id}</p>
                                                                <p className="text-sm text-muted-foreground">{order.status}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="font-medium">{order.total ? `$${order.total.toFixed(2)}` : ''}</p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {order.created_at ? new Date(order.created_at).toLocaleDateString() : ''}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>

                                        {/* Notifications */}
                                        <div className="bg-card/30 p-6 rounded-xl border border-white/10">
                                            <h3 className="font-semibold mb-4 flex items-center gap-2">
                                                <Bell className="h-5 w-5 text-yellow-500" />
                                                Notificaciones
                                                {dashboardKPIs.notifications.length > 0 && (
                                                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                                                        {dashboardKPIs.notifications.length}
                                                    </span>
                                                )}
                                            </h3>
                                            <div className="space-y-3">
                                                {dashboardKPIs.notifications.length === 0 ? (
                                                    <div className="flex items-center gap-2 text-green-600">
                                                        <CheckCircle className="h-4 w-4" />
                                                        <span className="text-sm">Todo está en orden</span>
                                                    </div>
                                                ) : (
                                                    dashboardKPIs.notifications.slice(0, 5).map((notification, idx) => (
                                                        <div key={idx} className="flex items-start gap-3 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                                                            <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                                                            <span className="text-sm">{notification}</span>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Usuarios */}
                        <TabsContent value="users" className="space-y-4 sm:space-y-6">
                            <Card className="glass border-white/20">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                                        <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                                        Gestión de Usuarios
                                    </CardTitle>
                                    <CardDescription className="text-left text-sm sm:text-base">
                                        Administra la información de los usuarios
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {/* Controles de búsqueda y filtro (Usuarios) */}
                                    <div className="flex flex-col sm:flex-row gap-3 mb-4">
                                        <div className="flex-1">
                                            <Input
                                                placeholder="Buscar por nombre, email o teléfono..."
                                                value={userSearch}
                                                onChange={e => setUserSearch(e.target.value)}
                                                className="glass border-white/20"
                                            />
                                        </div>
                                        <Select value={userVerifiedFilter} onValueChange={(v: 'all'|'verified'|'unverified') => setUserVerifiedFilter(v)}>
                                            <SelectTrigger className="w-full sm:w-48 glass border-white/20">
                                                <SelectValue placeholder="Estado" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Todos</SelectItem>
                                                <SelectItem value="verified">Verificados</SelectItem>
                                                <SelectItem value="unverified">No verificados</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Select value={userSort} onValueChange={(v: 'name-asc'|'name-desc'|'created-newest'|'created-oldest') => setUserSort(v)}>
                                            <SelectTrigger className="w-full sm:w-56 glass border-white/20">
                                                <SelectValue placeholder="Ordenar por" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="created-newest">Más recientes</SelectItem>
                                                <SelectItem value="created-oldest">Más antiguos</SelectItem>
                                                <SelectItem value="name-asc">Nombre A–Z</SelectItem>
                                                <SelectItem value="name-desc">Nombre Z–A</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {/* Vista móvil - Cards */}
                                    <div className="block lg:hidden space-y-4">
                                        {paginatedUsers.length > 0 ? (
                                            paginatedUsers.map((user) => (
                                                <div key={user.auth_id} className="bg-card rounded-xl border border-white/10 p-4 space-y-3">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="font-semibold text-sm sm:text-base truncate">{user.full_name || 'Sin nombre'}</h3>
                                                            <p className="text-xs sm:text-sm text-muted-foreground truncate">{user.email}</p>
                                                            <p className="text-xs sm:text-sm text-muted-foreground">{user.phone || 'Sin teléfono'}</p>
                                                        </div>
                                                        <div className="flex flex-col gap-2 ml-2">
                                                            <Button 
                                                                size="sm" 
                                                                variant="outline" 
                                                                className="text-xs min-h-[40px] px-3 py-2 touch-manipulation"
                                                                onClick={() => { 
                                                                    startEditUser(user); 
                                                                    setEditModalOpen(true); 
                                                                }}
                                                            >
                                                                Editar
                                                            </Button>
                                                            <Button 
                                                                size="sm" 
                                                                variant="destructive" 
                                                                className="text-xs min-h-[40px] px-3 py-2 touch-manipulation"
                                                                onClick={() => setConfirmDeleteUserId(user.auth_id)}
                                                                disabled={loadingAction === user.auth_id}
                                                            >
                                                                Eliminar
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/10">
                                                        <div>
                                                            <p className="text-xs text-muted-foreground">Pedidos</p>
                                                            <p className="font-medium text-sm">{user.order_count || 0}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-muted-foreground">Verificado</p>
                                                            <p className={`font-medium text-sm ${user.email_verified ? 'text-green-600' : 'text-red-500'}`}>
                                                                {user.email_verified ? 'Sí' : 'No'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="flex flex-col items-center gap-3 py-12 text-center">
                                                <Users className="h-12 w-12 text-muted-foreground/50" />
                                                <div>
                                                    <p className="font-medium">No hay usuarios registrados</p>
                                                    <p className="text-sm text-muted-foreground">Los usuarios aparecerán aquí cuando se registren</p>
                                                </div>
                                            </div>
                                        )}
                                        {/* Paginación móvil */}
                                        {totalUsersPages > 1 && (
                                            <div className="flex justify-center items-center gap-2 p-3">
                                                <Button size="sm" variant="outline" className="flex-1" disabled={usersPage === 1} onClick={() => setUsersPage(usersPage - 1)}>Anterior</Button>
                                                <span className="text-sm text-muted-foreground whitespace-nowrap">{usersPage} / {totalUsersPages}</span>
                                                <Button size="sm" variant="outline" className="flex-1" disabled={usersPage === totalUsersPages} onClick={() => setUsersPage(usersPage + 1)}>Siguiente</Button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Vista desktop - Cards */}
                                    <div className="hidden lg:block">
                                        {paginatedUsers.length > 0 ? (
                                            <div className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                                                {paginatedUsers.map((user) => (
                                                    <div key={user.auth_id} className="bg-card rounded-xl border border-white/10 p-4 space-y-3">
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex-1 min-w-0">
                                                                <h3 className="font-semibold text-base truncate">{user.full_name || 'Sin nombre'}</h3>
                                                                <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                                                                <p className="text-sm text-muted-foreground">{user.phone || 'Sin teléfono'}</p>
                                                            </div>
                                                            <div className="flex flex-col gap-2 ml-2">
                                                                <Button 
                                                                    size="sm" 
                                                                    variant="outline" 
                                                                    className="min-h-[40px] px-3 py-2"
                                                                    onClick={() => { 
                                                                        startEditUser(user); 
                                                                        setEditModalOpen(true); 
                                                                    }}
                                                                >
                                                                    Editar
                                                                </Button>
                                                                <Button 
                                                                    size="sm" 
                                                                    variant="destructive" 
                                                                    className="min-h-[40px] px-3 py-2"
                                                                    onClick={() => setConfirmDeleteUserId(user.auth_id)}
                                                                    disabled={loadingAction === user.auth_id}
                                                                >
                                                                    Eliminar
                                                                </Button>
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/10">
                                                            <div>
                                                                <p className="text-xs text-muted-foreground">Pedidos</p>
                                                                <p className="font-medium text-sm">{user.order_count || 0}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-muted-foreground">Verificado</p>
                                                                <p className={`font-medium text-sm ${user.email_verified ? 'text-green-600' : 'text-red-500'}`}>
                                                                    {user.email_verified ? 'Sí' : 'No'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        {/* Modal editar usuario */}
                                                        <Dialog open={editModalOpen && editingUserId === user.auth_id} onOpenChange={(open) => {
                                                            setEditModalOpen(open);
                                                            if (!open) { setEditingUserId(null); setEditForm({}); }
                                                        }}>
                                                            <DialogTrigger asChild></DialogTrigger>
                                                            <DialogContent>
                                                                <DialogHeader>
                                                                    <DialogTitle>Editar Usuario</DialogTitle>
                                                                    <DialogDescription>Modifica los datos del usuario y guarda los cambios.</DialogDescription>
                                                                </DialogHeader>
                                                                <form onSubmit={e => { e.preventDefault(); saveEditUser(user.auth_id); }} className="space-y-4">
                                                                    <div>
                                                                        <Label htmlFor="edit-fullname">Nombre</Label>
                                                                        <Input
                                                                            id="edit-fullname"
                                                                            type="text"
                                                                            className="glass border-white/20"
                                                                            value={editForm.full_name || ''}
                                                                            onChange={e => setEditForm({ ...editForm, full_name: e.target.value })}
                                                                            required
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <Label htmlFor="edit-email">Email</Label>
                                                                        <Input
                                                                            id="edit-email"
                                                                            type="email"
                                                                            className="glass border-white/20"
                                                                            value={editForm.email || ''}
                                                                            onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                                                                            required
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <Label htmlFor="edit-phone">Teléfono</Label>
                                                                        <Input
                                                                            id="edit-phone"
                                                                            type="text"
                                                                            className="glass border-white/20"
                                                                            value={editForm.phone || ''}
                                                                            onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                                                                        />
                                                                    </div>
                                                                    <DialogFooter className="flex gap-2 justify-end">
                                                                        <Button type="submit" size="sm" variant="default">Guardar</Button>
                                                                        <DialogClose asChild>
                                                                            <Button type="button" size="sm" variant="outline" onClick={() => { setEditingUserId(null); setEditForm({}); setEditModalOpen(false); }}>Cancelar</Button>
                                                                        </DialogClose>
                                                                    </DialogFooter>
                                                                </form>
                                                            </DialogContent>
                                                        </Dialog>
                                                        {/* Modal confirmación eliminar usuario */}
                                                        <Dialog open={confirmDeleteUserId === user.auth_id} onOpenChange={(open) => { if (!open) setConfirmDeleteUserId(null); }}>
                                                            <DialogContent>
                                                                <DialogHeader>
                                                                    <DialogTitle>¿Eliminar usuario?</DialogTitle>
                                                                    <DialogDescription>Esta acción no se puede deshacer.</DialogDescription>
                                                                </DialogHeader>
                                                                <DialogFooter>
                                                                    <Button variant="destructive" size="sm" disabled={loadingAction === user.auth_id} onClick={async () => {
                                                                        setLoadingAction(user.auth_id);
                                                                        await handleDeleteUser(user.auth_id);
                                                                        setLoadingAction(null);
                                                                        setConfirmDeleteUserId(null);
                                                                    }}>Eliminar</Button>
                                                                    <DialogClose asChild>
                                                                        <Button size="sm" variant="outline" onClick={() => setConfirmDeleteUserId(null)}>Cancelar</Button>
                                                                    </DialogClose>
                                                                </DialogFooter>
                                                            </DialogContent>
                                                        </Dialog>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-3 py-12 text-center">
                                                <Users className="h-12 w-12 text-muted-foreground/50" />
                                                <div>
                                                    <p className="font-medium">No hay usuarios registrados</p>
                                                    <p className="text-sm text-muted-foreground">Los usuarios aparecerán aquí cuando se registren</p>
                                                </div>
                                            </div>
                                        )}
                                        {/* Paginación desktop */}
                                        {totalUsersPages > 1 && (
                                            <div className="flex justify-center items-center gap-2 p-3">
                                                <Button size="sm" variant="outline" disabled={usersPage === 1} onClick={() => setUsersPage(usersPage - 1)}>Anterior</Button>
                                                <span className="text-sm text-muted-foreground">Página {usersPage} de {totalUsersPages}</span>
                                                <Button size="sm" variant="outline" disabled={usersPage === totalUsersPages} onClick={() => setUsersPage(usersPage + 1)}>Siguiente</Button>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Pedidos */}
                        <TabsContent value="orders" className="space-y-4 sm:space-y-6">
                            <Card className="glass border-white/20">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                                        <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5" />
                                        Gestión de Pedidos
                                    </CardTitle>
                                    <CardDescription className="text-sm sm:text-base">
                                        Visualiza y gestiona todos los pedidos
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {/* Vista móvil - Cards */}
                                    <div className="block lg:hidden space-y-4">
                                        {paginatedOrders.length > 0 ? (
                                            paginatedOrders.map((order) => {
                                                const user = userData.find(u => u.auth_id === order.user_id);
                                                return (
                                                    <div key={order.id} className="bg-card rounded-xl border border-white/10 p-4 space-y-3">
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex-1 min-w-0">
                                                                <h3 className="font-semibold text-sm sm:text-base truncate">{user ? user.full_name : 'Usuario desconocido'}</h3>
                                                                <p className="text-xs sm:text-sm text-muted-foreground">#{order.id}</p>
                                                                <p className="text-sm sm:text-base font-medium text-green-600 mt-1">
                                                                    ${order.total?.toFixed(2)}
                                                                </p>
                                                            </div>
                                                            <div className="flex flex-col items-end gap-2">
                                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                                    order.status === 'Entregado' ? 'bg-green-100 text-green-800' :
                                                                    order.status === 'Pendiente' ? 'bg-yellow-100 text-yellow-800' :
                                                                    'bg-gray-100 text-gray-800'
                                                                }`}>
                                                                    {order.status}
                                                                </span>
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button 
                                                                            size="sm" 
                                                                            variant="outline" 
                                                                            className="h-10 px-3 min-h-[44px] touch-manipulation"
                                                                        >
                                                                            <ChevronDown className="h-4 w-4" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent>
                                                                        <DropdownMenuItem onClick={() => setViewOrder(order)}>Ver detalles</DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => setEditOrder(order)}>Editar</DropdownMenuItem>
                                                                        <DropdownMenuSeparator />
                                                                        <DropdownMenuItem onClick={() => handleUpdateOrderStatus(order.id, "Entregado")} disabled={loadingAction === order.id}>Marcar como entregado</DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => handleUpdateOrderStatus(order.id, "Pendiente")} disabled={loadingAction === order.id}>Marcar como pendiente</DropdownMenuItem>
                                                                        <DropdownMenuSeparator />
                                                                        <DropdownMenuItem onClick={() => setConfirmDeleteOrderId(order.id)} disabled={loadingAction === order.id} style={{ color: 'red' }}>Eliminar</DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-1 gap-2 pt-2 border-t border-white/10">
                                                            <div>
                                                                <p className="text-xs text-muted-foreground">Dirección</p>
                                                                <p className="font-medium text-sm truncate">{order.address}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-muted-foreground">Artículos</p>
                                                                <p className="font-medium text-sm truncate">
                                                                    {Array.isArray(order.items)
                                                                        ? order.items.map(i => `${i.name} x${i.qty}`).join(', ')
                                                                        : typeof order.items === 'string'
                                                                            ? order.items
                                                                            : 'Sin artículos'
                                                                    }
                                                                </p>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div>
                                                                    <p className="text-xs text-muted-foreground">Pago</p>
                                                                    <p className="font-medium text-sm">{order.payment_method}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs text-muted-foreground">Fecha</p>
                                                                    <p className="font-medium text-sm">{order.created_at ? new Date(order.created_at).toLocaleDateString() : ''}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="flex flex-col items-center gap-3 py-12 text-center">
                                                <ShoppingBag className="h-12 w-12 text-muted-foreground/50" />
                                                <div>
                                                    <p className="font-medium">No hay pedidos disponibles</p>
                                                    <p className="text-sm text-muted-foreground">Los pedidos aparecerán aquí cuando los usuarios hagan compras</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Vista desktop - Tabla */}
                                    <div className="hidden lg:block overflow-x-auto">
                                        <table className="min-w-full text-sm">
                                            <thead>
                                                <tr>
                                                    <th className="px-2 py-1 text-left">Usuario</th>
                                                    <th className="px-2 py-1 text-left">Estado</th>
                                                    <th className="px-2 py-1 text-left">Total</th>
                                                    <th className="px-2 py-1 text-left">Dirección</th>
                                                    <th className="px-2 py-1 text-left">Teléfono</th>
                                                    <th className="px-2 py-1 text-left">Artículos</th>
                                                    <th className="px-2 py-1 text-left">Método de pago</th>
                                                    <th className="px-2 py-1 text-left">Estado de pago</th>
                                                    <th className="px-2 py-1 text-left">Creado</th>
                                                    <th className="px-2 py-1 text-left">Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {paginatedOrders.map((order) => {
                                                    const user = userData.find(u => u.auth_id === order.user_id);
                                                    return (
                                                        <tr key={order.id}>
                                                            <td className="px-2 py-1">{user ? user.full_name : 'Desconocido'}</td>
                                                            <td className="px-2 py-1">{order.status}</td>
                                                            <td className="px-2 py-1">${order.total?.toFixed(2)}</td>
                                                            <td className="px-2 py-1">{order.address}</td>
                                                            <td className="px-2 py-1">{order.phone}</td>
                                                            <td className="px-2 py-1">{
                                                                Array.isArray(order.items)
                                                                    ? order.items.map(i => `${i.name} x${i.qty}`).join(', ')
                                                                    : typeof order.items === 'string'
                                                                        ? order.items
                                                                        : ''
                                                            }</td>
                                                            <td className="px-2 py-1">{order.payment_method}</td>
                                                            <td className="px-2 py-1">{order.payment_status}</td>
                                                            <td className="px-2 py-1">{order.created_at ? new Date(order.created_at).toLocaleString() : ''}</td>
                                                            <td className="px-2 py-1">
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button size="sm" variant="outline"><ChevronDown /></Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent>
                                                                        <DropdownMenuItem onClick={() => setViewOrder(order)}>Ver detalles</DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => setEditOrder(order)}>Editar</DropdownMenuItem>
                                                                        <DropdownMenuSeparator />
                                                                        <DropdownMenuItem onClick={() => handleUpdateOrderStatus(order.id, "Entregado")} disabled={loadingAction === order.id}>Marcar como entregado</DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => handleUpdateOrderStatus(order.id, "Pendiente")} disabled={loadingAction === order.id}>Marcar como pendiente</DropdownMenuItem>
                                                                        <DropdownMenuSeparator />
                                                                        <DropdownMenuItem onClick={() => setConfirmDeleteOrderId(order.id)} disabled={loadingAction === order.id} style={{ color: 'red' }}>Eliminar</DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                                {/* Modal ver detalles pedido */}
                                                                <Dialog open={viewOrder && viewOrder.id === order.id} onOpenChange={(open) => { if (!open) setViewOrder(null); }}>
                                                                    <DialogContent>
                                                                        <DialogHeader>
                                                                            <DialogTitle>Detalles del Pedido</DialogTitle>
                                                                        </DialogHeader>
                                                                        <div className="space-y-2">
                                                                            <div><b>Usuario:</b> {user ? user.full_name : 'Desconocido'}</div>
                                                                            <div><b>Estado:</b> {order.status}</div>
                                                                            <div><b>Total:</b> ${order.total?.toFixed(2)}</div>
                                                                            <div><b>Dirección:</b> {order.address}</div>
                                                                            <div><b>Teléfono:</b> {order.phone}</div>
                                                                            <div><b>Artículos:</b> {
                                                                                Array.isArray(order.items)
                                                                                    ? order.items.map(i => `${i.name} x${i.qty}`).join(', ')
                                                                                    : typeof order.items === 'string'
                                                                                        ? order.items
                                                                                        : ''
                                                                            }</div>
                                                                            <div><b>Método de pago:</b> {order.payment_method}</div>
                                                                            <div><b>Estado de pago:</b> {order.payment_status}</div>
                                                                            <div><b>Creado:</b> {order.created_at ? new Date(order.created_at).toLocaleString() : ''}</div>
                                                                        </div>
                                                                    </DialogContent>
                                                                </Dialog>
                                                                {/* Modal editar pedido */}
                                                                <Dialog open={editOrder && editOrder.id === order.id} onOpenChange={(open) => { if (!open) setEditOrder(null); }}>
                                                                    <DialogContent>
                                                                        <DialogHeader>
                                                                            <DialogTitle>Editar Pedido</DialogTitle>
                                                                        </DialogHeader>
                                                                        <form onSubmit={async e => {
                                                                            e.preventDefault();
                                                                            setLoadingAction(order.id);
                                                                            // Aquí puedes agregar lógica para editar el pedido
                                                                            setLoadingAction(null);
                                                                            setEditOrder(null);
                                                                            toast({ title: "Pedido actualizado" });
                                                                        }} className="space-y-4">
                                                                            <div>
                                                                                <Label htmlFor="edit-status">Estado</Label>
                                                                                <Input id="edit-status" type="text" defaultValue={order.status} />
                                                                            </div>
                                                                            <div>
                                                                                <Label htmlFor="edit-address">Dirección</Label>
                                                                                <Input id="edit-address" type="text" defaultValue={order.address} />
                                                                            </div>
                                                                            <DialogFooter className="flex gap-2 justify-end">
                                                                                <Button type="submit" size="sm" variant="default" disabled={loadingAction === order.id}>Guardar</Button>
                                                                                <DialogClose asChild>
                                                                                    <Button type="button" size="sm" variant="outline" onClick={() => setEditOrder(null)}>Cancelar</Button>
                                                                                </DialogClose>
                                                                            </DialogFooter>
                                                                        </form>
                                                                    </DialogContent>
                                                                </Dialog>
                                                                {/* Modal confirmación eliminar pedido */}
                                                                <Dialog open={confirmDeleteOrderId === order.id} onOpenChange={(open) => { if (!open) setConfirmDeleteOrderId(null); }}>
                                                                    <DialogContent>
                                                                        <DialogHeader>
                                                                            <DialogTitle>¿Eliminar pedido?</DialogTitle>
                                                                            <DialogDescription>Esta acción no se puede deshacer.</DialogDescription>
                                                                        </DialogHeader>
                                                                        <DialogFooter>
                                                                            <Button variant="destructive" size="sm" disabled={loadingAction === order.id} onClick={async () => {
                                                                                setLoadingAction(order.id);
                                                                                await handleDeleteOrder(order.id);
                                                                                setLoadingAction(null);
                                                                                setConfirmDeleteOrderId(null);
                                                                            }}>Eliminar</Button>
                                                                            <DialogClose asChild>
                                                                                <Button size="sm" variant="outline" onClick={() => setConfirmDeleteOrderId(null)}>Cancelar</Button>
                                                                            </DialogClose>
                                                                        </DialogFooter>
                                                                    </DialogContent>
                                                                </Dialog>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                    {/* Controles de paginación pedidos */}
                                    {totalOrdersPages > 1 && (
                                        <div className="flex justify-center items-center gap-2 sm:gap-3 p-3 sm:p-4 flex-wrap">
                                            <Button 
                                                size="sm" 
                                                variant="outline" 
                                                disabled={ordersPage === 1} 
                                                onClick={() => setOrdersPage(ordersPage - 1)}
                                                className="text-xs sm:text-sm px-4 py-2 min-h-[44px] touch-manipulation"
                                            >
                                                <span className="hidden sm:inline">Anterior</span>
                                                <span className="sm:hidden">←</span>
                                            </Button>
                                            <span className="text-xs sm:text-sm text-muted-foreground px-3 py-2 bg-muted/20 rounded border min-h-[44px] flex items-center">
                                                <span className="hidden sm:inline">Página {ordersPage} de {totalOrdersPages}</span>
                                                <span className="sm:hidden">{ordersPage}/{totalOrdersPages}</span>
                                            </span>
                                            <Button 
                                                size="sm" 
                                                variant="outline" 
                                                disabled={ordersPage === totalOrdersPages} 
                                                onClick={() => setOrdersPage(ordersPage + 1)}
                                                className="text-xs sm:text-sm px-4 py-2 min-h-[44px] touch-manipulation"
                                            >
                                                <span className="hidden sm:inline">Siguiente</span>
                                                <span className="sm:hidden">→</span>
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Estadísticas */}
                        {/* Inventario */}
                        <TabsContent value="inventory" className="space-y-4 sm:space-y-6">
                            <Card className="glass border-white/20">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                                        <Warehouse className="h-4 w-4 sm:h-5 sm:w-5" />
                                        Gestión de Inventario
                                    </CardTitle>
                                    <CardDescription className="text-left text-sm sm:text-base">Actualiza el stock y registra movimientos</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-col gap-4 sm:gap-6 items-stretch sm:items-end mb-6 p-3 sm:p-4 bg-card rounded-lg border border-white/20">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                                            <div className="space-y-2">
                                                <label className="block text-sm font-semibold text-muted-foreground">Producto</label>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="outline" className="w-full flex justify-between items-center px-2 py-2 text-left">
                                                            <span className="truncate text-xs sm:text-sm">
                                                                {selectedProductId
                                                                    ? products.find(p => p.id === selectedProductId)?.name + ` (Stock: ${products.find(p => p.id === selectedProductId)?.stock})`
                                                                    : 'Selecciona...'}
                                                            </span>
                                                            <ChevronDown className="ml-2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent className="w-full max-w-xs">
                                                        {products.map(p => (
                                                            <DropdownMenuItem key={p.id} onClick={() => setSelectedProductId(p.id)} className="text-xs sm:text-sm">
                                                                <span className="truncate">{p.name} (Stock: {p.stock})</span>
                                                            </DropdownMenuItem>
                                                        ))}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                            {/* Selector de talla para movimientos (si el producto tiene variantes) */}
                                            {productVariantOptions.length > 0 && (
                                                <div className="space-y-2">
                                                    <label className="block text-sm font-semibold text-muted-foreground">Talla (stock)</label>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="outline" className="w-full flex justify-between items-center px-2 py-2 text-left">
                                                                <span className="truncate text-xs sm:text-sm">
                                                                    {selectedSizeForMovement
                                                                        ? `${productVariantOptions.find(v => v.id_talla === selectedSizeForMovement)?.nombre_talla} — ${productVariantOptions.find(v => v.id_talla === selectedSizeForMovement)?.stock ?? 0} unidad${(productVariantOptions.find(v => v.id_talla === selectedSizeForMovement)?.stock ?? 0) === 1 ? '' : 'es'}`
                                                                        : '-- Seleccionar talla --'}
                                                                </span>
                                                                <ChevronDown className="ml-2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent className="w-full max-w-xs">
                                                            {productVariantOptions.map(v => (
                                                                <DropdownMenuItem
                                                                    key={v.id_talla}
                                                                    onClick={() => setSelectedSizeForMovement(v.id_talla)}
                                                                    className={`text-xs sm:text-sm ${movementType === 'venta' && (v.stock ?? 0) <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                    disabled={movementType === 'venta' && (v.stock ?? 0) <= 0}
                                                                >
                                                                    <span className="truncate">{v.nombre_talla} — {v.stock ?? 0} unidad{(v.stock ?? 0) === 1 ? '' : 'es'}{movementType === 'venta' && (v.stock ?? 0) <= 0 ? ' (agotado)' : ''}</span>
                                                                </DropdownMenuItem>
                                                            ))}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            )}

                                            <div className="space-y-2">
                                                <label className="block text-sm font-semibold text-muted-foreground">Tipo de movimiento</label>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="outline" className="w-full flex justify-between items-center px-2 py-2 text-left">
                                                            <span className="text-xs sm:text-sm">
                                                                {movementType === 'venta' && 'Venta'}
                                                                {movementType === 'devolucion' && 'Devolución'}
                                                                {movementType === 'reposicion' && 'Reposición'}
                                                            </span>
                                                            <ChevronDown className="ml-2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent className="w-full">
                                                        <DropdownMenuItem onClick={() => setMovementType('venta')} className="text-xs sm:text-sm">Venta</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => setMovementType('devolucion')} className="text-xs sm:text-sm">Devolución</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => setMovementType('reposicion')} className="text-xs sm:text-sm">Reposición</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="block text-sm font-semibold text-muted-foreground">Cantidad</label>
                                                <input
                                                    type="number"
                                                    min={1}
                                                    className={`border rounded px-2 py-2 w-full bg-background text-foreground text-xs sm:text-sm ${qtyError ? 'border-destructive' : ''}`}
                                                    value={movementQty}
                                                    onChange={e => {
                                                        const val = e.target.value;
                                                        setMovementQty(val);
                                                        const numVal = Number(val);
                                                        if (!val || isNaN(numVal) || numVal < 1) {
                                                            setQtyError('La cantidad debe ser un número mayor a 0');
                                                        } else {
                                                            setQtyError(null);
                                                        }
                                                    }}
                                                />
                                                {qtyError && <span className="text-destructive text-xs mt-1 block">{qtyError}</span>}
                                                {/* Mostrar stock disponible para la talla seleccionada */}
                                                {selectedSizeForMovement && (
                                                    <div className="text-xs text-muted-foreground mt-2">Stock talla seleccionada: {productVariantOptions.find(v => v.id_talla === selectedSizeForMovement)?.stock ?? 0} unidad{(productVariantOptions.find(v => v.id_talla === selectedSizeForMovement)?.stock ?? 0) === 1 ? '' : 'es'}</div>
                                                )}
                                            </div>
                                        </div>
                                        {/* Dialogo de confirmación para ventas */}
                                        <AlertDialog open={confirmMovementOpen} onOpenChange={setConfirmMovementOpen}>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Confirmar movimiento</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        ¿Estás seguro de que deseas registrar esta {movementType}?
                                                        {selectedSizeForMovement ? ` Se aplicará a la talla ${productVariantOptions.find(v => v.id_talla === selectedSizeForMovement)?.nombre_talla}.` : ''}
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel onClick={() => setConfirmMovementOpen(false)}>Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction disabled={confirmDisabled} onClick={async () => { setConfirmMovementOpen(false); await performInventoryMovement(); }}>Confirmar</AlertDialogAction>
                                                    {confirmDisabled && (
                                                        <div className="text-xs text-destructive mt-2">La cantidad es inválida o excede el stock de la talla seleccionada.</div>
                                                    )}
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>

                                        <div className="flex flex-col items-start gap-2 w-full sm:w-56">
                                            <Button
                                                disabled={confirmDisabled}
                                                className={`bg-primary text-primary-foreground ${confirmDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary/80'} transition w-full h-12 text-sm touch-manipulation font-medium flex items-center justify-center`}
                                                onClick={handleInventoryMovement}
                                            >
                                                Registrar movimiento
                                            </Button>
                                            {/* Reservar espacio para evitar que el botón salte cuando el mensaje aparece */}
                                            <div className="text-xs text-destructive min-h-[1.25rem] w-full text-left">
                                                {confirmDisabled ? 'Corrige la cantidad o selecciona una talla con stock suficiente antes de registrar.' : ''}
                                            </div>
                                        </div>
                                    </div>
                                    {alertStock && <div className="mt-4 p-3 bg-destructive/20 text-destructive border border-destructive rounded-lg font-semibold shadow">{alertStock}</div>}
                                    <div className="mt-8">
                                        <div className="flex items-center justify-between gap-3 mb-2">
                                            <h3 className="font-bold text-muted-foreground m-0">Historial de movimientos</h3>
                                            <span className="text-xs text-muted-foreground">{inventoryMovements.length} registros</span>
                                        </div>

                                        {/* Mobile cards */}
                                        <div className="grid gap-2 sm:hidden">
                                            {paginatedMovements.length === 0 ? (
                                                <div className="text-sm text-muted-foreground py-4 text-center">No hay movimientos</div>
                                            ) : (
                                                paginatedMovements.map((hist) => (
                                                    <div key={hist.id} className="p-3 rounded-lg border border-white/10 bg-background/60">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <div className="font-medium truncate">{hist.product_name}</div>
                                                            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${hist.tipo === 'venta' ? 'bg-red-500/10 text-red-500 border-red-500/20' : hist.tipo === 'reposicion' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                                                                {hist.tipo}
                                                            </span>
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">{new Date(hist.fecha).toLocaleString()}</div>
                                                        <div className="mt-1 text-sm"><span className="text-muted-foreground">Cantidad:</span> {hist.cantidad}</div>
                                                    </div>
                                                ))
                                            )}
                                            {totalMovementPages > 1 && (
                                                <div className="flex justify-center items-center gap-2 p-3">
                                                    <Button size="sm" variant="outline" className="flex-1" disabled={movementPage === 1} onClick={() => setMovementPage(movementPage - 1)}>
                                                        Anterior
                                                    </Button>
                                                    <span className="text-sm text-muted-foreground whitespace-nowrap">{movementPage} / {totalMovementPages}</span>
                                                    <Button size="sm" variant="outline" className="flex-1" disabled={movementPage === totalMovementPages} onClick={() => setMovementPage(movementPage + 1)}>
                                                        Siguiente
                                                    </Button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Desktop table */}
                                        <div className="hidden sm:block rounded-lg border border-white/10 overflow-hidden">
                                            <div className="max-h-80 overflow-auto">
                                                <table className="min-w-full text-sm">
                                                    <thead className="sticky top-0 bg-background/80 backdrop-blur border-b border-white/10 z-10">
                                                        <tr>
                                                            <th className="px-3 py-2 text-left w-48">Fecha</th>
                                                            <th className="px-3 py-2 text-left">Producto</th>
                                                            <th className="px-3 py-2 text-left w-28">Tipo</th>
                                                            <th className="px-3 py-2 text-right w-24">Cantidad</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {paginatedMovements.length === 0 ? (
                                                            <tr>
                                                                <td colSpan={4} className="px-3 py-6 text-center text-sm text-muted-foreground">No hay movimientos</td>
                                                            </tr>
                                                        ) : (
                                                            paginatedMovements.map((hist) => (
                                                                <tr key={hist.id} className="border-b border-white/5">
                                                                    <td className="px-3 py-2 whitespace-nowrap">{new Date(hist.fecha).toLocaleString()}</td>
                                                                    <td className="px-3 py-2">{hist.product_name}</td>
                                                                    <td className="px-3 py-2">
                                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${hist.tipo === 'venta' ? 'bg-red-500/10 text-red-500 border-red-500/20' : hist.tipo === 'reposicion' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                                                                            {hist.tipo}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-3 py-2 text-right">{hist.cantidad}</td>
                                                                </tr>
                                                            ))
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                            {/* Inline pagination controls */}
                                            {totalMovementPages > 1 && (
                                                <div className="flex justify-center items-center gap-2 p-3 border-t border-white/10 bg-background/60">
                                                    <Button size="sm" variant="outline" disabled={movementPage === 1} onClick={() => setMovementPage(movementPage - 1)}>
                                                        Anterior
                                                    </Button>
                                                    <span className="text-sm text-muted-foreground">Página {movementPage} de {totalMovementPages}</span>
                                                    <Button size="sm" variant="outline" disabled={movementPage === totalMovementPages} onClick={() => setMovementPage(movementPage + 1)}>
                                                        Siguiente
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="products" className="space-y-4 sm:space-y-6">
                            <Card className="glass border-white/20">
                                <CardHeader>
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                        <div>
                                            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                                                <Store className="h-4 w-4 sm:h-5 sm:w-5" />
                                                Gestión de Productos
                                            </CardTitle>
                                            <CardDescription className="text-sm sm:text-base">Administra los productos, categorías y stock</CardDescription>
                                        </div>
                                        <div className="flex flex-wrap gap-2 items-center">
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                onClick={() => {
                                                    setFilterCategory("all");
                                                    setFilterPrice([0, 500000]); // Resetear al rango inicial
                                                    setFilterActive("all");
                                                    setSelectedSizesFilter([]);
                                                    setProductsPage(1); // También resetear la página
                                                    toast({
                                                        title: "Filtros limpiados",
                                                        description: "Se han restablecido todos los filtros",
                                                        duration: 2000,
                                                    });
                                                }}
                                                title="Limpiar todos los filtros"
                                                className="text-xs sm:text-sm min-h-[44px] px-3 py-2 touch-manipulation"
                                            >
                                                
                                                <span className="hidden sm:inline">Limpiar todo</span>
                                                <span className="sm:hidden">Limpiar</span>
                                            </Button>
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                onClick={exportToCSV} 
                                                title="Exportar CSV" 
                                                className="text-xs sm:text-sm min-h-[44px] px-3 py-2 touch-manipulation"
                                            >
                                                <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1" /> 
                                                <span className="hidden sm:inline">Exportar CSV</span>
                                                <span className="sm:hidden">CSV</span>
                                            </Button>
                                            <Button 
                                                variant="default" 
                                                size="sm" 
                                                onClick={() => setShowCreateProductModal(true)} 
                                                className="text-xs sm:text-sm min-h-[44px] px-3 py-2 touch-manipulation"
                                            >
                                                <Store className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                                <span className="hidden sm:inline">Crear nuevo producto</span>
                                                <span className="sm:hidden">Nuevo</span>
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {/* Filtro rápido de estado */}
                                    <div className="mb-4 flex gap-2 items-center flex-wrap">
                                        <span className="text-xs sm:text-sm font-medium text-muted-foreground">Estado:</span>
                                        <Button 
                                            size="sm" 
                                            variant={filterActive === "all" ? "default" : "outline"}
                                            onClick={() => setFilterActive("all")}
                                            className="text-xs sm:text-sm px-3 sm:px-4 min-h-[40px] touch-manipulation"
                                        >
                                            Todos
                                        </Button>
                                        <Button 
                                            size="sm" 
                                            variant={filterActive === "active" ? "default" : "outline"}
                                            onClick={() => setFilterActive("active")}
                                            className="text-xs sm:text-sm px-3 sm:px-4 min-h-[40px] touch-manipulation"
                                        >
                                            Activos
                                        </Button>
                                        <Button 
                                            size="sm" 
                                            variant={filterActive === "inactive" ? "default" : "outline"}
                                            onClick={() => setFilterActive("inactive")}
                                            className="text-xs sm:text-sm px-3 sm:px-4 min-h-[40px] touch-manipulation"
                                        >
                                            Inactivos
                                        </Button>
                                    </div>
                                    
                                    <div className="mb-4">
                                        <ProductFilters
                                            categories={categories}
                                            selectedCategory={filterCategory}
                                            onCategoryChange={setFilterCategory}
                                            priceRange={filterPrice}
                                            onPriceRangeChange={setFilterPrice}
                                            sortBy={sortBy}
                                            onSortChange={setSortBy}
                                            sizes={sizesForFilters}
                                            selectedSizes={selectedSizesFilter}
                                            onSizeChange={setSelectedSizesFilter}
                                            onClearFilters={() => {
                                                setFilterCategory("all");
                                                setFilterPrice([0, 500000]);
                                                setFilterActive("all");
                                                setSelectedSizesFilter([]);
                                                setProductsPage(1);
                                            }}
                                            allCategoryId={dbAllCategoryId ?? undefined}
                                        />
                                    </div>
                                    
                                    {/* Vista móvil - Cards */}
                                    <div className="block lg:hidden space-y-4">
                                        {paginatedProducts.length > 0 ? (
                                            paginatedProducts.map(product => (
                                                <div key={product.id} className={`bg-card rounded-xl border border-white/10 p-4 space-y-3 ${product.active === false ? "opacity-60" : ""}`}>
                                                    <div className="flex items-start gap-3">
                                                        <div className="flex-shrink-0">
                                                            {product.image_url ? (
                                                                <img src={product.image_url} alt={product.name} className="h-16 w-16 object-cover rounded border" />
                                                            ) : (
                                                                <div className="h-16 w-16 bg-muted rounded border flex items-center justify-center">
                                                                    <span className="text-xs text-muted-foreground">Sin imagen</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="font-semibold text-sm sm:text-base truncate">{product.name}</h3>
                                                            <p className="text-xs sm:text-sm text-muted-foreground">{product.category_name}</p>
                                                            <p className="text-sm sm:text-base font-medium text-green-600 mt-1">
                                                                {product.price?.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}
                                                            </p>
                                                        </div>
                                                        <div className="flex flex-col items-end gap-2">
                                                            <Button 
                                                                size="icon" 
                                                                variant={product.active === false ? "outline" : "ghost"} 
                                                                onClick={() => handleToggleActive(product)} 
                                                                className="h-10 w-10 min-h-[44px] min-w-[44px] touch-manipulation"
                                                            >
                                                                {product.active === false ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4 text-green-500" />}
                                                            </Button>
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button 
                                                                        size="sm" 
                                                                        variant="outline" 
                                                                        className="h-10 px-3 min-h-[44px] touch-manipulation"
                                                                    >
                                                                        <ChevronDown className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent>
                                                                    <DropdownMenuItem onClick={() => handleEditProduct(product)}>
                                                                        <Package className="h-4 w-4 mr-2" />
                                                                        Editar
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem 
                                                                        onClick={() => setConfirmDeleteProductId(product.id)} 
                                                                        className="text-red-600"
                                                                    >
                                                                        <AlertTriangle className="h-4 w-4 mr-2" />
                                                                        Eliminar
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-4 pt-2 border-t border-white/10">
                                                        <div className="text-center">
                                                            <p className="text-xs text-muted-foreground">Stock</p>
                                                            <p className={`font-medium text-sm ${product.stock <= product.stock_minimo ? 'text-red-500' : 'text-green-600'}`}>
                                                                {product.stock}
                                                            </p>
                                                        </div>
                                                        <div className="text-center">
                                                            <p className="text-xs text-muted-foreground">Stock mín.</p>
                                                            <p className="font-medium text-sm">{product.stock_minimo}</p>
                                                        </div>
                                                        <div className="text-center">
                                                            <p className="text-xs text-muted-foreground">Estado</p>
                                                            <p className={`font-medium text-sm ${product.active === false ? 'text-red-500' : 'text-green-600'}`}>
                                                                {product.active === false ? 'Inactivo' : 'Activo'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="flex flex-col items-center gap-3 py-12 text-center">
                                                <Store className="h-12 w-12 text-muted-foreground/50" />
                                                <div>
                                                    <p className="font-medium">No hay productos disponibles</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {filteredProducts.length === 0 && products.length > 0 
                                                            ? "Prueba ajustando los filtros o crea un nuevo producto"
                                                            : "Crea tu primer producto para comenzar"
                                                        }
                                                    </p>
                                                </div>
                                                <Button 
                                                    onClick={() => setShowCreateProductModal(true)}
                                                    className="mt-2"
                                                >
                                                    <Store className="h-4 w-4 mr-2" />
                                                    Crear producto
                                                </Button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Vista desktop - Tabla */}
                                    <div className="hidden lg:block overflow-x-auto rounded-xl border border-white/10 bg-background/80 shadow min-h-[400px]">
                                        <table className="min-w-full text-sm">
                                            <thead className="bg-muted/30">
                                                <tr>
                                                    <th className="px-4 py-3 text-left font-semibold">Imagen</th>
                                                    <th className="px-4 py-3 text-left font-semibold">Nombre</th>
                                                    <th className="px-4 py-3 text-left font-semibold">Categoría</th>
                                                    <th className="px-4 py-3 text-left font-semibold">Stock</th>
                                                    <th className="px-4 py-3 text-left font-semibold">Stock mínimo</th>
                                                    <th className="px-4 py-3 text-left font-semibold">Precio</th>
                                                    <th className="px-4 py-3 text-left font-semibold">Activo</th>
                                                    <th className="px-4 py-3 text-left font-semibold">Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {paginatedProducts.length > 0 ? (
                                                    paginatedProducts.map(product => (
                                                        <tr key={product.id} className={`border-b border-white/10 hover:bg-muted/20 transition-colors ${product.active === false ? "opacity-60" : ""}`}>
                                                            <td className="px-4 py-3">
                                                                {product.image_url ? (
                                                                    <img src={product.image_url} alt={product.name} className="h-12 w-12 object-cover rounded border" />
                                                                ) : (
                                                                    <div className="h-12 w-12 bg-muted rounded border flex items-center justify-center">
                                                                        <span className="text-xs text-muted-foreground">Sin imagen</span>
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-3 font-semibold">{product.name}</td>
                                                            <td className="px-4 py-3">{product.category_name || 'Sin categoría'}</td>
                                                            <td className="px-4 py-3">
                                                                <span className={`font-medium ${product.stock <= product.stock_minimo ? 'text-red-500' : 'text-green-600'}`}>
                                                                    {product.stock}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3">{product.stock_minimo}</td>
                                                            <td className="px-4 py-3 font-medium text-green-600">
                                                                {product.price?.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <Button size="icon" variant={product.active === false ? "outline" : "ghost"} onClick={() => handleToggleActive(product)} title={product.active === false ? "Activar" : "Desactivar"}>
                                                                    {product.active === false ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-green-500" />}
                                                                </Button>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button size="sm" variant="outline"><ChevronDown /></Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent>
                                                                        <DropdownMenuItem onClick={() => handleEditProduct(product)}>
                                                                            <Package className="h-4 w-4 mr-2" />
                                                                            Editar
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuSeparator />
                                                                        <DropdownMenuItem 
                                                                            onClick={() => setConfirmDeleteProductId(product.id)} 
                                                                            className="text-red-600"
                                                                        >
                                                                            <AlertTriangle className="h-4 w-4 mr-2" />
                                                                            Eliminar
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                                                            <div className="flex flex-col items-center gap-3">
                                                                <Store className="h-12 w-12 text-muted-foreground/50" />
                                                                <div>
                                                                    <p className="font-medium">No hay productos disponibles</p>
                                                                    <p className="text-sm">
                                                                        {filteredProducts.length === 0 && products.length > 0 
                                                                            ? "Prueba ajustando los filtros o crea un nuevo producto"
                                                                            : "Crea tu primer producto para comenzar"
                                                                        }
                                                                    </p>
                                                                </div>
                                                                <Button 
                                                                    onClick={() => setShowCreateProductModal(true)}
                                                                    className="mt-2"
                                                                >
                                                                    <Store className="h-4 w-4 mr-2" />
                                                                    Crear producto
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                    {/* Modal crear producto */}
                                    <Dialog open={showCreateProductModal} onOpenChange={setShowCreateProductModal}>
                                        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl w-[95vw]">
                                            <DialogHeader>
                                                <DialogTitle>Nuevo Producto</DialogTitle>
                                                <DialogDescription>Completa todos los campos para crear un producto.</DialogDescription>
                                            </DialogHeader>
                                            <form onSubmit={handleCreateProduct} className="space-y-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="col-span-1">
                                                    <Label htmlFor="product-name">Nombre</Label>
                                                    <Input id="product-name" type="text" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} required />
                                                    {nameError && <span className="text-destructive text-xs mt-1 block">{nameError}</span>}
                                                    </div>
                                                    <div className="col-span-1">
                                                    <Label htmlFor="product-category">Categoría</Label>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="outline" className="w-full flex justify-between items-center px-2 py-1">
                                                                <span>{newProduct.category_name || 'Selecciona...'}</span>
                                                                <ChevronDown className="ml-2 h-4 w-4 text-muted-foreground" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent className="w-full">
                                                            {categories.map(cat => (
                                                                <DropdownMenuItem key={cat.id} onClick={() => setNewProduct({ ...newProduct, category: cat.id, category_name: cat.name })}>{cat.name}</DropdownMenuItem>
                                                            ))}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                    </div>
                                                    <div className="col-span-1">
                                                    <Label htmlFor="product-stock">Stock</Label>
                                                    <Input id="product-stock" type="number" min={1} value={newProduct.stock} onChange={e => setNewProduct({ ...newProduct, stock: Number(e.target.value) })} required />
                                                    </div>
                                                    <div className="col-span-1">
                                                    <Label htmlFor="product-stock-min">Stock mínimo</Label>
                                                    <Input id="product-stock-min" type="number" min={0} value={newProduct.stock_minimo} onChange={e => setNewProduct({ ...newProduct, stock_minimo: Number(e.target.value) })} required />
                                                    </div>
                                                    <div className="col-span-1">
                                                    <Label htmlFor="product-price">Precio</Label>
                                                    <Input id="product-price" type="number" min={0.01} step={0.01} value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: Number(e.target.value) })} required />
                                                    </div>
                                                    <div className="col-span-1">
                                                    <Label htmlFor="product-image">Imagen</Label>
                                                    <Input id="product-image" type="file" accept="image/*" onChange={handleImageChange} required />
                                                    {imageError && <span className="text-destructive text-xs mt-1 block">{imageError}</span>}
                                                    </div>
                                                    <div className="col-span-1 md:col-span-2 space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <Label>Tallas y stock por talla</Label>
                                                        <Button type="button" variant="outline" size="sm" onClick={fetchSizes} disabled={sizesLoading} title="Refrescar tallas">
                                                            <RefreshCw className={`h-4 w-4 mr-1 ${sizesLoading ? 'animate-spin' : ''}`} />
                                                            {sizesLoading ? 'Cargando…' : 'Refrescar'}
                                                        </Button>
                                                    </div>
                                                    {sizesError && (
                                                        <p className="text-xs text-destructive">{sizesError}</p>
                                                    )}
                                                    {sizesLoading && availableSizes.length === 0 && (
                                                        <p className="text-xs text-muted-foreground">Cargando tallas…</p>
                                                    )}
                                                    {availableSizes.length > 0 ? (
                                                        <>
                                                            <div className="max-h-60 overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                                                {availableSizes.map(size => {
                                                                    const inputId = `stock-size-${size.id_talla}`;
                                                                    return (
                                                                        <div key={size.id_talla} className="grid grid-cols-[3rem,1fr] items-center gap-2">
                                                                            <Label htmlFor={inputId} className="w-12 text-right text-xs sm:text-sm font-medium">{size.nombre_talla}</Label>
                                                                            <Input
                                                                                id={inputId}
                                                                                type="number"
                                                                                min={0}
                                                                                placeholder={`Stock ${size.nombre_talla}`}
                                                                                aria-label={`Stock talla ${size.nombre_talla}`}
                                                                                value={variantStocks[size.id_talla] ?? 0}
                                                                                onChange={(e) => {
                                                                                    const val = Math.max(0, Number(e.target.value || 0));
                                                                                    setVariantStocks(prev => ({ ...prev, [size.id_talla]: val }));
                                                                                }}
                                                                            />
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                            {(() => {
                                                                const sum = availableSizes.reduce((acc, s) => acc + (variantStocks[s.id_talla] || 0), 0);
                                                                const exceeds = sum > (newProduct.stock || 0);
                                                                return (
                                                                    <p className={`text-xs ${exceeds ? 'text-destructive' : 'text-muted-foreground'}`}>
                                                                        Suma por tallas: {sum} / Total: {newProduct.stock}
                                                                        {exceeds && ' — La suma no puede exceder el total.'}
                                                                    </p>
                                                                );
                                                            })()}
                                                        </>
                                                    ) : (
                                                        !sizesLoading && (
                                                            <p className="text-xs text-muted-foreground">No hay tallas configuradas en la base de datos.</p>
                                                        )
                                                    )}
                                                    </div>
                                                    <div className="col-span-1 md:col-span-2">
                                                    <Label htmlFor="product-description">Descripción</Label>
                                                    <Input id="product-description" type="text" value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} required />
                                                    </div>
                                                </div>
                                                <DialogFooter className="flex gap-2 justify-end">
                                                    {(() => {
                                                        const sum = availableSizes.reduce((acc, s) => acc + (variantStocks[s.id_talla] || 0), 0);
                                                        const disable = sum > (newProduct.stock || 0);
                                                        return (
                                                            <Button type="submit" size="sm" variant="default" disabled={disable}>Confirmar</Button>
                                                        );
                                                    })()}
                                                    <DialogClose asChild>
                                                        <Button type="button" size="sm" variant="outline" onClick={() => setShowCreateProductModal(false)}>Cancelar</Button>
                                                    </DialogClose>
                                                </DialogFooter>
                                            </form>
                                        </DialogContent>
                                    </Dialog>
                                    {/* Modal editar producto */}
                                    <Dialog open={!!editProduct} onOpenChange={open => !open && setEditProduct(null)}>
                                        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl w-[95vw]">
                                            <DialogHeader>
                                                <DialogTitle>Editar Producto</DialogTitle>
                                                <DialogDescription>Modifica los datos del producto. La imagen es opcional.</DialogDescription>
                                            </DialogHeader>
                                            {editProduct && (
                                                <form onSubmit={handleUpdateProduct} className="space-y-4">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="col-span-1">
                                                        <Label htmlFor="edit-product-name">Nombre</Label>
                                                        <Input id="edit-product-name" type="text" value={editProduct.name} onChange={e => setEditProduct({ ...editProduct, name: e.target.value })} required />
                                                        {editNameError && <span className="text-destructive text-xs mt-1 block">{editNameError}</span>}
                                                        </div>
                                                        <div className="col-span-1">
                                                        <Label htmlFor="edit-product-category">Categoría</Label>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="outline" className="w-full flex justify-between items-center px-2 py-1">
                                                                    <span>{editProduct?.category_name || 'Selecciona...'}</span>
                                                                    <ChevronDown className="ml-2 h-4 w-4 text-muted-foreground" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent className="w-full">
                                                                {categories.map(cat => (
                                                                    <DropdownMenuItem key={cat.id} onClick={() => setEditProduct(editProduct ? { ...editProduct, category: cat.id, category_name: cat.name } : null)}>{cat.name}</DropdownMenuItem>
                                                                ))}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                        </div>
                                                        <div className="col-span-1">
                                                        <Label htmlFor="edit-product-stock">Stock</Label>
                                                        <Input id="edit-product-stock" type="number" min={1} value={editProduct.stock} onChange={e => setEditProduct({ ...editProduct, stock: Number(e.target.value) })} required />
                                                        </div>
                                                        <div className="col-span-1">
                                                        <Label htmlFor="edit-product-stock-min">Stock mínimo</Label>
                                                        <Input id="edit-product-stock-min" type="number" min={0} value={editProduct.stock_minimo} onChange={e => setEditProduct({ ...editProduct, stock_minimo: Number(e.target.value) })} required />
                                                        </div>
                                                        <div className="col-span-1">
                                                        <Label htmlFor="edit-product-price">Precio</Label>
                                                        <Input id="edit-product-price" type="number" min={0.01} step={0.01} value={editProduct.price} onChange={e => setEditProduct({ ...editProduct, price: Number(e.target.value) })} required />
                                                        </div>
                                                        <div className="col-span-1">
                                                        <Label htmlFor="edit-product-image">Imagen (opcional)</Label>
                                                        <Input id="edit-product-image" type="file" accept="image/*" onChange={handleEditImageChange} />
                                                        {editImageError && <span className="text-destructive text-xs mt-1 block">{editImageError}</span>}
                                                        {editProduct.image_url && (
                                                            <img src={editProduct.image_url} alt={editProduct.name} className="h-12 w-12 object-cover rounded mt-2" />
                                                        )}
                                                        </div>
                                                        <div className="col-span-1 md:col-span-2 space-y-2">
                                                            <div className="flex items-center justify-between">
                                                                <Label>Tallas y stock por talla</Label>
                                                                <Button type="button" variant="outline" size="sm" onClick={fetchSizes} disabled={sizesLoading} title="Refrescar tallas">
                                                                    <RefreshCw className={`h-4 w-4 mr-1 ${sizesLoading ? 'animate-spin' : ''}`} />
                                                                    {sizesLoading ? 'Cargando…' : 'Refrescar'}
                                                                </Button>
                                                            </div>
                                                            {sizesError && (
                                                                <p className="text-xs text-destructive">{sizesError}</p>
                                                            )}
                                                            {availableSizes.length > 0 ? (
                                                                <>
                                                                    <div className="max-h-60 overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                                                        {availableSizes.map(size => {
                                                                            const inputId = `edit-stock-size-${size.id_talla}`;
                                                                            return (
                                                                                <div key={size.id_talla} className="grid grid-cols-[3rem,1fr] items-center gap-2">
                                                                                    <Label htmlFor={inputId} className="w-12 text-right text-xs sm:text-sm font-medium">{size.nombre_talla}</Label>
                                                                                    <Input
                                                                                        id={inputId}
                                                                                        type="number"
                                                                                        min={0}
                                                                                        placeholder={`Stock ${size.nombre_talla}`}
                                                                                        aria-label={`Stock talla ${size.nombre_talla}`}
                                                                                        value={editVariantStocks[size.id_talla] ?? 0}
                                                                                        onChange={(e) => {
                                                                                            const val = Math.max(0, Number(e.target.value || 0));
                                                                                            setEditVariantStocks(prev => ({ ...prev, [size.id_talla]: val }));
                                                                                        }}
                                                                                    />
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                    {(() => {
                                                                        const sum = availableSizes.reduce((acc, s) => acc + (editVariantStocks[s.id_talla] || 0), 0);
                                                                        const exceeds = sum > (editProduct.stock || 0);
                                                                        return (
                                                                            <p className={`text-xs ${exceeds ? 'text-destructive' : 'text-muted-foreground'}`}>
                                                                                Suma por tallas: {sum} / Total: {editProduct.stock}
                                                                                {exceeds && ' — La suma no puede exceder el total.'}
                                                                            </p>
                                                                        );
                                                                    })()}
                                                                </>
                                                            ) : (
                                                                !sizesLoading && (
                                                                    <p className="text-xs text-muted-foreground">No hay tallas configuradas en la base de datos.</p>
                                                                )
                                                            )}
                                                        </div>
                                                        <div className="col-span-1 md:col-span-2">
                                                            <Label htmlFor="edit-product-description">Descripción</Label>
                                                            <Input id="edit-product-description" type="text" value={editProduct.description} onChange={e => setEditProduct({ ...editProduct, description: e.target.value })} />
                                                        </div>
                                                    </div>
                                                    <DialogFooter className="flex gap-2 justify-end">
                                                        {(() => {
                                                            const sum = availableSizes.reduce((acc, s) => acc + (editVariantStocks[s.id_talla] || 0), 0);
                                                            const disable = sum > (editProduct.stock || 0);
                                                            return (
                                                                <Button type="submit" size="sm" variant="default" disabled={disable}>Guardar cambios</Button>
                                                            );
                                                        })()}
                                                        <DialogClose asChild>
                                                            <Button type="button" size="sm" variant="outline" onClick={() => setEditProduct(null)}>Cancelar</Button>
                                                        </DialogClose>
                                                    </DialogFooter>
                                                </form>
                                            )}
                                        </DialogContent>
                                    </Dialog>

                                    {/* Modal confirmar eliminar producto */}
                                    <Dialog open={!!confirmDeleteProductId} onOpenChange={(open) => !open && setConfirmDeleteProductId(null)}>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>¿Eliminar producto?</DialogTitle>
                                                <DialogDescription>
                                                    Esta acción no se puede deshacer. El producto será eliminado permanentemente.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <DialogFooter>
                                                <Button 
                                                    variant="destructive" 
                                                    onClick={handleDeleteProduct}
                                                >
                                                    Eliminar
                                                </Button>
                                                <DialogClose asChild>
                                                    <Button variant="outline">Cancelar</Button>
                                                </DialogClose>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>

                                    {/* Controles de paginación productos */}
                                    {totalProductsPages > 1 && (
                                        <div className="flex flex-col sm:flex-row justify-center items-center gap-2 p-3 sm:p-4 bg-muted/10 rounded-lg border border-white/10">
                                            <Button 
                                                size="sm" 
                                                variant="outline" 
                                                disabled={productsPage === 1} 
                                                onClick={() => setProductsPage(productsPage - 1)}
                                                className="w-full sm:w-auto text-xs sm:text-sm min-h-[44px] px-4 py-2 touch-manipulation"
                                            >
                                                <span className="hidden sm:inline">Anterior</span>
                                                <span className="sm:hidden">←</span>
                                            </Button>
                                            <span className="text-xs sm:text-sm text-muted-foreground px-3 py-2 bg-background/50 rounded border min-h-[44px] flex items-center">
                                                <span className="hidden sm:inline">Página {productsPage} de {totalProductsPages}</span>
                                                <span className="sm:hidden">{productsPage}/{totalProductsPages}</span>
                                            </span>
                                            <Button 
                                                size="sm" 
                                                variant="outline" 
                                                disabled={productsPage === totalProductsPages} 
                                                onClick={() => setProductsPage(productsPage + 1)}
                                                className="w-full sm:w-auto text-xs sm:text-sm min-h-[44px] px-4 py-2 touch-manipulation"
                                            >
                                                <span className="hidden sm:inline">Siguiente</span>
                                                <span className="sm:hidden">→</span>
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="stats" className="space-y-4 sm:space-y-6">
                            <Card className="glass border-white/20">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                                        <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                                        Estadísticas y Reportes
                                    </CardTitle>
                                    <CardDescription className="text-sm sm:text-base">
                                        Visualiza estadísticas relevantes del sitio
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-6 sm:space-y-8">
                                        {/* Gráficas de barras */}
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                                            <div className="bg-card/30 p-4 sm:p-6 rounded-xl border border-white/10">
                                                <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Usuarios vs Pedidos</h3>
                                                <ChartContainer config={{ users: { color: '#f97316', label: 'Usuarios' }, orders: { color: '#ef4444', label: 'Pedidos' } }}>
                                                    <ResponsiveContainer width="100%" height={150}>
                                                        <ReBarChart data={[
                                                            { name: 'Usuarios', value: siteStats.totalUsers },
                                                            { name: 'Pedidos', value: siteStats.totalOrders }
                                                        ]}>
                                                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                                            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                                                            <Bar dataKey="value" fill="#f97316" radius={[8, 8, 0, 0]} />
                                                        </ReBarChart>
                                                    </ResponsiveContainer>
                                                </ChartContainer>
                                            </div>

                                            <div className="bg-card/30 p-4 sm:p-6 rounded-xl border border-white/10">
                                                <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Productos por Categoría</h3>
                                                <ChartContainer config={{ 
                                                    productos: { color: '#10b981', label: 'Productos' }
                                                }}>
                                                    <ResponsiveContainer width="100%" height={150}>
                                                        <ReBarChart data={
                                                            categories
                                                                .filter(cat => {
                                                                    const name = (cat.name || '').trim().toLowerCase();
                                                                    const id = (cat.id || '').trim().toLowerCase();
                                                                    return name !== 'todos' && name !== 'todas' && name !== 'all' && id !== 'todos' && id !== 'todas' && id !== 'all';
                                                                })
                                                                .map(cat => ({
                                                                    name: cat.name,
                                                                    value: products.filter(p => p.category === cat.id).length
                                                                }))
                                                        }>
                                                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                                            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                                                            <Bar dataKey="value" fill="#10b981" radius={[8, 8, 0, 0]} />
                                                        </ReBarChart>
                                                    </ResponsiveContainer>
                                                </ChartContainer>
                                            </div>
                                        </div>

                                        {/* Reportes y métricas adicionales */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                                            <div className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 p-3 sm:p-4 rounded-xl border border-blue-500/20">
                                                <div className="flex items-center gap-2 sm:gap-3">
                                                    <div className="p-1.5 sm:p-2 bg-blue-500/20 rounded-lg">
                                                        <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-xs sm:text-sm text-muted-foreground truncate">Usuarios Activos</p>
                                                        <p className="text-lg sm:text-xl font-bold">{siteStats.totalUsers}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-gradient-to-r from-green-500/10 to-green-600/10 p-3 sm:p-4 rounded-xl border border-green-500/20">
                                                <div className="flex items-center gap-2 sm:gap-3">
                                                    <div className="p-1.5 sm:p-2 bg-green-500/20 rounded-lg">
                                                        <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-xs sm:text-sm text-muted-foreground truncate">Total Ventas</p>
                                                        <p className="text-lg sm:text-xl font-bold">{dashboardKPIs.salesThisMonth}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-gradient-to-r from-purple-500/10 to-purple-600/10 p-3 sm:p-4 rounded-xl border border-purple-500/20">
                                                <div className="flex items-center gap-2 sm:gap-3">
                                                    <div className="p-1.5 sm:p-2 bg-purple-500/20 rounded-lg">
                                                        <Package className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-xs sm:text-sm text-muted-foreground truncate">Productos Activos</p>
                                                        <p className="text-lg sm:text-xl font-bold">{products.filter(p => p.active !== false).length}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 p-3 sm:p-4 rounded-xl border border-yellow-500/20">
                                                <div className="flex items-center gap-2 sm:gap-3">
                                                    <div className="p-1.5 sm:p-2 bg-yellow-500/20 rounded-lg">
                                                        <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-xs sm:text-sm text-muted-foreground truncate">Stock Bajo</p>
                                                        <p className="text-lg sm:text-xl font-bold">{dashboardKPIs.lowStock}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Productos más vendidos y reportes */}
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                                            <div className="bg-card/30 p-4 sm:p-6 rounded-xl border border-white/10">
                                                <h3 className="font-semibold mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                                                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                                                    Productos con Stock Crítico
                                                </h3>
                                                <div className="space-y-2">
                                                    {products
                                                        .filter(p => p.stock <= p.stock_minimo)
                                                        .slice(0, 5)
                                                        .map(product => (
                                                            <div key={product.id} className="flex justify-between items-center p-2 bg-yellow-500/10 rounded-lg">
                                                                <span className="font-medium text-xs sm:text-sm truncate flex-1 mr-2">{product.name}</span>
                                                                <span className="text-xs sm:text-sm text-red-500 font-bold whitespace-nowrap">
                                                                    {product.stock} / {product.stock_minimo}
                                                                </span>
                                                            </div>
                                                        ))
                                                    }
                                                    {products.filter(p => p.stock <= p.stock_minimo).length === 0 && (
                                                        <div className="flex items-center gap-2 text-green-600">
                                                            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                                                            <span className="text-xs sm:text-sm">Todos los productos tienen stock suficiente</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="bg-card/30 p-4 sm:p-6 rounded-xl border border-white/10">
                                                <h3 className="font-semibold mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                                                    <BarChart className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                                                    Resumen Mensual
                                                </h3>
                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-muted-foreground text-xs sm:text-sm">Ingresos del mes:</span>
                                                        <span className="font-bold text-green-600 text-xs sm:text-sm">
                                                            {dashboardKPIs.totalIncome.toLocaleString('es-CO', { 
                                                                style: 'currency', 
                                                                currency: 'COP' 
                                                            })}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-muted-foreground text-xs sm:text-sm">Pedidos completados:</span>
                                                        <span className="font-bold text-xs sm:text-sm">{dashboardKPIs.salesThisMonth}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-muted-foreground text-xs sm:text-sm">Pedidos pendientes:</span>
                                                        <span className="font-bold text-orange-500 text-xs sm:text-sm">{dashboardKPIs.pendingOrders}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-muted-foreground text-xs sm:text-sm">Promedio por venta:</span>
                                                        <span className="font-bold text-xs sm:text-sm">
                                                            {dashboardKPIs.salesThisMonth > 0 
                                                                ? (dashboardKPIs.totalIncome / dashboardKPIs.salesThisMonth).toLocaleString('es-CO', { 
                                                                    style: 'currency', 
                                                                    currency: 'COP' 
                                                                })
                                                                : '$0'
                                                            }
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Botones de exportación */}
                                        <div className="flex flex-col sm:flex-row gap-3 pt-4">
                                            <Button 
                                                variant="outline" 
                                                onClick={handleExportData} 
                                                size="sm" 
                                                className="w-full sm:w-auto text-xs sm:text-sm min-h-[44px] px-4 py-2 touch-manipulation"
                                            >
                                                <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                                <span className="hidden sm:inline">Exportar Todos los Datos</span>
                                                <span className="sm:hidden">Todos los Datos</span>
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Gestión de Categorías */}
                        <TabsContent value="categories" className="space-y-4 sm:space-y-6">
                            <Card className="glass border-white/20">
                                <CardHeader>
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                        <div>
                                            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                                                <Package className="h-4 w-4 sm:h-5 sm:w-5" />
                                                Gestión de Categorías
                                            </CardTitle>
                                            <CardDescription className="text-sm sm:text-base">
                                                Administra las categorías de productos
                                            </CardDescription>
                                        </div>
                                        <Button 
                                            onClick={() => setShowCreateCategoryModal(true)} 
                                            size="sm"
                                            className="text-xs sm:text-sm w-full sm:w-auto min-h-[44px] px-4 py-2 touch-manipulation"
                                        >
                                            <Package className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                            <span className="hidden sm:inline">Nueva Categoría</span>
                                            <span className="sm:hidden">Nueva</span>
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {categories.map((category) => {
                                            const productCount = products.filter(p => p.category === category.id).length;
                                            return (
                                                <div key={category.id} className="p-4 rounded-lg border border-white/10 bg-card flex items-center justify-between gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-semibold text-sm sm:text-base truncate">{category.name}</h4>
                                                        <p className="text-xs sm:text-sm text-muted-foreground">
                                                            {productCount} producto{productCount !== 1 ? 's' : ''}
                                                        </p>
                                                    </div>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button 
                                                                size="sm" 
                                                                variant="outline" 
                                                                className="h-8 w-8 sm:h-10 sm:w-10 min-h-[40px] min-w-[40px] p-0"
                                                            >
                                                                <ChevronDown className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem 
                                                                onClick={() => {
                                                                    setEditingCategory(category.id);
                                                                    setEditCategoryName(category.name);
                                                                    setShowEditCategoryModal(true);
                                                                }}
                                                                className="text-xs sm:text-sm"
                                                            >
                                                                Editar
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem 
                                                                onClick={() => setConfirmDeleteCategory(category.id)}
                                                                className="text-red-600 text-xs sm:text-sm"
                                                                disabled={productCount > 0}
                                                            >
                                                                {productCount > 0 ? 'Tiene productos' : 'Eliminar'}
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Modal crear categoría */}
                                    <Dialog open={showCreateCategoryModal} onOpenChange={setShowCreateCategoryModal}>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Nueva Categoría</DialogTitle>
                                                <DialogDescription>
                                                    Crea una nueva categoría para organizar tus productos
                                                </DialogDescription>
                                            </DialogHeader>
                                            <form onSubmit={handleCreateCategory} className="space-y-4">
                                                <div>
                                                    <Label htmlFor="category-name">Nombre de la categoría</Label>
                                                    <Input 
                                                        id="category-name" 
                                                        value={newCategoryName}
                                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                                        placeholder="Ej: Accesorios"
                                                        required 
                                                    />
                                                </div>
                                                <DialogFooter>
                                                    <Button type="submit">Crear Categoría</Button>
                                                    <DialogClose asChild>
                                                        <Button variant="outline">Cancelar</Button>
                                                    </DialogClose>
                                                </DialogFooter>
                                            </form>
                                        </DialogContent>
                                    </Dialog>

                                    {/* Modal editar categoría */}
                                    <Dialog open={showEditCategoryModal} onOpenChange={setShowEditCategoryModal}>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Editar Categoría</DialogTitle>
                                                <DialogDescription>
                                                    Modifica el nombre de la categoría
                                                </DialogDescription>
                                            </DialogHeader>
                                            <form onSubmit={handleEditCategory} className="space-y-4">
                                                <div>
                                                    <Label htmlFor="edit-category-name">Nombre de la categoría</Label>
                                                    <Input 
                                                        id="edit-category-name" 
                                                        value={editCategoryName}
                                                        onChange={(e) => setEditCategoryName(e.target.value)}
                                                        required 
                                                    />
                                                </div>
                                                <DialogFooter>
                                                    <Button type="submit">Guardar Cambios</Button>
                                                    <DialogClose asChild>
                                                        <Button variant="outline">Cancelar</Button>
                                                    </DialogClose>
                                                </DialogFooter>
                                            </form>
                                        </DialogContent>
                                    </Dialog>

                                    {/* Modal confirmar eliminar categoría */}
                                    <Dialog open={!!confirmDeleteCategory} onOpenChange={(open) => !open && setConfirmDeleteCategory(null)}>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>¿Eliminar categoría?</DialogTitle>
                                                <DialogDescription>
                                                    {(() => {
                                                        const name = categories.find(c => c.id === confirmDeleteCategory)?.name;
                                                        return (
                                                            <>
                                                                Esta acción no se puede deshacer. La categoría "{name || confirmDeleteCategory}" será eliminada permanentemente.
                                                            </>
                                                        );
                                                    })()}
                                                </DialogDescription>
                                            </DialogHeader>
                                            <DialogFooter>
                                                <Button 
                                                    variant="destructive" 
                                                    onClick={handleDeleteCategory}
                                                >
                                                    Eliminar
                                                </Button>
                                                <DialogClose asChild>
                                                    <Button variant="outline">Cancelar</Button>
                                                </DialogClose>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Configuración General */}
                        <TabsContent value="config" className="space-y-6">
                            <Card className="glass border-white/20">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <LayoutDashboard className="h-5 w-5" />
                                        Configuración General
                                    </CardTitle>
                                    <CardDescription>
                                        Configuraciones del sistema y empresa
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Información de la empresa */}
                                    <div className="border border-white/10 rounded-lg p-4">
                                        <h3 className="font-semibold mb-4">Información de la Empresa</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="company-name">Nombre de la empresa</Label>
                                                <Input 
                                                    id="company-name" 
                                                    value={companyConfig.name}
                                                    onChange={(e) => setCompanyConfig({...companyConfig, name: e.target.value})}
                                                    placeholder="StepUp"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="company-email">Email de contacto</Label>
                                                <Input 
                                                    id="company-email" 
                                                    type="email"
                                                    value={companyConfig.email}
                                                    onChange={(e) => setCompanyConfig({...companyConfig, email: e.target.value})}
                                                    placeholder="contacto@stepup.com"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="company-phone">Teléfono</Label>
                                                <Input 
                                                    id="company-phone" 
                                                    value={companyConfig.phone}
                                                    onChange={(e) => setCompanyConfig({...companyConfig, phone: e.target.value})}
                                                    placeholder="+57 300 123 4567"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="company-address">Dirección</Label>
                                                <Input 
                                                    id="company-address" 
                                                    value={companyConfig.address}
                                                    onChange={(e) => setCompanyConfig({...companyConfig, address: e.target.value})}
                                                    placeholder="Calle 123 #45-67, Bogotá"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Configuraciones del sistema */}
                                    <div className="border border-white/10 rounded-lg p-4">
                                        <h3 className="font-semibold mb-4">Configuraciones del Sistema</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <Label htmlFor="min-stock">Stock mínimo global</Label>
                                                <Input 
                                                    id="min-stock" 
                                                    type="number"
                                                    min="0"
                                                    value={systemConfig.minStock}
                                                    onChange={(e) => setSystemConfig({...systemConfig, minStock: Number(e.target.value)})}
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="currency">Moneda</Label>
                                                <Input 
                                                    id="currency" 
                                                    value={systemConfig.currency}
                                                    onChange={(e) => setSystemConfig({...systemConfig, currency: e.target.value})}
                                                    placeholder="COP"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="tax-rate">Tasa de impuesto (%)</Label>
                                                <Input 
                                                    id="tax-rate" 
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    step="0.01"
                                                    value={systemConfig.taxRate}
                                                    onChange={(e) => setSystemConfig({...systemConfig, taxRate: Number(e.target.value)})}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Botones de acción */}
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <Button 
                                            onClick={handleSaveConfiguration}
                                            className="w-full sm:w-auto min-h-[48px] px-6 py-3 touch-manipulation font-medium"
                                        >
                                            Guardar Configuración
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            onClick={handleExportData}
                                            className="w-full sm:w-auto min-h-[48px] px-6 py-3 touch-manipulation"
                                        >
                                            <Download className="h-4 w-4 mr-2" />
                                            Exportar Datos
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </main>
        </div>
    );
};

export default Admin;