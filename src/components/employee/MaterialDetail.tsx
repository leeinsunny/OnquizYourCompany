import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import * as pdfjsLib from 'pdfjs-dist';
// Use bundled worker like admin page for reliability
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

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
  const [extractionFailed, setExtractionFailed] = useState(false);

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

      // If OCR text exists and looks formatted (has <highlight> tags), use it directly
      if (data.ocr_text && data.ocr_text.trim().length > 0) {
        if (data.ocr_text.includes('<highlight>')) {
          setHighlightedText(data.ocr_text);
          setHighlighting(false);
        } else {
          await cleanAndHighlightText(data.ocr_text);
        }
      } else {
        await extractFromPdfAndProcess(data);
      }
    } catch (error) {
      console.error('Error fetching document:', error);
      toast.error("문서를 불러오는 중 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  const cleanAndHighlightText = async (ocrText: string) => {
    try {
      setHighlighting(true);
      console.log('Starting clean and format for saved OCR text');

      // Step 1: Clean the text for better readability
      const { data: cleaned, error: cleanError } = await supabase.functions.invoke('clean-ocr-text', {
        body: { text: ocrText }
      });
      const cleanedText = cleaned?.cleanedText || ocrText;
      if (cleanError) console.warn('clean-ocr-text error:', cleanError);

      // Step 2: Format into structured onboarding doc with inline highlights
      const { data: formatted, error: formatError } = await supabase.functions.invoke('format-ocr-text', {
        body: { text: cleanedText }
      });

      if (!formatError && formatted?.formattedText) {
        setHighlightedText(formatted.formattedText);
        return;
      }

      // Fallback: simple highlight if formatting fails
      if (formatError) console.warn('format-ocr-text error, falling back to highlight-text:', formatError);
      const { data: highlighted, error: highlightError } = await supabase.functions.invoke('highlight-text', {
        body: { text: cleanedText }
      });
      if (highlightError) throw highlightError;
      setHighlightedText(highlighted.highlightedText || cleanedText);
    } catch (error) {
      console.error('Error in clean/format/highlight:', error);
      setHighlightedText(ocrText);
    } finally {
      setHighlighting(false);
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

  const extractFromPdfAndProcess = async (doc: Document) => {
    try {
      setExtractionFailed(false);
      setHighlighting(true);
      
      console.log('Starting PDF extraction for:', doc.file_url);
      
      // 1) Download original PDF from storage
      const { data: fileData, error: dlError } = await supabase.storage
        .from('documents')
        .download(doc.file_url);
      
      if (dlError || !fileData) {
        console.error('PDF download error:', dlError);
        throw dlError || new Error('PDF 다운로드 실패');
      }

      const arrayBuffer = await fileData.arrayBuffer();
      console.log('PDF downloaded, size:', arrayBuffer.byteLength);

      // 2) Extract raw text with pdfjs (same approach as admin)
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = (textContent.items as any[])
          .map((it: any) => (it.str ? it.str : ''))
          .join(' ');
        fullText += pageText + '\n\n';
      }

      const rawText = fullText.trim();
      console.log('Extracted text length:', rawText.length);
      
      if (!rawText) throw new Error('PDF에서 텍스트를 찾지 못했습니다');

      // 3) Clean OCR noise
      const { data: cleaned, error: cleanError } = await supabase.functions.invoke('clean-ocr-text', {
        body: { text: rawText }
      });
      const cleanedText: string = cleaned?.cleanedText || rawText;
      if (cleanError) console.warn('clean-ocr-text error, using raw text:', cleanError);

      // 4) Format into structured onboarding doc with inline highlights
      const { data: formatted, error: formatError } = await supabase.functions.invoke('format-ocr-text', {
        body: { text: cleanedText }
      });

      if (!formatError && formatted?.formattedText) {
        setHighlightedText(formatted.formattedText);
      } else {
        if (formatError) console.warn('format-ocr-text error, falling back to highlight-text:', formatError);
        await highlightImportantText(cleanedText);
      }
    } catch (e) {
      console.error('PDF 텍스트 추출 실패:', e);
      setExtractionFailed(true);
      toast.error('텍스트를 자동으로 준비하지 못했습니다. 원본을 확인할 수 있어요.');
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

    // Split text into paragraphs and process each one
    const paragraphs = highlightedText.split(/\n\n+/);
    
    return (
      <div className="space-y-4">
        {paragraphs.map((paragraph, pIndex) => {
          if (!paragraph.trim()) return null;
          
          // Replace <highlight> tags with styled spans
          const parts = paragraph.split(/(<highlight>|<\/highlight>)/);
          let isHighlighted = false;
          
          return (
            <p key={pIndex} className="leading-relaxed text-foreground">
              {parts.map((part, index) => {
                if (part === '<highlight>') {
                  isHighlighted = true;
                  return null;
                }
                if (part === '</highlight>') {
                  isHighlighted = false;
                  return null;
                }
                if (!part.trim()) return null;
                
                return (
                  <span
                    key={index}
                    className={
                      isHighlighted 
                        ? 'bg-yellow-200 dark:bg-yellow-900/50 px-1.5 py-0.5 rounded font-medium transition-colors' 
                        : ''
                    }
                  >
                    {part}
                  </span>
                );
              })}
            </p>
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
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          목록으로
        </Button>
      </div>

      <Card className="border-primary/20">
        <CardHeader className="space-y-1 pb-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">온보딩 자료</p>
              <CardTitle className="text-2xl">{document.title}</CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              원본 다운로드
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {highlighting ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center space-y-3">
                <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
                <p className="text-base font-medium">학습 자료를 준비하고 있습니다</p>
                <p className="text-sm text-muted-foreground">중요한 내용을 분석 중입니다...</p>
              </div>
            </div>
          ) : highlightedText ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground pb-2 border-b">
                <span className="inline-block w-4 h-4 bg-yellow-200 dark:bg-yellow-900/40 rounded"></span>
                <span>노란색으로 표시된 부분이 핵심 내용입니다</span>
              </div>
              <div className="prose prose-sm max-w-none dark:prose-invert leading-relaxed text-base">
                {renderHighlightedContent()}
              </div>
            </div>
          ) : (
            <div className="text-center py-16 space-y-4">
              <div className="text-muted-foreground">
                <p className="text-base font-medium">텍스트 추출이 완료되지 않았습니다</p>
                <p className="text-sm mt-2">원본 PDF를 다운로드하여 확인하세요</p>
              </div>
              <Button variant="outline" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                PDF 다운로드
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MaterialDetail;
