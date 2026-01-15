import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { ContainersPage } from './pages/Containers';
import { AnalyticsPage } from './pages/Analytics';
import { SplashScreen } from './components/SplashScreen'; // Импортируем

function App() {
  const [isBackendReady, setIsBackendReady] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // --- HEALTHCHECK LOGIC ---
  useEffect(() => {
    let isMounted = true;
    const checkHealth = async () => {
      try {
        const res = await fetch('/api/health');
        if (res.ok) {
          if (isMounted) setIsBackendReady(true);
        } else {
          throw new Error("Not ready");
        }
      } catch (e) {
        if (isMounted) {
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 1000); // Пробуем каждую секунду
        }
      }
    };

    if (!isBackendReady) {
      checkHealth();
    }
    return () => { isMounted = false; };
  }, [isBackendReady, retryCount]);

  // --- RENDER ---

  // Пока бэкенд не готов — показываем Splash Screen
  if (!isBackendReady) {
    return <SplashScreen retryCount={retryCount} />;
  }

  // Когда готов — показываем приложение
  return (
    <BrowserRouter>
      <div className="h-screen overflow-y-auto bg-[#0a0a0a] text-gray-100 font-sans selection:bg-blue-500/30 relative">
        <Navigation />

        <Routes>
          <Route path="/" element={<ContainersPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;