import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const QuizTake = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [quiz, setQuiz] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !quizId) return;
    
    fetchQuizData();
    createAttempt();
  }, [user, quizId]);

  const fetchQuizData = async () => {
    const { data: quizData } = await supabase
      .from('quizzes')
      .select('*, categories(name)')
      .eq('id', quizId)
      .single();

    if (quizData) {
      setQuiz(quizData);
    }

    const { data: questionsData } = await supabase
      .from('quiz_questions')
      .select('*, quiz_options(*)')
      .eq('quiz_id', quizId)
      .order('order_index');

    if (questionsData) {
      setQuestions(questionsData);
    }

    setLoading(false);
  };

  const createAttempt = async () => {
    const { data } = await supabase
      .from('quiz_attempts')
      .insert({
        quiz_id: quizId,
        user_id: user?.id,
        status: 'in_progress'
      })
      .select()
      .single();

    if (data) {
      setAttemptId(data.id);
    }
  };

  const handleAnswerChange = (optionId: string) => {
    setAnswers({
      ...answers,
      [questions[currentQuestionIndex].id]: optionId
    });
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    if (!attemptId) return;

    let totalScore = 0;
    let totalPoints = 0;
    const answerRecords = [];

    for (const question of questions) {
      totalPoints += question.points;
      const selectedOptionId = answers[question.id];
      
      if (selectedOptionId) {
        const selectedOption = question.quiz_options.find(
          (opt: any) => opt.id === selectedOptionId
        );
        
        const isCorrect = selectedOption?.is_correct || false;
        if (isCorrect) {
          totalScore += question.points;
        }

        answerRecords.push({
          attempt_id: attemptId,
          question_id: question.id,
          option_id: selectedOptionId,
          is_correct: isCorrect
        });
      }
    }

    // 답변 저장
    await supabase.from('quiz_answers').insert(answerRecords);

    // 응시 기록 업데이트
    const percentage = (totalScore / totalPoints) * 100;
    const { data } = await supabase
      .from('quiz_attempts')
      .update({
        score: totalScore,
        total_points: totalPoints,
        percentage: percentage,
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', attemptId)
      .select()
      .single();

    if (data) {
      setResults({
        score: totalScore,
        totalPoints,
        percentage,
        passed: percentage >= (quiz?.pass_score || 70)
      });
      setShowResults(true);
      toast.success("퀴즈를 완료했습니다!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>로딩 중...</p>
      </div>
    );
  }

  if (showResults && results) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-2xl">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4">
                {results.passed ? (
                  <CheckCircle className="h-20 w-20 text-success" />
                ) : (
                  <XCircle className="h-20 w-20 text-destructive" />
                )}
              </div>
              <CardTitle className="text-3xl">
                {results.passed ? "합격입니다!" : "재도전하세요!"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-2">
                <p className="text-5xl font-bold">{Math.round(results.percentage)}%</p>
                <p className="text-muted-foreground">
                  {results.score}점 / {results.totalPoints}점
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">문항별 결과</h3>
                {questions.map((question, index) => {
                  const selectedOptionId = answers[question.id];
                  const selectedOption = question.quiz_options.find(
                    (opt: any) => opt.id === selectedOptionId
                  );
                  const correctOption = question.quiz_options.find(
                    (opt: any) => opt.is_correct
                  );

                  return (
                    <div key={question.id} className="rounded-lg border p-4">
                      <div className="flex items-start gap-3 mb-2">
                        {selectedOption?.is_correct ? (
                          <CheckCircle className="h-5 w-5 text-success mt-1" />
                        ) : (
                          <XCircle className="h-5 w-5 text-destructive mt-1" />
                        )}
                        <div className="flex-1">
                          <p className="font-medium">문제 {index + 1}</p>
                          <p className="text-sm">{question.question_text}</p>
                        </div>
                      </div>
                      <div className="ml-8 space-y-2">
                        <p className="text-sm">
                          <span className="text-muted-foreground">정답:</span>{" "}
                          <span className="font-medium">{correctOption?.option_text}</span>
                        </p>
                        {correctOption?.explanation && (
                          <p className="text-sm text-muted-foreground">
                            {correctOption.explanation}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => navigate("/employee/dashboard")} className="flex-1">
                  대시보드로
                </Button>
                <Button onClick={() => window.location.reload()} className="flex-1">
                  다시 풀기
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl py-8">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate("/employee/dashboard")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            돌아가기
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <CardTitle>{quiz?.title}</CardTitle>
                <span className="text-sm text-muted-foreground">
                  {currentQuestionIndex + 1} / {questions.length}
                </span>
              </div>
              <Progress value={progress} />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentQuestion && (
              <>
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    {currentQuestion.question_text}
                  </h3>
                  
                  <RadioGroup
                    value={answers[currentQuestion.id] || ""}
                    onValueChange={handleAnswerChange}
                  >
                    <div className="space-y-3">
                      {currentQuestion.quiz_options?.map((option: any, idx: number) => (
                        <div
                          key={option.id}
                          className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                        >
                          <RadioGroupItem value={option.id} id={option.id} />
                          <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                            <span className="font-medium mr-2">
                              {String.fromCharCode(65 + idx)}.
                            </span>
                            {option.option_text}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                </div>

                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentQuestionIndex === 0}
                  >
                    이전 문제
                  </Button>
                  
                  {isLastQuestion ? (
                    <Button
                      onClick={handleSubmit}
                      disabled={Object.keys(answers).length !== questions.length}
                      className="gap-2"
                    >
                      제출하기
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button onClick={handleNext} className="gap-2">
                      다음 문제
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default QuizTake;
