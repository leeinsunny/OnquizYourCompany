import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MaterialDetailProps {
  documentId: string;
  onBack: () => void;
}

interface Document {
  id: string;
  title: string;
  file_url: string;
  file_type: string;
  ocr_text: string | null;
}

const MaterialDetail = ({ documentId, onBack }: MaterialDetailProps) => {
  const [document, setDocument] = useState<Document | null>(null);
  const [highlightedText, setHighlightedText] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [highlighting, setHighlighting] = useState(false);

  useEffect(() => {
    fetchDocument();
  }, [documentId]);

  const fetchDocument = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (error) throw error;
      setDocument(data);

      // If OCR text exists, highlight it; otherwise attempt on-demand extraction from PDF
      if (data.ocr_text && data.ocr_text.trim().length > 0) {
        await highlightImportantText(data.ocr_text);
      } else {
        await extractFromPdfAndProcess();
      }
    } catch (error) {
      console.error('Error fetching document:', error);
      toast.error("문서를 불러오는 중 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  const highlightImportantText = async (text: string) => {
    try {
      setHighlighting(true);
      const { data, error } = await supabase.functions.invoke('highlight-text', {
        body: { text }
      });

      if (error) throw error;
      setHighlightedText(data.highlightedText || text);
    } catch (error) {
      console.error('Error highlighting text:', error);
      setHighlightedText(text);
    } finally {
      setHighlighting(false);
    }
  };

  const extractFromPdfAndProcess = async () => {
    if (!document) return;
    try {
      setHighlighting(true);
      // 1) Download original PDF from storage
      const { data: fileData, error: dlError } = await supabase.storage
        .from('documents')
        .download(document.file_url);
      if (dlError || !fileData) throw dlError || new Error('PDF 다운로드 실패');

      const arrayBuffer = await fileData.arrayBuffer();

      // 2) Extract raw text with pdfjs-dist (ESM build)
      const pdfjs: any = await import('pdfjs-dist/build/pdf.mjs');
      // Use official worker hosted via unpkg to avoid bundler worker issues
      // @ts-ignore
      pdfjs.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@5.4.394/build/pdf.worker.mjs';

      const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((it: any) => (it.str ? it.str : '')).join(' ');
        fullText += pageText + '\n\n';
      }

      const rawText = fullText.trim();
      if (!rawText) throw new Error('PDF에서 텍스트를 찾지 못했습니다');

      // 3) Clean OCR noise
      const { data: cleaned, error: cleanError } = await supabase.functions.invoke('clean-ocr-text', {
        body: { text: rawText }
      });
      const cleanedText: string = cleaned?.cleanedText || rawText;
      if (cleanError) console.warn('clean-ocr-text error, using raw text');

      // 4) Highlight important parts
      await highlightImportantText(cleanedText);
    } catch (e) {
      console.error('PDF 텍스트 추출 실패:', e);
      toast.message('PDF에서 텍스트를 추출하지 못했습니다. 원본 PDF를 확인하세요.');
    } finally {
      setHighlighting(false);
    }
  };

  const handleDownload = async () => {
    if (!document) return;

    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(document.file_url);

      if (error) throw error;

      const url = window.URL.createObjectURL(data);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.title;
      window.document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      window.document.body.removeChild(a);

      toast.success("파일 다운로드 완료");
    } catch (error: any) {
      toast.error("다운로드 중 오류가 발생했습니다");
    }
  };

  const renderHighlightedContent = () => {
    if (!highlightedText) return null;

    // Replace <highlight> tags with styled spans
    const parts = highlightedText.split(/(<highlight>|<\/highlight>)/);
    let isHighlighted = false;
    
    return (
      <div className="whitespace-pre-wrap leading-relaxed">
        {parts.map((part, index) => {
          if (part === '<highlight>') {
            isHighlighted = true;
            return null;
          }
          if (part === '</highlight>') {
            isHighlighted = false;
            return null;
          }
          return (
            <span
              key={index}
              className={isHighlighted ? 'bg-yellow-200 dark:bg-yellow-900/40 px-1 font-medium' : ''}
            >
              {part}
            </span>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!document) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">문서를 찾을 수 없습니다</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          목록으로
        </Button>
        <Button variant="outline" size="sm" onClick={handleDownload}>
          <Download className="h-4 w-4 mr-2" />
          PDF 다운로드
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{document.title}</CardTitle>
        </CardHeader>
        <CardContent>
          {highlighting ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                <p className="text-sm text-muted-foreground">중요한 부분을 분석하고 있습니다...</p>
              </div>
            </div>
          ) : document.ocr_text ? (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              {renderHighlightedContent()}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>이 문서는 텍스트 추출이 완료되지 않았습니다.</p>
              <p className="text-sm mt-2">PDF를 다운로드하여 확인하세요.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MaterialDetail;
