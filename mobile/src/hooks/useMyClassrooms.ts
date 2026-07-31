import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { get } from '../api/client';
import { ClassRoom } from '../types/api';
import { useAuth } from '../context/AuthContext';

export function useMyClassrooms() {
  const { user } = useAuth();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['classrooms'],
    queryFn: () => get<ClassRoom[]>('/api/classrooms/'),
  });

  const myClassrooms = useMemo(() => {
    if (data && user) {
      return data.filter(c => 
        c.students.some(s => s.id === user.id) || 
        c.instructors.some(i => i.id === user.id)
      );
    }
    return [];
  }, [data, user]);

  return { myClassrooms, isLoading, isError, refetch };
}
