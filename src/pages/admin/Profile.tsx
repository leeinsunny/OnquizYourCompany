import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AdminLayout from "@/components/admin/AdminLayout";

const AdminProfile = () => {
  const { user } = useAuth();
  const { role } = useUserRole();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, departments(name), companies(name)')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error("프로필을 불러올 수 없습니다");
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      super_admin: "최고 관리자",
      admin: "관리자",
      manager: "매니저",
      member: "직원"
    };
    return labels[role] || role;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">프로필 설정</h1>
          <p className="text-muted-foreground mt-1">
            내 계정 정보를 확인하고 관리하세요
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>기본 정보</CardTitle>
              <CardDescription>
                계정의 기본 정보입니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>이름</Label>
                <Input value={profile?.name || ''} disabled />
              </div>
              <div className="space-y-2">
                <Label>이메일</Label>
                <Input value={profile?.email || ''} disabled />
              </div>
              <div className="space-y-2">
                <Label>회사</Label>
                <Input value={profile?.companies?.name || '-'} disabled />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>직무 정보</CardTitle>
              <CardDescription>
                소속 및 권한 정보입니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>부서</Label>
                <Input value={profile?.departments?.name || '-'} disabled />
              </div>
              <div className="space-y-2">
                <Label>직급</Label>
                <Input value={profile?.job_title || '-'} disabled />
              </div>
              <div className="space-y-2">
                <Label>권한</Label>
                <Input value={getRoleLabel(role)} disabled />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>계정 관리</CardTitle>
            <CardDescription>
              계정 설정을 변경할 수 있습니다
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              프로필 정보 수정이 필요한 경우 관리자에게 문의하세요.
            </p>
            <Button variant="outline" disabled>
              비밀번호 변경 (준비 중)
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminProfile;
