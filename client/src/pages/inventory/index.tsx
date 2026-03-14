import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Plus, 
  Search, 
  Package, 
  AlertTriangle,
  Edit,
  Trash2,
  FileDown, 
  DollarSign,
  Boxes,
  Tag,
  Pencil,
  Building2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox"; // 👈 NUEVO: Importamos el Checkbox
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ProductDialog } from "./product-dialog";
import { ImportDialog } from "./import-dialog";
import { EmptyState } from "@/components/empty-state";
import { QuickRestockPopover } from "./quick-restock-popover";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@shared/schema";

export default function InventoryPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [isProductOpen, setIsProductOpen] = useState(false);
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | undefined>(undefined);
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);
    
    // Estados para selección masiva 👇
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

    const [lastUsedSupplier, setLastUsedSupplier] = useState<string>("");
    const [lastUsedCategory, setLastUsedCategory] = useState<string>("General");

    const { toast } = useToast();

    const { data: products = [], isLoading } = useQuery<Product[]>({
        queryKey: ["/api/products"],
    });

    // --- CÁLCULOS KPI ---
    const totalUniqueProducts = products.length;
    const totalCostValue = products.reduce((acc, product) => acc + (Number(product.cost) * product.quantity), 0);
    const totalSalesValue = products.reduce((acc, product) => acc + (Number(product.price) * product.quantity), 0);
    const lowStockCount = products.filter(p => p.quantity <= (p.lowStockThreshold || 0)).length;

    // --- FILTRO Y ORDENAMIENTO ---
    const filteredProducts = products
        ?.filter((product) =>
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (product.sku || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (product.category || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (product.supplier || "").toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => {
            const catA = a.category || "";
            const catB = b.category || "";
            const categoryComparison = catA.localeCompare(catB);
            
            if (categoryComparison !== 0) return categoryComparison;
            return a.name.localeCompare(b.name);
        });

    // --- LÓGICA DE SELECCIÓN MASIVA ---
    const toggleSelectAll = () => {
        if (selectedIds.length === filteredProducts.length) {
            setSelectedIds([]); // Deseleccionar todos
        } else {
            setSelectedIds(filteredProducts.map(p => p.id)); // Seleccionar todos los visibles
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    // --- MUTACIONES ---
    const handleCreate = () => {
        setSelectedProduct(undefined);
        setIsProductOpen(true);
    };

    const handleEdit = (product: Product) => {
        setSelectedProduct(product);
        setIsProductOpen(true);
    };

    const handleDeleteClick = (product: Product) => {
        setProductToDelete(product);
    };

    const deleteProductMutation = useMutation({
        mutationFn: async (id: string) => {
            await apiRequest("DELETE", `/api/products/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/products"] });
            toast({
                title: "Producto eliminado",
                description: "El producto ha sido eliminado correctamente del inventario.",
            });
            setProductToDelete(null);
        },
        onError: () => {
            toast({
                title: "Error",
                description: "No se pudo eliminar el producto. Inténtalo de nuevo.",
                variant: "destructive",
            });
        },
    });

    const bulkDeleteMutation = useMutation({
        mutationFn: async (ids: string[]) => {
            // Ejecutamos todos los borrados al mismo tiempo
            await Promise.all(ids.map(id => apiRequest("DELETE", `/api/products/${id}`)));
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["/api/products"] });
            toast({
                title: "Eliminación masiva exitosa",
                description: `Se eliminaron ${variables.length} productos correctamente.`,
            });
            setSelectedIds([]);
            setIsBulkDeleteOpen(false);
        },
        onError: () => {
            toast({
                title: "Error",
                description: "Ocurrió un problema durante la eliminación masiva.",
                variant: "destructive",
            });
            setIsBulkDeleteOpen(false);
        }
    });

    const confirmDelete = () => {
        if (productToDelete) deleteProductMutation.mutate(productToDelete.id);
    };

    const confirmBulkDelete = () => {
        if (selectedIds.length > 0) bulkDeleteMutation.mutate(selectedIds);
    };

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat("es-AR", {
            style: "currency",
            currency: "ARS",
            maximumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <div className="min-h-screen bg-background/50 pb-20 space-y-8">
            
            {/* --- DIÁLOGOS --- */}
            <ProductDialog
                open={isProductOpen}
                onOpenChange={setIsProductOpen}
                product={selectedProduct}
                lastSupplier={lastUsedSupplier}
                lastCategory={lastUsedCategory}
                onSaveAndContinue={(supplier, category) => {
                    setLastUsedSupplier(supplier);
                    setLastUsedCategory(category);
                }}
            />

            <ImportDialog
                open={isImportOpen}
                onOpenChange={setIsImportOpen}
            />

            {/* Alerta borrar 1 producto */}
            <AlertDialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Esto eliminará permanentemente al producto
                            <span className="font-semibold text-foreground"> {productToDelete?.name} </span>
                            del inventario.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Alerta borrar MÚLTIPLES productos */}
            <AlertDialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar {selectedIds.length} productos?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Estás a punto de eliminar <span className="font-bold">{selectedIds.length} productos</span> de forma permanente. Esta acción no se puede deshacer y borrará todo su historial.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={confirmBulkDelete} 
                            disabled={bulkDeleteMutation.isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {bulkDeleteMutation.isPending ? "Eliminando..." : "Sí, eliminar todos"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* --- HEADER STICKY --- */}
            <div className="sticky top-0 z-30 border-b border-border/40 bg-background/80 backdrop-blur-md px-6 py-4 transition-all">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 max-w-7xl mx-auto w-full">
                    <div className="flex flex-col gap-1 w-full sm:w-auto">
                        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                            <Package className="h-6 w-6 text-primary" />
                            Inventario
                        </h1>
                        <p className="text-sm text-muted-foreground hidden sm:block">
                            Gestión de stock, proveedores y precios.
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <Button 
                            variant="outline" 
                            onClick={() => setIsImportOpen(true)}
                            className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20 hover:border-emerald-500/40 shadow-sm backdrop-blur-sm transition-all"
                        >
                            <FileDown className="mr-2 h-4 w-4" />
                            Importar Excel
                        </Button>

                        <Button 
                            onClick={handleCreate}
                            variant="outline"
                            className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 hover:border-primary/40 shadow-sm backdrop-blur-sm transition-all"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Nuevo Producto
                        </Button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full space-y-8">

                {/* --- KPI CARDS --- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="border border-indigo-500/20 hover:border-indigo-500/50 bg-gradient-to-br from-card via-card/95 to-indigo-500/10 shadow-sm relative overflow-hidden transition-all duration-500">
                        <div className="absolute right-0 top-0 p-3 opacity-10">
                            <Boxes className="w-24 h-24 text-indigo-500" />
                        </div>
                        <CardContent className="p-6 flex flex-col justify-center h-full">
                            <div className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
                                <Package className="h-4 w-4 text-indigo-500" /> Total Productos
                            </div>
                            <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                                {totalUniqueProducts} <span className="text-sm font-normal text-muted-foreground">ítems</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="group bg-gradient-to-br from-card via-transparent to-emerald-500/10 border border-zinc-500/20 hover:border-emerald-500/50 backdrop-blur-md overflow-hidden relative shadow-sm transition-all duration-500">
                        <div className="absolute inset-0 pointer-events-none">
                            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                                <line x1="0" y1="100" x2="100" y2="0" vectorEffect="non-scaling-stroke" className="stroke-zinc-500/20 group-hover:stroke-emerald-500/50 transition-colors duration-500" strokeWidth="1.5" />
                            </svg>
                        </div>
                        <div className="absolute right-0 top-0 p-3 opacity-5 pointer-events-none">
                            <DollarSign className="w-24 h-24 text-emerald-500" />
                        </div>
                        <CardContent className="p-5 h-full flex flex-col justify-between relative z-10">
                            <div className="self-start">
                                <p className="text-[10px] font-bold text-muted-foreground/90 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                                    <DollarSign className="h-3 w-3" /> Valor (Costo)
                                </p>
                                <h2 className="text-2xl font-bold text-foreground">
                                    {formatMoney(totalCostValue)}
                                </h2>
                            </div>
                            <div className="self-end text-right">
                                <p className="text-[10px] font-bold text-emerald-600/90 uppercase tracking-wider mb-0.5">
                                    Valor (Venta)
                                </p>
                                <h2 className="text-2xl font-bold text-emerald-500">
                                    {formatMoney(totalSalesValue)}
                                </h2>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border border-orange-500/20 hover:border-orange-500/50 bg-gradient-to-br from-card via-card/95 to-orange-500/10 shadow-sm relative overflow-hidden transition-all duration-500">
                        <div className="absolute right-0 top-0 p-3 opacity-10">
                            <AlertTriangle className="w-24 h-24 text-orange-500" />
                        </div>
                        <CardContent className="p-6 flex flex-col justify-center h-full">
                            <div className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
                                <AlertTriangle className="h-4 w-4 text-orange-500" /> Alerta Stock Bajo
                            </div>
                            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                                {lowStockCount} <span className="text-sm font-normal text-muted-foreground">productos</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* --- TABLA DE PRODUCTOS --- */}
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <h2 className="text-lg font-semibold">Listado de Productos</h2>
                            
                            {/* BOTÓN DE ELIMINACIÓN MASIVA (Aparece si hay seleccionados) */}
                            {selectedIds.length > 0 && (
                                <Button 
                                    variant="destructive" 
                                    size="sm" 
                                    className="animate-in fade-in zoom-in duration-200"
                                    onClick={() => setIsBulkDeleteOpen(true)}
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Eliminar {selectedIds.length}
                                </Button>
                            )}
                        </div>

                        <div className="relative w-full sm:w-80">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar nombre, proveedor, categoría..."
                                className="pl-8 bg-background/50 border-border/50 focus:bg-background transition-colors"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden">
                        <CardContent className="p-0">
                            {isLoading ? (
                                <div className="space-y-2 p-4">
                                    <Skeleton className="h-10 w-full" />
                                    <Skeleton className="h-10 w-full" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            ) : filteredProducts?.length === 0 ? (
                                <div className="text-center py-16 text-muted-foreground flex flex-col items-center gap-3">
                                    <EmptyState 
                                        icon={Package}
                                        title="Sin resultados"
                                        description={searchTerm ? "No se encontraron repuestos ni proveedores con esa búsqueda" : "No tienes productos cargados"}
                                        actionLabel={!searchTerm ? "Crear Producto" : undefined}
                                        onAction={!searchTerm ? handleCreate : undefined}
                                    />
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-muted/30 hover:bg-muted/30">
                                                {/* CHECKBOX CABECERA */}
                                                <TableHead className="w-12 text-center">
                                                    <Checkbox 
                                                        checked={selectedIds.length > 0 && selectedIds.length === filteredProducts.length}
                                                        onCheckedChange={toggleSelectAll}
                                                        aria-label="Seleccionar todos"
                                                    />
                                                </TableHead>
                                                <TableHead>Producto / Detalles</TableHead>
                                                <TableHead>Categoría / Proveedor</TableHead>
                                                <TableHead className="text-right">Costo</TableHead>
                                                <TableHead className="text-right">Venta</TableHead>
                                                <TableHead className="text-center w-[120px]">Stock</TableHead>
                                                <TableHead className="text-right">Acciones</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredProducts?.map((product) => {
                                                const isLowStock = product.quantity <= (product.lowStockThreshold || 0);
                                                const isSelected = selectedIds.includes(product.id);
                                                
                                                return (
                                                    <TableRow 
                                                        key={product.id} 
                                                        className={cn(
                                                            "hover:bg-muted/30 transition-colors group cursor-default",
                                                            isSelected && "bg-primary/5 hover:bg-primary/10"
                                                        )}
                                                    >
                                                        {/* CHECKBOX FILA */}
                                                        <TableCell className="text-center">
                                                            <Checkbox 
                                                                checked={isSelected}
                                                                onCheckedChange={() => toggleSelect(product.id)}
                                                                aria-label={`Seleccionar ${product.name}`}
                                                            />
                                                        </TableCell>
                                                        
                                                        <TableCell>
                                                            <div className="flex flex-col">
                                                                <span className="font-medium text-foreground">{product.name}</span>
                                                                <div className="flex items-center gap-2 mt-0.5">
                                                                    {product.sku && <span className="font-mono text-[10px] text-muted-foreground/70 bg-muted px-1 rounded border">SKU: {product.sku}</span>}
                                                                    {product.description && (
                                                                        <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                                            {product.description}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </TableCell>

                                                        <TableCell>
                                                            <div className="flex flex-col gap-1.5 items-start">
                                                                <Badge variant="outline" className="font-normal text-[10px] bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 flex w-fit items-center gap-1 py-0 px-1.5">
                                                                    <Tag className="h-3 w-3 opacity-70" />
                                                                    {product.category || "General"}
                                                                </Badge>
                                                                
                                                                {product.supplier && (
                                                                    <Badge variant="outline" className="font-normal text-[10px] bg-amber-500/5 text-amber-600 dark:text-amber-500 border-amber-500/20 flex w-fit items-center gap-1 py-0 px-1.5">
                                                                        <Building2 className="h-3 w-3 opacity-70" />
                                                                        {product.supplier}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </TableCell>

                                                        <TableCell className="text-right text-muted-foreground font-mono text-xs">
                                                            {formatMoney(Number(product.cost))}
                                                        </TableCell>
                                                        <TableCell className="text-right font-bold tabular-nums text-sm">
                                                            {formatMoney(Number(product.price))}
                                                        </TableCell>
                                                        
                                                        <TableCell className="text-center">
                                                            <div className="flex items-center justify-center gap-2">
                                                                {isLowStock ? (
                                                                    <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20 h-6 px-2 gap-1.5">
                                                                        <span className="font-bold">{product.quantity}</span>
                                                                        <AlertTriangle className="h-3 w-3 animate-pulse" />
                                                                    </Badge>
                                                                ) : (
                                                                    <span className="font-medium tabular-nums text-muted-foreground">
                                                                        {product.quantity}
                                                                    </span>
                                                                )}
                                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <QuickRestockPopover product={product} />
                                                                </div>
                                                            </div>
                                                        </TableCell>

                                                        <TableCell className="text-right">
                                                            <div className="flex justify-end gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                                                                <Button variant="ghost" size="icon" onClick={() => handleEdit(product)} className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10">
                                                                    <Pencil className="h-4 w-4" />
                                                                </Button>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteClick(product)}>
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}