import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RootLayout } from '@/shell/RootLayout';
import { useDocumentStore } from '@/features/documents/store';
import { useTaskStore } from '@/features/tasks/store';
import { useSettingsStore } from '@/features/settings/store';

const queryClient = new QueryClient();

export default function App() {
  const roundness = useSettingsStore(state => state.roundness);

  useEffect(() => {
    // Bootstrap local-first IndexedDB storage stores
    useDocumentStore.getState().initialize();
    useTaskStore.getState().initialize();
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('roundness-none', 'roundness-md', 'roundness-lg');
    const suffix = roundness === 'rounded-lg' ? 'lg' : roundness === 'rounded-md' ? 'md' : 'none';
    root.classList.add(`roundness-${suffix}`);
  }, [roundness]);

  return (
    <QueryClientProvider client={queryClient}>
      <RootLayout />
    </QueryClientProvider>
  );
}
