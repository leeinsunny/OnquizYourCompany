import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";

const Login = () => {
  const navigate = useNavigate();
  const { signIn, user } = useAuth();
  const { isAdmin, isManager, loading: roleLoading } = useUserRole();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && !roleLoading) {
      if (isAdmin || isManager) {
        navigate("/admin/dashboard");
      } else {
        navigate("/employee/dashboard");
      }
    }
  }, [user, isAdmin, isManager, roleLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("이메일과 비밀번호를 입력해주세요");
      return;
    }

    setLoading(true);
    const { error } = await signIn(email, password);
    
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        toast.error("이메일 또는 비밀번호가 올바르지 않습니다");
      } else {
        toast.error(error.message || "로그인 중 오류가 발생했습니다");
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
            <div className="mx-auto mb-4 h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-secondary" />
            <h1 className="text-2xl font-bold">OnQuiz 로그인</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              계정에 로그인하여 시작하세요
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>로그인</CardTitle>
              <CardDescription>
                회사 이메일과 비밀번호를 입력해주세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">이메일</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="yourname@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">비밀번호</Label>
                    <button
                      type="button"
                      className="text-sm text-primary hover:underline"
                      onClick={() => toast.info("비밀번호 재설정 기능은 준비 중입니다")}
                    >
                      비밀번호를 잊으셨나요?
                    </button>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  />
                  <Label htmlFor="remember" className="text-sm font-normal">
                    로그인 상태 유지
                  </Label>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "로그인 중..." : "로그인"}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      또는
                    </span>
                  </div>
                </div>

                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full"
                  onClick={() => toast.info("Google 로그인은 준비 중입니다")}
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Google로 계속하기
                </Button>

                <div className="text-center text-sm">
                  <span className="text-muted-foreground">계정이 없으신가요?</span>{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/signup")}
                    className="font-medium text-primary hover:underline"
                  >
                    회원가입
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="mt-4 text-center text-xs text-muted-foreground">
            <p>테스트 계정: 회사 이메일로 가입하면 자동으로 권한이 부여됩니다</p>
            <p>첫 번째 가입자는 자동으로 super_admin이 됩니다</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
