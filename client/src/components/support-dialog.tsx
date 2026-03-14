import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { HelpCircle, X, Upload, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const supportFormSchema = z.object({
  message: z.string().min(10, "El mensaje debe tener al menos 10 caracteres"),
});

type SupportFormValues = z.infer<typeof supportFormSchema>;

interface SupportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SupportDialog({ open, onOpenChange }: SupportDialogProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const form = useForm<SupportFormValues>({
    resolver: zodResolver(supportFormSchema),
    defaultValues: {
      message: "",
    },
  });

  const sendSupportRequest = useMutation({
    mutationFn: async (data: SupportFormValues) => {
      // 1. Upload Images First (if any)
      const uploadedUrls: string[] = [];

      if (images.length > 0) {
        toast({ title: "Subiendo imágenes...", description: "Por favor espere." });

        for (const image of images) {
          const formData = new FormData();
          formData.append("file", image);

          const { data: { session } } = await supabase.auth.getSession();
          const headers: Record<string, string> = {};
          if (session?.access_token) {
            headers["Authorization"] = `Bearer ${session.access_token}`;
          }

          const uploadRes = await fetch("/api/upload", {
            method: "POST",
            headers,
            body: formData,
          });

          if (!uploadRes.ok) {
            throw new Error(`Error al subir imagen: ${image.name}`);
          }

          const uploadData = await uploadRes.json();
          uploadedUrls.push(uploadData.url);
        }
      }

      // 2. Send Support Ticket with URLs
      const payload = {
        message: data.message,
        imageUrls: uploadedUrls,
      };

      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const res = await fetch("/api/support", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let errorMessage = "Error al enviar el mensaje";
        try {
          const errorData = await res.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          const text = await res.text();
          errorMessage = text || errorMessage;
        }
        throw new Error(errorMessage);
      }

      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Mensaje enviado",
        description: "Tu solicitud de soporte ha sido enviada correctamente al equipo."
      });
      form.reset();
      setImages([]);
      setImagePreviews([]);
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error al enviar",
        description: error.message || "No se pudo enviar el mensaje",
        variant: "destructive"
      });
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // Validar tipo
    const validImages = files.filter(file => file.type.startsWith('image/'));

    if (validImages.length === 0 && files.length > 0) {
      toast({ title: "Archivo inválido", description: "Solo se permiten imágenes.", variant: "destructive" });
      return;
    }

    // Validar tamaño (Max 5MB por foto)
    const validSize = validImages.filter(file => file.size <= 5 * 1024 * 1024);

    if (validSize.length < validImages.length) {
      toast({ title: "Imagen muy grande", description: "Alguna imagen supera los 5MB.", variant: "destructive" });
    }

    if (validSize.length === 0) return;

    // Limitar a 5 imágenes total
    const currentCount = images.length;
    const availableSlots = 5 - currentCount;
    const finalSelection = validSize.slice(0, availableSlots);

    if (finalSelection.length < validSize.length) {
      // CORREGIDO: Se cambió "warning" por "destructive"
      toast({ title: "Límite alcanzado", description: "Solo puedes subir hasta 5 imágenes.", variant: "destructive" });
    }

    const newImages = [...images, ...finalSelection];
    setImages(newImages);

    // Crear previews
    const newPreviews = finalSelection.map(file => URL.createObjectURL(file));
    setImagePreviews([...imagePreviews, ...newPreviews]);

    // Reset input para permitir subir la misma foto si se borra y se quiere subir de nuevo
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    URL.revokeObjectURL(imagePreviews[index]);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setImagePreviews(newPreviews);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const onSubmit = form.handleSubmit((data) => {
    sendSupportRequest.mutate(data);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            Contactar Soporte
          </DialogTitle>
          <DialogDescription>
            Describe tu problema o consulta. Adjunta capturas de pantalla si es necesario.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mensaje *</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Hola, tengo un problema con..."
                      className="min-h-[120px] resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <Label>Imágenes (opcional)</Label>

              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                ref={fileInputRef}
                onChange={handleImageChange}
                disabled={images.length >= 5 || sendSupportRequest.isPending}
              />

              <div
                onClick={() => images.length < 5 && triggerFileInput()}
                className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer 
                  ${images.length >= 5
                    ? 'opacity-50 cursor-not-allowed bg-muted'
                    : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5'
                  }`}
              >
                <div className="p-3 bg-background rounded-full shadow-sm">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    {images.length >= 5 ? "Límite alcanzado (5/5)" : "Haz clic para subir imágenes"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG hasta 5MB
                  </p>
                </div>
              </div>

              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-4 gap-3 mt-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border bg-background">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage(index);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={sendSupportRequest.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={sendSupportRequest.isPending}
                className="min-w-[120px]"
              >
                {sendSupportRequest.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Enviar Mensaje"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}