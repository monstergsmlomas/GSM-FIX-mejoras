import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient, listClients, type NewClient } from "@/lib/gsmApi";

export function useClients() {
  return useQuery({
    queryKey: ["clients"],
    queryFn: () => listClients(100),
  });
}

export function useCreateClient() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: NewClient) => createClient(input),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}