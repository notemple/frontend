import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RootLayout } from '@/shell/RootLayout';
import { useDocumentStore } from '@/features/documents/store';
import { useTaskStore } from '@/features/tasks/store';

const queryClient = new QueryClient();

export default function App() {
  useEffect(() => {
    // Bootstrap local-first IndexedDB storage stores
    useDocumentStore.getState().initialize();
    useTaskStore.getState().initialize();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <RootLayout />
    </QueryClientProvider>
  );
}
