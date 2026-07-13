import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

// A decorator: supplies a TanStack Query client so components using useQuery /
// useMutation render in isolation (they throw without a QueryClientProvider).
const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } });

export default function withQueryClient({ children }: { children?: ReactNode }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
