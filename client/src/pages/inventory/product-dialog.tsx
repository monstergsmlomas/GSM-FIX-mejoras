import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check, ChevronsUpDown, SaveAll } from "lucide-react";
import { cn } from "@/lib/utils";
import { insertProductSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@shared/schema";

const formSchema = insertProductSchema;({
  supplier: z.string().optional(),
});

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product;
  lastSupplier?: string;
  lastCategory?: string;
  onSaveAndContinue?: (supplier: string, category: string) => void;
}

export function ProductDialog({ 
  open, 
  onOpenChange, 
  product, 
  lastSupplier = "", 
  lastCategory = "General",
  onSaveAndContinue
}: ProductDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [openCategory, setOpenCategory] = useState(false);
  const [openSupplier, setOpenSupplier] = useState(false);

  // 👇 ESTADOS SEGUROS PARA CAPTURAR EL TEXTO EXACTO 👇
  const [catSearch, setCatSearch] = useState("");
  const [supSearch, setSupSearch] = useState("");

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    enabled: open,
  });

  // Extraemos y ordenamos categorías/proveedores únicos
  const existingCategories = Array.from(new Set(
    products.map(p => p.category).filter((c): c is string => !!c)
  )).sort();

  const existingSuppliers = Array.from(new Set(
    products.map(p => p.supplier).filter((s): s is string => !!s)
  )).sort();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      sku: "",
      category: lastCategory,
      supplier: lastSupplier,
      cost: 0,
      price: 0,
      quantity: 0,
      lowStockThreshold: 5,
    },
  });

  useEffect(() => {
    if (product) {
      form.reset({
        ...product,
        cost: Number(product.cost),
        price: Number(product.price),
        description: product.description || "",
        sku: product.sku || "",
        category: product.category || "",
        supplier: product.supplier || "", // Cargamos el proveedor si existe
        lowStockThreshold: product.lowStockThreshold || 5,
      });
    } else {
      form.reset({
        name: "",
        description: "",
        sku: "",
        category: lastCategory,
        supplier: lastSupplier,
        cost: 0,
        price: 0,
        quantity: 0,
        lowStockThreshold: 5,
      });
    }
  }, [product, form, open, lastCategory, lastSupplier]);

  const mutation = useMutation({
    mutationFn: async ({ values, mode }: { values: z.infer<typeof formSchema>, mode: "normal" | "continue" }) => {
      const payload = {
        ...values,
        cost: Number(values.cost),
        price: Number(values.price),
        quantity: Number(values.quantity),
        lowStockThreshold: Number(values.lowStockThreshold),
      };

      if (product) {
        await apiRequest("PATCH", `/api/products/${product.id}`, payload);
      } else {
        await apiRequest("POST", "/api/products", payload);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });

      toast({
        title: product ? "Producto actualizado" : "Producto guardado",
        description: `Datos sincronizados con éxito.`,
      });

      if (variables.mode === "continue") {
        onSaveAndContinue?.(variables.values.supplier || "", variables.values.category || "General");
        
        form.reset({
          name: "",
          description: "",
          sku: "",
          category: variables.values.category || "General",
          supplier: variables.values.supplier || "",
          cost: 0,
          price: 0,
          quantity: 0,
          lowStockThreshold: 5,
        });
        setTimeout(() => document.getElementById("product-name-input")?.focus(), 100);
      } else {
        onOpenChange(false);
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Hubo un error al guardar.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    // 👇 ESTE ES NUESTRO MICRÓFONO OCULTO 👇
    console.log("📦 ENVIANDO AL SERVIDOR:", values);
    mutation.mutate({ values, mode: "normal" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? "Editar Producto" : "Nuevo Producto"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">

            {/* NOMBRE Y SKU */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del Producto *</FormLabel>
                    <FormControl>
                      <Input id="product-name-input" placeholder="Ej: Pantalla iPhone X" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código / SKU</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: P-IPHX-001" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* CATEGORÍA Y PROVEEDOR */}
            <div className="grid grid-cols-2 gap-4">
              {/* --- COMBOBOX CATEGORÍA --- */}
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem className="flex flex-col mt-2">
                    <FormLabel className="mb-1">Categoría</FormLabel>
                    <Popover open={openCategory} onOpenChange={setOpenCategory}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant="outline" role="combobox" aria-expanded={openCategory} className={cn("w-full justify-between", !field.value && "text-muted-foreground")}>
                            {field.value || "Seleccionar categoría..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0" align="start">
                        <Command>
                          <CommandInput 
                            placeholder="Buscar o crear nueva..." 
                            value={catSearch}
                            onValueChange={setCatSearch} 
                          />
                          <CommandList>
                            {catSearch.length > 0 && (
                              <CommandEmpty>
                                <Button 
                                  type="button"
                                  variant="secondary" 
                                  className="w-full justify-start h-8 font-normal" 
                                  onClick={(e) => {
                                    e.preventDefault();
                                    form.setValue("category", catSearch);
                                    setOpenCategory(false);
                                    setCatSearch("");
                                  }}
                                >
                                  + Añadir: "{catSearch}"
                                </Button>
                              </CommandEmpty>
                            )}
                            <CommandGroup heading="Sugerencias">
                              {existingCategories.map((category) => (
                                <CommandItem 
                                  key={category} 
                                  value={category} 
                                  onSelect={() => { 
                                    form.setValue("category", category); // Usamos la variable original para respetar mayúsculas
                                    setOpenCategory(false); 
                                    setCatSearch("");
                                  }}
                                >
                                  <Check className={cn("mr-2 h-4 w-4", field.value === category ? "opacity-100" : "opacity-0")} />
                                  {category}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* --- COMBOBOX PROVEEDOR --- */}
              <FormField
                control={form.control}
                name="supplier"
                render={({ field }) => (
                  <FormItem className="flex flex-col mt-2">
                    <FormLabel className="mb-1">Proveedor</FormLabel>
                    <Popover open={openSupplier} onOpenChange={setOpenSupplier}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant="outline" role="combobox" aria-expanded={openSupplier} className={cn("w-full justify-between", !field.value && "text-muted-foreground")}>
                            {field.value || "Seleccionar proveedor..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0" align="start">
                        <Command>
                          <CommandInput 
                            placeholder="Buscar o crear proveedor..." 
                            value={supSearch}
                            onValueChange={setSupSearch} 
                          />
                          <CommandList>
                            {supSearch.length > 0 && (
                              <CommandEmpty>
                                <Button 
                                  type="button"
                                  variant="secondary" 
                                  className="w-full justify-start h-8 font-normal" 
                                  onClick={(e) => {
                                    e.preventDefault();
                                    form.setValue("supplier", supSearch);
                                    setOpenSupplier(false);
                                    setSupSearch("");
                                  }}
                                >
                                  + Añadir: "{supSearch}"
                                </Button>
                              </CommandEmpty>
                            )}
                            <CommandGroup heading="Proveedores conocidos">
                              {existingSuppliers.map((supplier) => (
                                <CommandItem 
                                  key={supplier} 
                                  value={supplier} 
                                  onSelect={() => { 
                                    form.setValue("supplier", supplier); // Respetamos las mayúsculas originales
                                    setOpenSupplier(false); 
                                    setSupSearch("");
                                  }}
                                >
                                  <Check className={cn("mr-2 h-4 w-4", field.value === supplier ? "opacity-100" : "opacity-0")} />
                                  {supplier}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* PRECIOS Y STOCK */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Costo (Compra)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} value={field.value ?? 0} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio (Venta)</FormLabel>
                    <FormControl>
                      <Input type="number" className="font-bold text-emerald-600" {...field} value={field.value ?? 0} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cantidad Actual</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} value={field.value ?? 0} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lowStockThreshold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alerta Stock Bajo</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} value={field.value ?? 0} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción / Notas</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Detalles adicionales..." {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4 flex sm:justify-between items-center">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <div className="flex gap-2">
                {!product && (
                  <Button 
                    type="button" 
                    variant="secondary" 
                    disabled={mutation.isPending}
                    className="bg-primary/10 text-primary hover:bg-primary/20"
                    onClick={(e) => {
                      e.preventDefault();
                      form.handleSubmit((values) => mutation.mutate({ values, mode: "continue" }))();
                    }}
                  >
                    <SaveAll className="w-4 h-4 mr-2" />
                    Guardar y agregar otro
                  </Button>
                )}
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? "Guardando..." : (product ? "Actualizar" : "Guardar")}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}