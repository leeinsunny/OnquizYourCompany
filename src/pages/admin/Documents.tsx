import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Upload, FileText, Clock, CheckCircle, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

import AdminLayout from "@/components/admin/AdminLayout";

const AdminDocuments = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    const { data, error } = await supabase
      .from('documents')
      .select('*, categories(count)')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setDocuments(data);
    }
    setLoading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // 파일 크기 체크 (50MB)
      if (file.size > 50 * 1024 * 1024) {
        toast.error("파일 크기는 50MB를 초과할 수 없습니다");
        return;
      }

      // 파일 형식 체크
      const validTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword'
      ];

      if (!validTypes.includes(file.type)) {
        toast.error("지원하지 않는 파일 형식입니다. PDF, PPT, DOC 파일만 업로드 가능합니다");
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) return;

    setUploading(true);

    try {
      // 파일을 스토리지에 업로드 (실제로는 스토리지 버킷을 생성해야 함)
      const fileName = `${Date.now()}-${selectedFile.name}`;
      
      // 문서 정보를 데이터베이스에 저장
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile) {
        toast.error("프로필 정보를 찾을 수 없습니다");
        return;
      }

      const { data, error } = await supabase
        .from('documents')
        .insert({
          company_id: profile.company_id,
          title: selectedFile.name,
          file_url: fileName, // 실제로는 스토리지 URL
          file_type: selectedFile.type,
          file_size: selectedFile.size,
          uploaded_by: user.id,
          status: 'processing'
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("문서가 업로드되었습니다. AI가 처리 중입니다...");
      
      // Edge Function 호출하여 AI 처리 (추후 구현)
      // await supabase.functions.invoke('process-document', {
      //   body: { documentId: data.id }
      // });

      setUploadDialogOpen(false);
      setSelectedFile(null);
      fetchDocuments();
    } catch (error: any) {
      toast.error(error.message || "업로드 중 오류가 발생했습니다");
    } finally {
      setUploading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'processing':
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />처리 중</Badge>;
      case 'approved':
        return <Badge variant="default" className="gap-1"><CheckCircle className="h-3 w-3" />승인됨</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="gap-1"><X className="h-3 w-3" />거부됨</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">온보딩 자료 관리</h2>
          <p className="text-muted-foreground">문서를 업로드하고 AI가 자동으로 퀴즈를 생성합니다</p>
        </div>
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Upload className="h-4 w-4" />
              새 자료 업로드
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>온보딩 자료 업로드</DialogTitle>
              <DialogDescription>
                PDF, PPT, DOC 파일을 업로드하면 AI가 자동으로 분석하여 퀴즈를 생성합니다
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="file">파일 선택</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".pdf,.ppt,.pptx,.doc,.docx"
                  onChange={handleFileChange}
                />
                <p className="text-xs text-muted-foreground">
                  지원 형식: PDF, PPT(X), DOC(X) | 최대 50MB
                </p>
              </div>

              {selectedFile && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <FileText className="h-10 w-10 text-primary" />
                      <div className="flex-1">
                        <p className="font-medium">{selectedFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                취소
              </Button>
              <Button onClick={handleUpload} disabled={!selectedFile || uploading}>
                {uploading ? "업로드 중..." : "업로드"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>업로드된 문서</CardTitle>
          <CardDescription>총 {documents.length}개의 문서</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">로딩 중...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">업로드된 문서가 없습니다</p>
              <p className="text-sm text-muted-foreground">문서를 업로드하여 시작하세요</p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc: any) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <FileText className="h-10 w-10 text-primary" />
                    <div>
                      <h3 className="font-semibold">{doc.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(doc.created_at).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(doc.status)}
                    <Button variant="outline" size="sm">
                      상세보기
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </AdminLayout>
  );
};

export default AdminDocuments;
