import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileUp, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import readXlsxFile from "read-excel-file";
import { apiRequest } from "@/lib/queryClient";

interface ImportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ImportDialog({ open, onOpenChange }: ImportDialogProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);

    // 👇 FUNCIÓN PARA DESCARGAR LA PLANTILLA 👇
    const handleDownloadTemplate = () => {
        const headers = ["Nombre", "SKU", "Categoría", "Proveedor", "Costo", "Precio Venta", "Stock Actual", "Alerta Stock", "Descripción"];
        const exampleRow = ["Pantalla iPhone X", "P-IPHX", "Pantallas", "RYotech", "15000", "35000", "10", "3", "Original retirada de equipo"];
        
        // Creamos el contenido CSV con formato UTF-8 para que respete los acentos
        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
            + headers.join(",") + "\n" 
            + exampleRow.join(",");
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "plantilla_inventario.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsProcessing(true);
        setProgress(0);

        try {
            let dataRows: any[] = [];

            // 👇 SOPORTE PARA CSV (Plantilla) Y EXCEL 👇
            if (file.name.toLowerCase().endsWith('.csv')) {
                const text = await file.text();
                const lines = text.split('\n').filter(line => line.trim() !== '');
                // Separamos por comas y limpiamos comillas
                const allRows = lines.map(line => line.split(',').map(cell => cell.trim().replace(/^"|"$/g, '')));
                dataRows = allRows.slice(1); // Nos saltamos la cabecera
            } else {
                const allRows = await readXlsxFile(file);
                dataRows = allRows.slice(1); // Nos saltamos la cabecera
            }

            const total = dataRows.length;
            let successes = 0;
            let errors = 0;

            for (let i = 0; i < total; i++) {
                const row = dataRows[i];
                
                // NUEVO MAPEO ALINEADO CON LA PLANTILLA:
                // 0=Nombre, 1=SKU, 2=Categoría, 3=Proveedor, 4=Costo, 5=Precio, 6=Stock, 7=Alerta, 8=Descripción
                const productData = {
                    name: String(row[0] || "").trim(),
                    sku: String(row[1] || "").trim(),
                    category: String(row[2] || "General").trim(),
                    supplier: String(row[3] || "").trim(), // <--- AHORA ATRAPA AL PROVEEDOR
                    cost: Number(row[4]) || 0,
                    price: Number(row[5]) || 0,
                    quantity: Number(row[6]) || 0,
                    lowStockThreshold: Number(row[7]) || 5,
                    description: String(row[8] || "").trim(),
                };

                // El nombre es obligatorio
                if (!productData.name) {
                    errors++;
                    continue;
                }

                try {
                    await apiRequest("POST", "/api/products", productData);
                    successes++;
                } catch (err) {
                    console.error("Error creating product:", productData.name, err);
                    errors++;
                }

                setProgress(Math.round(((i + 1) / total) * 100));
            }

            await queryClient.invalidateQueries({ queryKey: ["/api/products"] });

            toast({
                title: "Importación Completada",
                description: `Se importaron ${successes} productos. ${errors > 0 ? `Hubo ${errors} errores (filas sin nombre o corruptas).` : ""}`,
                variant: errors > 0 ? "destructive" : "default",
            });

            onOpenChange(false);
        } catch (error) {
            console.error("File import error:", error);
            toast({
                title: "Error al leer archivo",
                description: "Asegúrese de que sea un archivo válido (.xlsx o .csv) con el formato de la plantilla.",
                variant: "destructive",
            });
        } finally {
            setIsProcessing(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Importar Productos</DialogTitle>
                    <DialogDescription>
                        Sube tu archivo de inventario en formato Excel (.xlsx) o CSV.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    
                    {/* 👇 BOTÓN PARA DESCARGAR LA PLANTILLA 👇 */}
                    <div className="flex flex-col gap-2 p-4 bg-muted/50 rounded-lg border border-border/50">
                        <p className="text-sm text-foreground font-medium flex items-center gap-2">
                            ¿No tienes el formato correcto?
                        </p>
                        <p className="text-xs text-muted-foreground mb-1">
                            Descarga nuestra plantilla, llénala con tus productos y vuelve a subirla aquí.
                        </p>
                        <Button 
                            type="button" 
                            variant="secondary" 
                            size="sm" 
                            onClick={handleDownloadTemplate}
                            className="w-fit"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Descargar Plantilla Base
                        </Button>
                    </div>

                    <div className="flex items-center justify-center w-full mt-2">
                        <label
                            htmlFor="dropzone-file"
                            className={`flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted/50 transition-colors ${isProcessing ? "opacity-50 pointer-events-none" : ""}`}
                        >
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                {isProcessing ? (
                                    <>
                                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                                        <p className="mt-4 text-sm font-medium text-foreground">Procesando... {progress}%</p>
                                        <p className="text-xs text-muted-foreground">Por favor no cierres esta ventana.</p>
                                    </>
                                ) : (
                                    <>
                                        <div className="p-3 bg-primary/10 rounded-full mb-3">
                                            <FileUp className="w-6 h-6 text-primary" />
                                        </div>
                                        <p className="mb-1 text-sm text-foreground">
                                            <span className="font-semibold">Haz clic aquí</span> para subir tu archivo
                                        </p>
                                        <p className="text-xs text-muted-foreground">Admite .XLSX, .XLS o .CSV</p>
                                    </>
                                )}
                            </div>
                            <Input
                                id="dropzone-file"
                                type="file"
                                className="hidden"
                                accept=".xlsx, .xls, .csv" // <--- Agregamos .csv
                                onChange={handleFileUpload}
                                disabled={isProcessing}
                                ref={fileInputRef}
                            />
                        </label>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}