import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type UserRole = 'super_admin' | 'admin' | 'manager' | 'member';

export const useUserRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole>('member');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setRole(data.role as UserRole);
      }
      
      setLoading(false);
    };

    fetchUserRole();
  }, [user?.id]);

  const isAdmin = role === 'super_admin' || role === 'admin';
  const isManager = role === 'manager';
  const isMember = role === 'member';

  return { role, isAdmin, isManager, isMember, loading };
};
