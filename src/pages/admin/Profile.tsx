import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AdminLayout from "@/components/admin/AdminLayout";
import { Pencil } from "lucide-react";

const AdminProfile = () => {
  const { user } = useAuth();
  const { role } = useUserRole();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingJob, setIsEditingJob] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    job_title: '',
    department_id: ''
  });

  const emailDomain = formData.email.includes('@') 
    ? formData.email.split('@')[1] 
    : (profile?.companies?.name || '-');

  useEffect(() => {
    fetchProfile();
    fetchDepartments();
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
      setFormData({
        name: data.name || '',
        email: data.email || '',
        job_title: data.job_title || '',
        department_id: data.department_id || ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error("프로필을 불러올 수 없습니다");
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    if (!user) return;

    try {
      // Get user's company_id first
      const { data: profileData } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profileData?.company_id) return;

      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('company_id', profileData.company_id)
        .order('name');

      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          email: formData.email,
          job_title: formData.job_title,
          department_id: formData.department_id || null
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success("프로필이 업데이트되었습니다");
      setIsEditing(false);
      await fetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error("프로필 업데이트에 실패했습니다");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: profile?.name || '',
      email: profile?.email || '',
      job_title: profile?.job_title || '',
      department_id: profile?.department_id || ''
    });
    setIsEditing(false);
    setIsEditingJob(false);
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
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>기본 정보</CardTitle>
                <CardDescription>
                  계정의 기본 정보입니다
                </CardDescription>
              </div>
              {!isEditing && (
                <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>이름</Label>
                <Input 
                  value={isEditing ? formData.name : profile?.name || ''} 
                  disabled={!isEditing}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>이메일</Label>
                <Input 
                  type="email"
                  value={isEditing ? formData.email : profile?.email || ''} 
                  disabled={!isEditing}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>회사</Label>
                <Input value={emailDomain} disabled />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>직무 정보</CardTitle>
                <CardDescription>
                  소속 및 권한 정보입니다
                </CardDescription>
              </div>
              {!isEditingJob && (
                <Button variant="ghost" size="icon" onClick={() => setIsEditingJob(true)}>
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>부서</Label>
                {isEditingJob ? (
                  <Select 
                    value={formData.department_id} 
                    onValueChange={(value) => setFormData({ ...formData, department_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="부서 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input value={profile?.departments?.name || '-'} disabled />
                )}
              </div>
              <div className="space-y-2">
                <Label>직급</Label>
                {isEditingJob ? (
                  <Select
                    value={formData.job_title}
                    onValueChange={(value) => setFormData({ ...formData, job_title: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="직급을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="인턴">인턴</SelectItem>
                      <SelectItem value="사원">사원</SelectItem>
                      <SelectItem value="대리">대리</SelectItem>
                      <SelectItem value="과장">과장</SelectItem>
                      <SelectItem value="차장">차장</SelectItem>
                      <SelectItem value="팀장">팀장</SelectItem>
                      <SelectItem value="부장">부장</SelectItem>
                      <SelectItem value="이사">이사</SelectItem>
                      <SelectItem value="본부장">본부장</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Input value={profile?.job_title || '-'} disabled />
                )}
              </div>
              <div className="space-y-2">
                <Label>권한</Label>
                <Input value={getRoleLabel(role)} disabled />
              </div>
            </CardContent>
          </Card>
        </div>

        {(isEditing || isEditingJob) && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleCancel}>
                  취소
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? "저장 중..." : "저장"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {!(isEditing || isEditingJob) && (
          <Card>
            <CardHeader>
              <CardTitle>계정 관리</CardTitle>
              <CardDescription>
                계정 설정을 변경할 수 있습니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" disabled>
                비밀번호 변경 (준비 중)
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminProfile;
