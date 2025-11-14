import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, FileText, Clock, CheckCircle, AlertCircle, X, Eye, Trash2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import AdminLayout from "@/components/admin/AdminLayout";
import * as pdfjsLib from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Configure PDF.js worker - local bundle
pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

interface Document {
  id: string;
  title: string;
  file_url: string;
  file_type: string;
  file_size: number;
  status: string;
  created_at: string;
  uploaded_by: string;
}

const AdminDocuments = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [generatingQuiz, setGeneratingQuiz] = useState<string | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user?.id)
        .maybeSingle();

      if (!profile) return;

      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setDocuments(data);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    if (file.size > 50 * 1024 * 1024) {
      toast.error("파일 크기는 50MB를 초과할 수 없습니다");
      return;
    }

    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'image/jpeg',
      'image/png'
    ];

    if (!validTypes.includes(file.type)) {
      toast.error("지원하지 않는 파일 형식입니다. PDF, PPT, DOC, XLS, JPG, PNG 파일만 업로드 가능합니다");
      return;
    }

    setSelectedFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) return;

    setUploading(true);
    setUploadProgress(10);

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile) {
        toast.error("프로필 정보를 찾을 수 없습니다");
        return;
      }

      setUploadProgress(30);

      const safeBase = selectedFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const fileName = `${profile.company_id}/${Date.now()}-${safeBase}`;
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, selectedFile, { cacheControl: '3600', upsert: false, contentType: selectedFile.type });

      if (uploadError) throw uploadError;

      setUploadProgress(60);

      const { error: dbError } = await supabase
        .from('documents')
        .insert({
          company_id: profile.company_id,
          title: selectedFile.name,
          file_url: fileName,
          file_type: selectedFile.type,
          file_size: selectedFile.size,
          uploaded_by: user.id,
          status: 'approved'
        });

      if (dbError) throw dbError;

      setUploadProgress(100);
      
      toast.success("문서가 업로드되었습니다");
      
      setUploadDialogOpen(false);
      setSelectedFile(null);
      setUploadProgress(0);
      fetchDocuments();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || "업로드 중 오류가 발생했습니다");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (doc: Document) => {
    if (!confirm(`"${doc.title}" 문서를 삭제하시겠습니까?`)) return;

    try {
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([doc.file_url]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', doc.id);

      if (dbError) throw dbError;

      toast.success("문서가 삭제되었습니다");
      fetchDocuments();
    } catch (error: any) {
      toast.error(error.message || "삭제 중 오류가 발생했습니다");
    }
  };

  const convertPdfToImages = async (file: File): Promise<string[]> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const images: string[] = [];

    // Convert first 10 pages max
    const pageCount = Math.min(pdf.numPages, 10);
    
    for (let i = 1; i <= pageCount; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2.0 });
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      if (context) {
        await page.render({ 
          canvasContext: context, 
          viewport,
          canvas 
        }).promise;
        images.push(canvas.toDataURL('image/png'));
      }
    }

    return images;
  };

  const handleGenerateQuiz = async (doc: Document) => {
    if (!user) return;

    setGeneratingQuiz(doc.id);
    toast.info("PDF를 처리하고 있습니다...");

    try {
      // Set document status to processing
      await supabase
        .from('documents')
        .update({ status: 'processing' })
        .eq('id', doc.id);
      fetchDocuments();

      // Download the file from storage
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('documents')
        .download(doc.file_url);

      if (downloadError) throw downloadError;

      // Convert PDF to images if it's a PDF
      let images: string[] = [];
      if (doc.file_type === 'application/pdf') {
        const file = new File([fileData], doc.title, { type: doc.file_type });
        images = await convertPdfToImages(file);
        toast.info(`${images.length}개 페이지를 처리 중입니다...`);
      } else {
        // For images, convert to base64
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(fileData);
        });
        images = [base64];
      }

      // Call edge function
      const { data, error } = await supabase.functions.invoke('generate-quiz', {
        body: { documentId: doc.id, images }
      });

      if (error) throw error;

      toast.success("퀴즈가 생성되었습니다!");
      
      // Update document status
      await supabase
        .from('documents')
        .update({ status: 'approved' })
        .eq('id', doc.id);

      fetchDocuments();
    } catch (error: any) {
      console.error('Quiz generation error:', error);
      toast.error(error.message || "퀴즈 생성 중 오류가 발생했습니다");
      // Mark as failed
      await supabase
        .from('documents')
        .update({ status: 'failed' })
        .eq('id', doc.id);
      fetchDocuments();
    } finally {
      setGeneratingQuiz(null);
    }
  };

  const handleViewDocument = (doc: Document) => {
    setSelectedDoc(doc);
    setViewDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'processing':
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            처리 중
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="default" className="gap-1">
            <CheckCircle className="h-3 w-3" />
            완료
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            실패
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
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
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">온보딩 자료 관리</h1>
            <p className="text-muted-foreground mt-1">
              회사 온보딩 문서를 업로드하고 AI가 자동으로 퀴즈를 생성합니다
            </p>
          </div>
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2">
                <Upload className="h-4 w-4" />
                자료 업로드
              </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>온보딩 자료 업로드</DialogTitle>
                <DialogDescription>
                  지원 형식: PDF, PPT(X), DOC(X), XLS(X), JPG, PNG | 최대 50MB
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    isDragging
                      ? 'border-primary bg-primary/5'
                      : 'border-muted-foreground/25 hover:border-primary/50'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm font-medium mb-2">
                    파일을 드래그하거나 클릭하여 업로드
                  </p>
                  <Label htmlFor="file-upload" className="cursor-pointer">
                    <Button variant="secondary" type="button" asChild>
                      <span>파일 선택</span>
                    </Button>
                  </Label>
                  <Input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                  />
                </div>

                {selectedFile && (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="h-8 w-8 text-primary" />
                          <div>
                            <p className="font-medium">{selectedFile.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatFileSize(selectedFile.size)}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedFile(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {uploading && (
                  <div className="space-y-2">
                    <Progress value={uploadProgress} />
                    <p className="text-sm text-center text-muted-foreground">
                      업로드 중... {uploadProgress}%
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setUploadDialogOpen(false);
                    setSelectedFile(null);
                  }}
                  disabled={uploading}
                >
                  취소
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || uploading}
                >
                  {uploading ? '업로드 중...' : '업로드'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">문서 목록을 불러오는 중...</p>
          </div>
        ) : documents.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">업로드된 문서가 없습니다</p>
              <p className="text-sm text-muted-foreground mb-4">
                첫 온보딩 자료를 업로드하여 시작하세요
              </p>
              <Button onClick={() => setUploadDialogOpen(true)}>
                <Upload className="mr-2 h-4 w-4" />
                자료 업로드
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>문서명</TableHead>
                  <TableHead>형식</TableHead>
                  <TableHead>크기</TableHead>
                  <TableHead>업로드 일시</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead className="text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">{doc.title}</TableCell>
                    <TableCell>{doc.file_type.split('/')[1]?.toUpperCase() || 'Unknown'}</TableCell>
                    <TableCell>{formatFileSize(doc.file_size)}</TableCell>
                    <TableCell>{formatDate(doc.created_at)}</TableCell>
                    <TableCell>{getStatusBadge(doc.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDocument(doc)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          상세
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleGenerateQuiz(doc)}
                          disabled={generatingQuiz === doc.id}
                        >
                          <Sparkles className="h-3 w-3 mr-1" />
                          {generatingQuiz === doc.id ? '생성중...' : '퀴즈생성'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(doc)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}

        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>문서 상세 정보</DialogTitle>
            </DialogHeader>
            {selectedDoc && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">문서명</p>
                    <p className="font-medium">{selectedDoc.title}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">형식</p>
                    <p className="font-medium">{selectedDoc.file_type.split('/')[1]?.toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">파일 크기</p>
                    <p className="font-medium">{formatFileSize(selectedDoc.file_size)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">상태</p>
                    <div className="mt-1">{getStatusBadge(selectedDoc.status)}</div>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">업로드 일시</p>
                    <p className="font-medium">{formatDate(selectedDoc.created_at)}</p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminDocuments;
