import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Bell, Shield, Database, Mail } from "lucide-react";

const Settings = () => {
  const { toast } = useToast();

  const handleSave = () => {
    toast({
      title: "설정 저장됨",
      description: "변경사항이 저장되었습니다.",
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">설정</h1>
          <p className="text-muted-foreground mt-2">
            시스템 전반의 설정을 관리합니다
          </p>
        </div>

        <div className="grid gap-6">
          {/* Notifications */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                <CardTitle>알림 설정</CardTitle>
              </div>
              <CardDescription>
                시스템 알림 설정을 관리합니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>이메일 알림</Label>
                  <p className="text-sm text-muted-foreground">
                    중요한 이벤트에 대한 이메일 알림 받기
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>퀴즈 완료 알림</Label>
                  <p className="text-sm text-muted-foreground">
                    직원이 퀴즈를 완료하면 알림 받기
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>문서 업로드 알림</Label>
                  <p className="text-sm text-muted-foreground">
                    새 문서가 업로드되면 알림 받기
                  </p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                <CardTitle>보안 설정</CardTitle>
              </div>
              <CardDescription>
                시스템 보안 설정을 관리합니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>2단계 인증 필수</Label>
                  <p className="text-sm text-muted-foreground">
                    모든 사용자에게 2단계 인증 요구
                  </p>
                </div>
                <Switch />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>자동 로그아웃</Label>
                  <p className="text-sm text-muted-foreground">
                    비활성 30분 후 자동 로그아웃
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>비밀번호 최소 길이</Label>
                <Input type="number" defaultValue="8" min="6" max="20" />
              </div>
            </CardContent>
          </Card>

          {/* Database */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                <CardTitle>데이터베이스</CardTitle>
              </div>
              <CardDescription>
                데이터베이스 설정을 관리합니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>자동 백업</Label>
                  <p className="text-sm text-muted-foreground">
                    매일 자동으로 데이터베이스 백업
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>백업 보관 기간 (일)</Label>
                <Input type="number" defaultValue="30" min="7" max="365" />
              </div>
            </CardContent>
          </Card>

          {/* Email */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                <CardTitle>이메일 설정</CardTitle>
              </div>
              <CardDescription>
                이메일 발송 설정을 관리합니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>발신자 이름</Label>
                <Input defaultValue="OnQuiz" />
              </div>
              <div className="space-y-2">
                <Label>발신자 이메일</Label>
                <Input type="email" defaultValue="noreply@onquiz.com" />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button variant="outline">취소</Button>
            <Button onClick={handleSave}>변경사항 저장</Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Settings;
