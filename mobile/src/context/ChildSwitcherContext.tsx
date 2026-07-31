import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { get } from '../api/client';
import { ParentStudent } from '../types/api';

interface ChildSwitcherContextType {
  selectedChildId: number;
  setSelectedChildId: (id: number) => void;
  childrenList: ParentStudent[];
}

const ChildSwitcherContext = createContext<ChildSwitcherContextType | undefined>(undefined);

export const ChildSwitcherProvider = ({ children }: { children: ReactNode }) => {
  const [selectedChildId, setSelectedChildId] = useState<number>(0);

  const { data: myChildren } = useQuery({
    queryKey: ['my-children'],
    queryFn: () => get<ParentStudent[]>('/api/parent-students/my_children/')
  });

  const childrenList = myChildren || [];

  useEffect(() => {
    if (childrenList.length > 0 && selectedChildId === 0) {
      setSelectedChildId(childrenList[0].student);
    }
  }, [childrenList, selectedChildId]);

  return (
    <ChildSwitcherContext.Provider value={{ selectedChildId, setSelectedChildId, childrenList }}>
      {children}
    </ChildSwitcherContext.Provider>
  );
};

export const useChildSwitcher = () => {
  const context = useContext(ChildSwitcherContext);
  if (!context) {
    throw new Error('useChildSwitcher must be used within a ChildSwitcherProvider');
  }
  return context;
};
