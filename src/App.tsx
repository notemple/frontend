import { useDocumentStore } from '@/features/documents/store';
import { OnboardingScreen } from '@/features/onboarding/OnboardingScreen';
import { useSettingsStore } from '@/features/settings/store';
import { useTaskStore } from '@/features/tasks/store';
import { RootLayout } from '@/shell/RootLayout';
import { QueryClient,QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';

const queryClient = new QueryClient();

export default function App() {
  const roundness = useSettingsStore(state => state.roundness);
  const isOnboardingCompleted = useSettingsStore(state => state.isOnboardingCompleted);

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
      {!isOnboardingCompleted && <OnboardingScreen />}
    </QueryClientProvider>
  );
}
