import { useEffect, useRef, useState } from "react";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (imageUrl: string) => void; // Base64 대신 이미지 URL 전달
  studentName: string;
  signatureType?: 'parent' | 'student'; // 서명 타입 추가
}

export const SignatureModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  studentName, 
  signatureType = 'student' 
}: SignatureModalProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<any>(null); // fabric.Canvas
  const [hasSignature, setHasSignature] = useState(false);
  const [uploading, setUploading] = useState(false);

  // 모달 열릴 때만 Fabric 캔버스 생성
  useEffect(() => {
    if (!isOpen) return;

    let disposed = false;

    // ESC 키 이벤트 핸들러
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !uploading) {
        event.preventDefault();
        handleClose();
      }
    };

    // ESC 키 이벤트 리스너 추가
    document.addEventListener('keydown', handleKeyDown);

    (async () => {
      try {
        const fabric = await import("fabric");
        const { Canvas, PencilBrush } = fabric as any;

        const el = canvasRef.current;
        if (!el) return;

        // 기존 인스턴스 정리
        if (fabricRef.current) {
          fabricRef.current.dispose();
          fabricRef.current = null;
        }

        const canvas = new Canvas(el, {
          backgroundColor: "#ffffff",
          isDrawingMode: true,
          width: 400,
          height: 200,
        });

        // 브러시 설정
        const brush = new PencilBrush(canvas);
        brush.color = "#000000";
        brush.width = 3;
        canvas.freeDrawingBrush = brush;

        // 서명 감지
        canvas.on("path:created", () => setHasSignature(true));

        // 디버깅(필요시)
        // canvas.on("mouse:down", () => console.log("down"));
        // canvas.on("mouse:move", () => console.log("move"));

        if (!disposed) fabricRef.current = canvas;
      } catch (e) {
        console.error(e);
        toast.error("캔버스 초기화에 실패했습니다.");
      }
    })();

    return () => {
      disposed = true;
      // ESC 키 이벤트 리스너 제거
      document.removeEventListener('keydown', handleKeyDown);
      
      if (fabricRef.current) {
        fabricRef.current.dispose();
        fabricRef.current = null;
      }
      setHasSignature(false);
    };
  }, [isOpen]);

  const handleClear = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    
    try {
      canvas.clear();
      canvas.setBackgroundColor("#ffffff", () => canvas.renderAll());
      setHasSignature(false);
      // 드로잉모드 유지
      canvas.isDrawingMode = true;
    } catch (error) {
      console.error("캔버스 클리어 중 오류:", error);
    }
  };

  // 서명을 이미지 파일로 업로드하는 함수
  const uploadSignatureImage = async (canvas: any): Promise<string | null> => {
    try {
      setUploading(true);
      
      // Canvas를 Blob으로 변환
      const dataUrl = canvas.toDataURL({ format: "png", quality: 0.9 });
      const base64Data = dataUrl.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/png' });
      
      // 파일명 생성 (서명타입_타임스탬프_랜덤ID)
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(7);
      const fileName = `signature_${signatureType}_${timestamp}_${randomId}.png`;
      
      // Supabase Storage에 업로드
      const { data, error } = await supabase.storage
        .from('signatures')
        .upload(fileName, blob, {
          contentType: 'image/png',
          upsert: false
        });
      
      if (error) {
        console.error('서명 업로드 실패:', error);
        throw error;
      }
      
      // 공개 URL 생성
      const { data: { publicUrl } } = supabase.storage
        .from('signatures')
        .getPublicUrl(data.path);
      
      toast.success('서명이 성공적으로 저장되었습니다.');
      return publicUrl;
      
    } catch (error) {
      console.error('서명 이미지 업로드 중 오류:', error);
      toast.error('서명 저장에 실패했습니다.');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleConfirm = async () => {
    const canvas = fabricRef.current;
    if (!canvas || !hasSignature) {
      toast.error("서명을 작성해주세요.");
      return;
    }

    // 서명을 이미지로 업로드
    const imageUrl = await uploadSignatureImage(canvas);
    
    if (imageUrl) {
      onConfirm(imageUrl); // 이미지 URL 전달
      handleClose();
    }
  };

  const handleClose = () => {
    // 업로드 중이면 취소할 수 없음
    if (uploading) {
      toast.warning("서명 저장 중입니다. 잠시만 기다려주세요.");
      return;
    }
    
    // 캔버스가 존재할 때만 클리어 시도
    if (fabricRef.current && hasSignature) {
      handleClear();
    }
    
    // 서명 상태 초기화
    setHasSignature(false);
    
    // 모달 닫기
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => { 
        // 모달이 닫힐 때 (X버튼 클릭 등)
        if (!open && !uploading) {
          handleClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>동의서 서명</DialogTitle>
          <DialogDescription>
            <strong>{studentName}</strong>님, 아래 영역에 서명해 주세요.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-4">
          <div className="border-2 border-gray-300 rounded-lg shadow-sm bg-white pointer-events-auto">
            <canvas
              ref={canvasRef}
              width={400}
              height={200}
              className="block"
              style={{ cursor: "crosshair", touchAction: "none" }}
            />
          </div>
          <div className="text-sm text-muted-foreground">
            마우스를 드래그(모바일: 손가락)하여 서명해 주세요
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={handleClear} 
            disabled={!hasSignature || uploading}
          >
            다시 쓰기
          </Button>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              onClick={handleClose}
              disabled={uploading}
            >
              취소
            </Button>
            <Button 
              onClick={handleConfirm} 
              disabled={!hasSignature || uploading}
            >
              {uploading ? "저장 중..." : "서명 확인"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};