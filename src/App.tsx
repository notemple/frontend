import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RootLayout } from '@/shell/RootLayout';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RootLayout />
    </QueryClientProvider>
  );
}
