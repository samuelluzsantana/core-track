/**
 * ServiceContext — React provider for dependency-injected services.
 * 
 * Wraps the app and provides access to all services via useServices() hook.
 * Handles async initialization with a loading state.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { ServiceContainer, initializeServices } from '../services';

interface ServiceContextValue {
  services: ServiceContainer | null;
  loading: boolean;
  error: Error | null;
}

const ServiceContext = createContext<ServiceContextValue>({
  services: null,
  loading: true,
  error: null,
});

export function ServiceProvider({ children }: { children: React.ReactNode }) {
  const [services, setServices] = useState<ServiceContainer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    initializeServices()
      .then((s) => {
        setServices(s);
        setLoading(false);
      })
      .catch((err) => {
        console.error('[ServiceProvider] Initialization failed:', err);
        setError(err);
        setLoading(false);
      });
  }, []);

  return (
    <ServiceContext.Provider value={{ services, loading, error }}>
      {children}
    </ServiceContext.Provider>
  );
}

/**
 * Access the service container. Throws if used outside ServiceProvider.
 */
export function useServices(): ServiceContainer {
  const { services } = useContext(ServiceContext);
  if (!services) {
    throw new Error(
      'useServices() called before services initialized. ' +
      'Wrap your app with <ServiceProvider>.'
    );
  }
  return services;
}

/**
 * Access service loading state — useful for showing a splash screen.
 */
export function useServiceStatus() {
  return useContext(ServiceContext);
}
