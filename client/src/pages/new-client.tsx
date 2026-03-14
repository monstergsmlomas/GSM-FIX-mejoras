import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertClientSchema, type InsertClient } from "@shared/schema";

export default function NewClient() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const form = useForm<InsertClient>({
    resolver: zodResolver(insertClientSchema),
    defaultValues: {
      name: "",
      dni: "",
      address: "",
      phone: "",
      email: "",
      whoPicksUp: "",
      notes: "",
    },
  });

  const createClient = useMutation({
    mutationFn: async (data: InsertClient) => {
      const res = await apiRequest("POST", "/api/clients", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({ title: "Cliente creado exitosamente" });
      navigate("/clientes");
    },
    onError: () => {
      toast({ title: "Error al crear el cliente", variant: "destructive" });
    },
  });

  const onSubmit = form.handleSubmit((data) => {
    createClient.mutate(data);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild data-testid="button-back">
          <Link href="/clientes">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Nuevo Cliente</h1>
          <p className="text-muted-foreground">Agrega un nuevo cliente al sistema</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={onSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Información del Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre Completo *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""} // PROTECCIÓN CONTRA NULOS
                          placeholder="Juan Pérez"
                          data-testid="input-client-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dni"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>DNI / Documento *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""} // PROTECCIÓN CONTRA NULOS
                          placeholder="12.345.678"
                          data-testid="input-client-dni"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dirección *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""} // PROTECCIÓN CONTRA NULOS
                          placeholder="Av. Ejemplo 123, Ciudad"
                          data-testid="input-client-address"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""} // PROTECCIÓN CONTRA NULOS
                          placeholder="+54 11 1234-5678"
                          data-testid="input-client-phone"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""} // PROTECCIÓN CONTRA NULOS
                          type="email"
                          placeholder="cliente@email.com"
                          data-testid="input-client-email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="whoPicksUp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quien retira equipo</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""} // PROTECCIÓN CONTRA NULOS
                          placeholder="Nombre de autorizado (opcional)"
                          data-testid="input-client-who-picks-up"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value ?? ""} // PROTECCIÓN CONTRA NULOS
                        placeholder="Información adicional sobre el cliente..."
                        data-testid="input-client-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button variant="outline" asChild>
              <Link href="/clientes">Cancelar</Link>
            </Button>
            <Button type="submit" disabled={createClient.isPending} data-testid="button-submit-client">
              {createClient.isPending ? "Guardando..." : "Guardar Cliente"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}