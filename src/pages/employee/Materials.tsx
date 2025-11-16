import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Search, Download, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import EmployeeLayout from "@/components/employee/EmployeeLayout";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  description: string | null;
  document_count?: number;
}

interface Document {
  id: string;
  title: string;
  file_url: string;
  file_type: string;
  file_size: number;
  created_at: string;
}

const EmployeeMaterials = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchDocuments(selectedCategory);
    }
  }, [selectedCategory]);

  const fetchCategories = async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user?.id)
        .single();

      if (!profile) return;

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('name');

      if (!error && data) {
        setCategories(data);
        if (data.length > 0 && !selectedCategory) {
          setSelectedCategory(data[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async (categoryId: string) => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (!error && data) {
        // Filter documents by category through the categories table
        const { data: categoryDocs } = await supabase
          .from('categories')
          .select('document_id')
          .eq('id', categoryId);

        const docIds = categoryDocs?.map(c => c.document_id).filter(Boolean) || [];
        const filtered = data.filter(d => docIds.includes(d.id));
        setDocuments(filtered);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(doc.file_url);

      if (error) throw error;

      const url = window.URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.title;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("파일 다운로드 완료");
    } catch (error: any) {
      toast.error("다운로드 중 오류가 발생했습니다");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <EmployeeLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">온보딩 자료</h1>
          <p className="text-muted-foreground mt-1">
            카테고리별로 정리된 회사 온보딩 문서를 확인하세요
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-[300px_1fr]">
          {/* Categories Sidebar */}
          <Card>
            <CardHeader>
              <CardTitle>카테고리</CardTitle>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="카테고리 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                {loading ? (
                  <p className="p-4 text-sm text-muted-foreground">로딩 중...</p>
                ) : filteredCategories.length === 0 ? (
                  <p className="p-4 text-sm text-muted-foreground">
                    카테고리가 없습니다
                  </p>
                ) : (
                  <div className="space-y-1 p-2">
                    {filteredCategories.map((category) => (
                      <Button
                        key={category.id}
                        variant={selectedCategory === category.id ? "secondary" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => setSelectedCategory(category.id)}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        <span className="flex-1 text-left">{category.name}</span>
                        <Badge variant="outline" className="ml-2">
                          {category.document_count || 0}
                        </Badge>
                      </Button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Documents Area */}
          <div className="space-y-4">
            {selectedCategory ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {categories.find(c => c.id === selectedCategory)?.name}
                    </CardTitle>
                    <CardDescription>
                      {categories.find(c => c.id === selectedCategory)?.description}
                    </CardDescription>
                  </CardHeader>
                </Card>

                {documents.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-sm text-muted-foreground">
                        이 카테고리에 자료가 없습니다
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {documents.map((doc) => (
                      <Card key={doc.id}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <FileText className="h-5 w-5 text-primary" />
                                <h3 className="font-semibold">{doc.title}</h3>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span>{doc.file_type.split('/')[1]?.toUpperCase()}</span>
                                <span>{formatFileSize(doc.file_size)}</span>
                                <span>
                                  {new Date(doc.created_at).toLocaleDateString('ko-KR')}
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownload(doc)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">
                    좌측에서 카테고리를 선택하세요
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </EmployeeLayout>
  );
};

export default EmployeeMaterials;
