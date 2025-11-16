import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import EmployeeLayout from "@/components/employee/EmployeeLayout";
import MaterialDetail from "@/components/employee/MaterialDetail";
import { toast } from "sonner";

interface Document {
  id: string;
  title: string;
  file_type: string;
  file_size: number;
  created_at: string;
  category_name: string;
  quiz_title: string;
}

const EmployeeMaterials = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);

  useEffect(() => {
    fetchAssignedMaterials();
  }, []);

  const fetchAssignedMaterials = async () => {
    try {
      setLoading(true);

      // Get user's assigned quizzes
      const { data: assignments, error: assignmentsError } = await supabase
        .from('quiz_assignments')
        .select(`
          quiz_id,
          quiz:quizzes!inner (
            id,
            title,
            category_id,
            category:categories!inner (
              id,
              name,
              document_id
            )
          )
        `)
        .eq('user_id', user?.id);

      if (assignmentsError) throw assignmentsError;

      // Extract unique document IDs from assigned quizzes
      const documentIds = new Set<string>();
      const quizDocMap = new Map<string, { quizTitle: string; categoryName: string }>();

      assignments?.forEach((assignment: any) => {
        const docId = assignment.quiz.category.document_id;
        if (docId) {
          documentIds.add(docId);
          quizDocMap.set(docId, {
            quizTitle: assignment.quiz.title,
            categoryName: assignment.quiz.category.name
          });
        }
      });

      if (documentIds.size === 0) {
        setDocuments([]);
        setLoading(false);
        return;
      }

      // Fetch documents
      const { data: docs, error: docsError } = await supabase
        .from('documents')
        .select('*')
        .in('id', Array.from(documentIds))
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (docsError) throw docsError;

      // Enrich documents with quiz and category info
      const enrichedDocs = docs?.map(doc => {
        const info = quizDocMap.get(doc.id) || { quizTitle: '', categoryName: '' };
        return {
          ...doc,
          quiz_title: info.quizTitle,
          category_name: info.categoryName
        };
      }) || [];

      setDocuments(enrichedDocs);
    } catch (error) {
      console.error('Error fetching materials:', error);
      toast.error("자료를 불러오는 중 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (selectedDocumentId) {
    return (
      <EmployeeLayout>
        <MaterialDetail
          documentId={selectedDocumentId}
          onBack={() => setSelectedDocumentId(null)}
        />
      </EmployeeLayout>
    );
  }

  return (
    <EmployeeLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">온보딩 자료</h1>
          <p className="text-muted-foreground mt-2">
            할당된 퀴즈와 관련된 온보딩 자료를 확인하세요
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : documents.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center space-y-2">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
                <h3 className="text-lg font-semibold">온보딩 자료가 없습니다</h3>
                <p className="text-sm text-muted-foreground">
                  할당된 퀴즈가 없거나 퀴즈와 연결된 자료가 없습니다
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="text-left py-3">제목</th>
                      <th className="text-left py-3">퀴즈</th>
                      <th className="text-left py-3">카테고리</th>
                      <th className="text-left py-3">형식</th>
                      <th className="text-right py-3">크기</th>
                      <th className="text-right py-3">업로드</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((doc) => (
                      <tr
                        key={doc.id}
                        className="border-b hover:bg-muted/50 cursor-pointer"
                        onClick={() => setSelectedDocumentId(doc.id)}
                      >
                        <td className="py-3 font-medium text-foreground">{doc.title}</td>
                        <td className="py-3">{doc.quiz_title}</td>
                        <td className="py-3"><Badge variant="outline" className="text-xs">{doc.category_name}</Badge></td>
                        <td className="py-3">{doc.file_type}</td>
                        <td className="py-3 text-right">{formatFileSize(doc.file_size)}</td>
                        <td className="py-3 text-right">{formatDate(doc.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </EmployeeLayout>
  );
};

export default EmployeeMaterials;
