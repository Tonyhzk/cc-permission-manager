import { useEffect } from 'react';
import { Header } from '@/components/layout';
import { GlobalConfigPanel } from '@/components/global-config';
import { useConfigStore } from '@/stores';

function App() {
  const { loadConfig } = useConfigStore();

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      <Header />

      <main className="flex-1 overflow-auto p-6">
        <GlobalConfigPanel />
      </main>
    </div>
  );
}

export default App;
