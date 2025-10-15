import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useCreateProgram, useUpdateProgram, Program } from "@/hooks/usePrograms";
import { supabase } from "@/integrations/supabase/client";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface ProgramFormProps {
  program?: Program | null;
  onCancel: () => void;
  onSuccess: () => void;
}

const ProgramForm = ({ program, onCancel, onSuccess }: ProgramFormProps) => {
  const createProgram = useCreateProgram();
  const updateProgram = useUpdateProgram();

  const [formData, setFormData] = useState({
    title: "",
    category: "",
    region: "",
    startDate: "",
    endDate: "",
    capacity: "",
    imageUrl: "",
    description: ""
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>("");

  const categories = [
    "IT/프로그래밍",
    "생활체험", 
    "환경",
    "문화",
    "예술",
    "체육",
    "학습",
    "기타"
  ];

  const regions = [
    "중구", "동구", "미추홀구", "연수구", 
    "남동구", "부평구", "계양구", "서구", 
    "강화군", "옹진군"
  ];

  // datetime-local input에 맞는 로컬 ISO 문자열로 변환
  function toLocalDatetimeString(isoString: string | undefined) {
    if (!isoString) return "";
    const date = new Date(isoString);
    const pad = (n: number) => n.toString().padStart(2, "0");
    return (
      date.getFullYear() +
      "-" + pad(date.getMonth() + 1) +
      "-" + pad(date.getDate()) +
      "T" + pad(date.getHours()) +
      ":" + pad(date.getMinutes())
    );
  }

  useEffect(() => {
    if (program) {
      setFormData({
        title: program.title,
        category: program.category || "",
        region: program.region || "",
        startDate: program.start_at ? toLocalDatetimeString(program.start_at) : "",
        endDate: program.end_at ? toLocalDatetimeString(program.end_at) : "",
        capacity: program.capacity?.toString() || "",
        imageUrl: program.image_url || "",
        description: program.description || ""
      });
    }
  }, [program]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "프로그램 제목은 필수입니다";
    }

    if (!formData.category) {
      newErrors.category = "카테고리를 선택해주세요";
    }

    if (!formData.region) {
      newErrors.region = "지역을 선택해주세요";
    }

    if (!formData.startDate) {
      newErrors.startDate = "시작일시를 선택해주세요";
    }

    if (!formData.endDate) {
      newErrors.endDate = "종료일시를 선택해주세요";
    }

    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      newErrors.endDate = "종료일시는 시작일시 이후여야 합니다";
    }

    if (!formData.capacity || parseInt(formData.capacity) <= 0) {
      newErrors.capacity = "유효한 정원을 입력해주세요";
    }

    if (!formData.description.trim()) {
      newErrors.description = "프로그램 설명은 필수입니다";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 이미지 리사이징 함수
  const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        const { width, height } = img;
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        
        canvas.width = width * ratio;
        canvas.height = height * ratio;
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((blob) => {
          resolve(new File([blob!], file.name, { type: file.type }));
        }, file.type, 0.8);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  // 이미지 업로드 함수
  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `program_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      // 이미지 리사이징 (800x600 최대 크기)
      const resizedFile = await resizeImage(file, 800, 600);
      
      const { data, error } = await supabase.storage
        .from('program-images')
        .upload(fileName, resizedFile);
      
      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage
        .from('program-images')
        .getPublicUrl(data.path);
      
      toast.success('이미지가 성공적으로 업로드되었습니다.');
      return publicUrl;
    } catch (error) {
      console.error('이미지 업로드 실패:', error);
      toast.error('이미지 업로드에 실패했습니다.');
      return null;
    } finally {
      setUploading(false);
    }
  };

  // 이미지 업로드 핸들러
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // 파일 크기 체크 (5MB 제한)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('파일 크기는 5MB 이하여야 합니다.');
      return;
    }
    
    // 파일 형식 체크
    if (!file.type.startsWith('image/')) {
      toast.error('이미지 파일만 업로드 가능합니다.');
      return;
    }
    
    // 미리보기
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
    
    // 업로드
    const imageUrl = await uploadImage(file);
    if (imageUrl) {
      setFormData({ ...formData, imageUrl });
    }
  };

  // 이미지 제거 함수
  const removeImage = () => {
    setFormData({ ...formData, imageUrl: "" });
    setImagePreview("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // 입력값을 UTC(ISO)로 변환
    const toISO = (val: string) => val ? new Date(val).toISOString() : undefined;

    const programData = {
      title: formData.title.trim(),
      category: formData.category || undefined,
      region: formData.region || undefined,
      start_at: toISO(formData.startDate),
      end_at: toISO(formData.endDate),
      capacity: parseInt(formData.capacity) || undefined,
      image_url: formData.imageUrl.trim() || null,
      description: formData.description.trim() || undefined,
    };

    if (program) {
      updateProgram.mutate({ id: program.id, ...programData }, {
        onSuccess: () => {
          onSuccess();
        }
      });
    } else {
      createProgram.mutate(programData, {
        onSuccess: () => {
          onSuccess();
        }
      });
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">프로그램 제목 *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="프로그램 제목을 입력하세요"
              className={errors.title ? "border-destructive" : ""}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title}</p>
            )}
          </div>

          {/* Category and Region */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">카테고리 *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger className={errors.category ? "border-destructive" : ""}>
                  <SelectValue placeholder="카테고리 선택" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-sm text-destructive">{errors.category}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="region">지역 *</Label>
              <Select
                value={formData.region}
                onValueChange={(value) => setFormData({ ...formData, region: value })}
              >
                <SelectTrigger className={errors.region ? "border-destructive" : ""}>
                  <SelectValue placeholder="지역 선택" />
                </SelectTrigger>
                <SelectContent>
                  {regions.map((region) => (
                    <SelectItem key={region} value={region}>
                      {region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.region && (
                <p className="text-sm text-destructive">{errors.region}</p>
              )}
            </div>
          </div>

          {/* Dates and Times */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">시작일시 *</Label>
              <Input
                id="startDate"
                type="datetime-local"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className={errors.startDate ? "border-destructive" : ""}
              />
              {errors.startDate && (
                <p className="text-sm text-destructive">{errors.startDate}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">종료일시 *</Label>
              <Input
                id="endDate"
                type="datetime-local"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className={errors.endDate ? "border-destructive" : ""}
              />
              {errors.endDate && (
                <p className="text-sm text-destructive">{errors.endDate}</p>
              )}
            </div>
          </div>

          {/* Capacity */}
          <div className="space-y-2">
            <Label htmlFor="capacity">정원 *</Label>
            <Input
              id="capacity"
              type="number"
              min="1"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              placeholder="정원 수"
              className={errors.capacity ? "border-destructive" : ""}
            />
            {errors.capacity && (
              <p className="text-sm text-destructive">{errors.capacity}</p>
            )}
          </div>

          {/* 프로그램 이미지 업로드 */}
          <div className="space-y-2">
            <Label htmlFor="image">프로그램 이미지</Label>
            
            {/* 업로드 영역 */}
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
              {formData.imageUrl || imagePreview ? (
                // 이미지 미리보기
                <div className="relative inline-block">
                  <img 
                    src={imagePreview || formData.imageUrl} 
                    alt="미리보기" 
                    className="max-w-full max-h-48 rounded-lg object-cover"
                  />
                  <Button 
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2"
                    onClick={removeImage}
                    disabled={uploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                // 업로드 버튼
                <div>
                  <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    이미지를 클릭하여 업로드하세요
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    JPG, PNG, GIF 형식 • 최대 5MB • 권장 크기: 800x600
                  </p>
                </div>
              )}
              
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="imageUpload"
                disabled={uploading}
              />
              
              <Button 
                type="button" 
                variant="outline" 
                asChild
                disabled={uploading}
                className="mt-4"
              >
                <label htmlFor="imageUpload" className="cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? "업로드 중..." : formData.imageUrl ? "이미지 변경" : "이미지 선택"}
                </label>
              </Button>
            </div>
            
            {/* 직접 URL 입력 (옵션) */}
            <div className="mt-4">
              <Label htmlFor="imageUrl" className="text-sm text-muted-foreground">
                또는 이미지 URL 직접 입력
              </Label>
              <Input
                id="imageUrl"
                type="url"
                value={formData.imageUrl}
                onChange={(e) => {
                  setFormData({ ...formData, imageUrl: e.target.value });
                  setImagePreview(""); // URL 입력시 미리보기 초기화
                }}
                placeholder="https://example.com/image.jpg"
                className="mt-1"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">프로그램 설명 *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="프로그램에 대한 자세한 설명을 입력하세요"
              rows={4}
              className={errors.description ? "border-destructive" : ""}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              취소
            </Button>
            <Button 
              type="submit" 
              disabled={createProgram.isPending || updateProgram.isPending}
            >
              {createProgram.isPending || updateProgram.isPending ? "저장 중..." : program ? "수정" : "추가"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ProgramForm;