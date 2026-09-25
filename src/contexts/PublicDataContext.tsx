import { createContext, useContext, ReactNode } from 'react';
import { usePublicData } from '@/hooks/usePublicData';

type PublicDataContextType = ReturnType<typeof usePublicData>;

const PublicDataContext = createContext<PublicDataContextType | undefined>(undefined);

export const PublicDataProvider = ({ children }: { children: ReactNode }) => {
  const publicData = usePublicData();
  
  return (
    <PublicDataContext.Provider value={publicData}>
      {children}
    </PublicDataContext.Provider>
  );
};

export const usePublicDataContext = () => {
  const context = useContext(PublicDataContext);
  if (context === undefined) {
    throw new Error('usePublicDataContext must be used within a PublicDataProvider');
  }
  return context;
};

