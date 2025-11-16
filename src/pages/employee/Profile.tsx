import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Award, TrendingUp, BookOpen, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import EmployeeLayout from "@/components/employee/EmployeeLayout";

const EmployeeProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    completedQuizzes: 0,
    averageScore: 0,
    highestScore: 0,
    totalTime: 0
  });
  const [categoryProgress, setCategoryProgress] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    if (!user) return;

    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*, departments(name)')
        .eq('id', user.id)
        .single();

      setProfile(profileData);

      // Fetch quiz attempts
      const { data: attempts } = await supabase
        .from('quiz_attempts')
        .select('*, quizzes(title, categories(name))')
        .eq('user_id', user.id);

      const completed = attempts?.filter(a => a.status === 'completed') || [];
      const avgScore = completed.length > 0
        ? completed.reduce((sum, a) => sum + (a.percentage || 0), 0) / completed.length
        : 0;
      const highScore = completed.length > 0
        ? Math.max(...completed.map(a => a.percentage || 0))
        : 0;
      const totalTime = completed.reduce((sum, a) => sum + (a.time_spent || 0), 0);

      setStats({
        totalQuizzes: attempts?.length || 0,
        completedQuizzes: completed.length,
        averageScore: Math.round(avgScore),
        highestScore: Math.round(highScore),
        totalTime: Math.round(totalTime / 60) // Convert to minutes
      });

      // Calculate category progress
      const categoryMap = new Map();
      completed.forEach(attempt => {
        const categoryName = attempt.quizzes?.categories?.name || '기타';
        if (!categoryMap.has(categoryName)) {
          categoryMap.set(categoryName, { name: categoryName, count: 0, totalScore: 0 });
        }
        const cat = categoryMap.get(categoryName);
        cat.count++;
        cat.totalScore += attempt.percentage || 0;
      });

      const categories = Array.from(categoryMap.values()).map(cat => ({
        name: cat.name,
        completed: cat.count,
        averageScore: Math.round(cat.totalScore / cat.count)
      }));

      setCategoryProgress(categories);
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const completionRate = stats.totalQuizzes > 0
    ? Math.round((stats.completedQuizzes / stats.totalQuizzes) * 100)
    : 0;

  return (
    <EmployeeLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">내 학습 현황</h1>
          <p className="text-muted-foreground mt-1">
            나의 온보딩 학습 진행 상황과 통계를 확인하세요
          </p>
        </div>

        {/* Profile Card */}
        {profile && (
          <Card>
            <CardHeader>
              <CardTitle>프로필 정보</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">이름</p>
                  <p className="font-medium">{profile.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">이메일</p>
                  <p className="font-medium">{profile.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">부서</p>
                  <p className="font-medium">{profile.departments?.name || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">직급</p>
                  <p className="font-medium">{profile.job_title || '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Learning Statistics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">총 퀴즈 수</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.completedQuizzes} / {stats.totalQuizzes}
              </div>
              <Progress value={completionRate} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">평균 점수</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageScore}점</div>
              <p className="text-xs text-muted-foreground mt-1">
                전체 퀴즈 평균
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">최고 점수</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.highestScore}점</div>
              <p className="text-xs text-muted-foreground mt-1">
                개인 최고 기록
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">총 학습 시간</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTime}분</div>
              <p className="text-xs text-muted-foreground mt-1">
                누적 학습 시간
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Category Progress */}
        <Card>
          <CardHeader>
            <CardTitle>카테고리별 진행도</CardTitle>
            <CardDescription>
              각 카테고리별 학습 완료 현황과 평균 점수
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">로딩 중...</p>
            ) : categoryProgress.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                아직 완료한 퀴즈가 없습니다
              </p>
            ) : (
              <div className="space-y-4">
                {categoryProgress.map((category, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{category.name}</span>
                      <Badge variant="secondary">
                        {category.completed}개 완료 · {category.averageScore}점
                      </Badge>
                    </div>
                    <Progress value={category.averageScore} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Badges */}
        <Card>
          <CardHeader>
            <CardTitle>획득 배지</CardTitle>
            <CardDescription>
              학습 목표를 달성하여 배지를 획득하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <Award className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                배지 시스템은 곧 제공될 예정입니다
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </EmployeeLayout>
  );
};

export default EmployeeProfile;
