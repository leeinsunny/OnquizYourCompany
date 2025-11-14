import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";

const Signup = () => {
  const navigate = useNavigate();
  const { signUp, user } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    password: "",
    confirmPassword: "",
    department: "",
    jobTitle: "",
    termsAccepted: false,
    privacyAccepted: false
  });

  useEffect(() => {
    if (user && !roleLoading) {
      if (isAdmin) {
        navigate("/admin/dashboard");
      } else {
        navigate("/employee/dashboard");
      }
    }
  }, [user, isAdmin, roleLoading, navigate]);

  const departments = [
    "개발팀",
    "마케팅팀",
    "영업팀",
    "인사팀",
    "재무팀",
    "디자인팀",
    "기획팀",
    "운영팀"
  ];

  const jobTitles = [
    { value: "부장", label: "부장 (퀴즈 출제 및 관리 권한)", role: "admin" },
    { value: "이사", label: "이사 (퀴즈 출제 및 관리 권한)", role: "admin" },
    { value: "본부장", label: "본부장 (퀴즈 출제 및 관리 권한)", role: "admin" },
    { value: "과장", label: "과장 (퀴즈 출제 권한)", role: "manager" },
    { value: "차장", label: "차장 (퀴즈 출제 권한)", role: "manager" },
    { value: "팀장", label: "팀장 (퀴즈 출제 권한)", role: "manager" },
    { value: "대리", label: "대리 (퀴즈 응시)", role: "member" },
    { value: "사원", label: "사원 (퀴즈 응시)", role: "member" },
    { value: "인턴", label: "인턴 (퀴즈 응시)", role: "member" }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error("비밀번호가 일치하지 않습니다");
      return;
    }
    
    if (!formData.termsAccepted || !formData.privacyAccepted) {
      toast.error("약관에 동의해주세요");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("비밀번호는 최소 6자 이상이어야 합니다");
      return;
    }

    if (!formData.department) {
      toast.error("부서를 선택해주세요");
      return;
    }

    if (!formData.jobTitle) {
      toast.error("직급을 선택해주세요");
      return;
    }

    setLoading(true);
    const { error } = await signUp(
      formData.email, 
      formData.password, 
      formData.name,
      formData.department,
      formData.jobTitle
    );
    
    if (error) {
      if (error.message.includes('already registered')) {
        toast.error("이미 등록된 이메일입니다");
      } else {
        toast.error(error.message || "회원가입 중 오류가 발생했습니다");
      }
    } else {
      if (isAdmin) {
        navigate("/admin/dashboard");
      } else {
        navigate("/employee/dashboard");
      }
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container relative flex min-h-screen flex-col items-center justify-center py-8">
        <Button
          variant="ghost"
          className="absolute left-4 top-4 gap-2"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="h-4 w-4" />
          홈으로
        </Button>

        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-lg bg-gradient-hero" />
            <h1 className="text-2xl font-bold">OnQuiz 회원가입</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              AI 기반 온보딩 솔루션을 시작하세요
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>계정 만들기</CardTitle>
              <CardDescription>
                회사 이메일로 가입하시면 자동으로 회사와 연결됩니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">회사 이메일 *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="yourname@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    회사 도메인 이메일을 입력해주세요
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">이름 *</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="홍길동"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="password">비밀번호 *</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">비밀번호 확인 *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">부서 *</Label>
                  <Select
                    value={formData.department}
                    onValueChange={(value) => setFormData({ ...formData, department: value })}
                    required
                  >
                    <SelectTrigger id="department">
                      <SelectValue placeholder="부서를 선택하세요" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jobTitle">직급 *</Label>
                  <Select
                    value={formData.jobTitle}
                    onValueChange={(value) => setFormData({ ...formData, jobTitle: value })}
                    required
                  >
                    <SelectTrigger id="jobTitle">
                      <SelectValue placeholder="직급을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      {jobTitles.map((title) => (
                        <SelectItem key={title.value} value={title.value}>
                          {title.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    직급에 따라 자동으로 권한이 부여됩니다
                  </p>
                </div>

                <div className="space-y-3 pt-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="terms"
                      checked={formData.termsAccepted}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, termsAccepted: checked as boolean })
                      }
                    />
                    <Label htmlFor="terms" className="text-sm font-normal">
                      서비스 이용약관에 동의합니다 (필수)
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="privacy"
                      checked={formData.privacyAccepted}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, privacyAccepted: checked as boolean })
                      }
                    />
                    <Label htmlFor="privacy" className="text-sm font-normal">
                      개인정보 처리방침에 동의합니다 (필수)
                    </Label>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "처리 중..." : "회원가입"}
                </Button>

                <div className="text-center text-sm">
                  <span className="text-muted-foreground">이미 계정이 있으신가요?</span>{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="font-medium text-primary hover:underline"
                  >
                    로그인
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Signup;
