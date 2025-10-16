import { useMyBlacklistStatus } from "@/hooks/useBlacklist";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Ban, CheckCircle } from "lucide-react";

export const BlacklistDebugInfo = () => {
  const { user } = useAuth();
  const { data: blacklistStatus, isLoading, error } = useMyBlacklistStatus();

  if (!user) return null;

  // 개발 환경에서만 표시
  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <Card className="border-orange-500 bg-orange-50">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-orange-500" />
          블랙리스트 디버그 정보 (개발 모드)
        </CardTitle>
      </CardHeader>
      <CardContent className="text-xs space-y-2">
        <div>
          <strong>사용자 ID:</strong> {user.id}
        </div>
        <div>
          <strong>이메일:</strong> {user.email}
        </div>
        <div>
          <strong>로딩 상태:</strong> {isLoading ? "로딩 중" : "완료"}
        </div>
        {error && (
          <div className="text-red-600">
            <strong>오류:</strong> {error.message}
          </div>
        )}
        <div>
          <strong>블랙리스트 데이터:</strong>
          {blacklistStatus ? (
            <div className="mt-1 space-y-1 bg-white p-2 rounded border">
              <div>ID: {blacklistStatus.id}</div>
              <div>활성 상태: {'is_active' in blacklistStatus ? (blacklistStatus.is_active ? "활성" : "비활성") : "알 수 없음"}</div>
              <div>제한 기간: {'blacklisted_until' in blacklistStatus ? blacklistStatus.blacklisted_until : "알 수 없음"}</div>
              <div>현재 시간: {new Date().toISOString()}</div>
              <div>만료 여부: {'blacklisted_until' in blacklistStatus ? (new Date(blacklistStatus.blacklisted_until) <= new Date() ? "만료됨" : "유효함") : "알 수 없음"}</div>
              <div>사유: {'reason' in blacklistStatus ? blacklistStatus.reason : "알 수 없음"}</div>
            </div>
          ) : (
            <span className="text-gray-500">블랙리스트 데이터 없음</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <strong>최종 상태:</strong>
          {blacklistStatus && 'is_active' in blacklistStatus && 'blacklisted_until' in blacklistStatus && 
           blacklistStatus.is_active && new Date(blacklistStatus.blacklisted_until) > new Date() ? (
            <Badge variant="destructive" className="text-xs">
              <Ban className="h-3 w-3 mr-1" />
              제한됨
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs text-green-600 border-green-500">
              <CheckCircle className="h-3 w-3 mr-1" />
              정상
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};