import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Check, X, User, Mail, MapPin, Clock, Loader2, Trash2, Ban, CheckCircle } from "lucide-react";
import { useProgramApplicationsDetail, useUpdateApplicationStatus, useDeleteApplicationAdmin } from "@/hooks/useApplications";
import { useRemoveFromBlacklist, useBlacklistRecords } from "@/hooks/useBlacklist";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface ApplicationsListProps {
  programId: number;
  programTitle: string;
}

const ApplicationsList = ({ programId, programTitle }: ApplicationsListProps) => {
  const queryClient = useQueryClient();
  const { data: applications = [], isLoading } = useProgramApplicationsDetail(programId);
  const updateStatus = useUpdateApplicationStatus();
  const deleteApplication = useDeleteApplicationAdmin();
  const removeFromBlacklist = useRemoveFromBlacklist();
  const { data: blacklistRecords = [] } = useBlacklistRecords();
  const [selectedApplicationId, setSelectedApplicationId] = useState<number | null>(null);
  const [selectedAction, setSelectedAction] = useState<'pending' | 'approved' | 'cancelled' | 'delete' | null>(null);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "pending":
        return "secondary";
      case "approved":
        return "default";
      case "cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "대기중";
      case "approved":
  return "신청완료";
      case "cancelled":
        return "거절됨";
      default:
        return status;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleStatusChange = (applicationId: number, status: 'pending' | 'approved' | 'cancelled' | 'delete') => {
    setSelectedApplicationId(applicationId);
    setSelectedAction(status);
  };

  const confirmStatusChange = () => {
    if (selectedApplicationId && selectedAction) {
      if (selectedAction === 'delete') {
        deleteApplication.mutate(selectedApplicationId);
      } else {
        updateStatus.mutate({ 
          applicationId: selectedApplicationId, 
          status: selectedAction
        });
      }
      setSelectedApplicationId(null);
      setSelectedAction(null);
    }
  };

  // 사용자가 블랙리스트에 있는지 확인하는 함수
  const isUserBlacklisted = (userId: string) => {
    return blacklistRecords.some(record => 
      record.user_id === userId && 
      record.is_active && 
      new Date(record.blacklisted_until) > new Date()
    );
  };

  // 블랙리스트 해제 함수
  const handleRemoveFromBlacklist = async (userId: string, userName: string) => {
    // 해당 사용자의 활성 블랙리스트 레코드 찾기
    const activeBlacklistRecord = blacklistRecords.find(record => 
      record.user_id === userId && 
      record.is_active && 
      new Date(record.blacklisted_until) > new Date()
    );

    if (activeBlacklistRecord) {
      removeFromBlacklist.mutate(activeBlacklistRecord.id, {
        onSuccess: async () => {
          // 즉시 블랙리스트 데이터 새로고침
          await queryClient.invalidateQueries({ queryKey: ["blacklist-records"] });
          await queryClient.refetchQueries({ queryKey: ["blacklist-records"] });
          toast.success(`${userName}님의 블랙리스트가 해제되었습니다. 화면을 새로고침합니다.`);
        }
      });
    } else {
      toast.error("활성 블랙리스트 기록을 찾을 수 없습니다.");
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            신청자 목록
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">신청자 목록을 불러오는 중...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            신청자 목록
            <Badge variant="outline" className="ml-2">
              총 {applications.length}명
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>아직 신청자가 없습니다</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>신청자</TableHead>
                    <TableHead>연락처</TableHead>
                    <TableHead>지역</TableHead>
                    <TableHead>신청일시</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead className="text-right">관리</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((application: any) => (
                    <TableRow key={application.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {application.profiles?.name || '이름 없음'}
                            </span>
                            {isUserBlacklisted(application.user_id) && (
                              <Badge variant="destructive" className="text-xs">
                                <Ban className="h-3 w-3 mr-1" />
                                블랙리스트
                              </Badge>
                            )}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {application.profiles?.nickname && `@${application.profiles.nickname}`}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {application.profiles?.age_group && `${application.profiles.age_group}`}
                            {application.profiles?.gender && ` · ${application.profiles.gender}`}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3" />
                          {application.profiles?.email || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3" />
                          {application.profiles?.region || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="h-3 w-3" />
                          {formatDate(application.created_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(application.status)}>
                          {getStatusText(application.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-2 justify-end">
                          {application.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusChange(application.id, 'approved')}
                                disabled={updateStatus.isPending}
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              >
                                <Check className="h-3 w-3" />
                                승인
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusChange(application.id, 'cancelled')}
                                disabled={updateStatus.isPending}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <X className="h-3 w-3" />
                                거절
                              </Button>
                            </>
                          )}

                          {application.status === 'approved' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusChange(application.id, 'pending')}
                                disabled={updateStatus.isPending}
                              >
                                대기중으로 변경
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusChange(application.id, 'cancelled')}
                                disabled={updateStatus.isPending}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <X className="h-3 w-3" />
                                거절
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusChange(application.id, 'delete')}
                                disabled={deleteApplication.isPending}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-3 w-3" />
                                삭제
                              </Button>
                            </>
                          )}

                          {application.status === 'cancelled' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusChange(application.id, 'pending')}
                                disabled={updateStatus.isPending}
                              >
                                대기중으로 변경
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusChange(application.id, 'delete')}
                                disabled={deleteApplication.isPending}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-3 w-3" />
                                삭제
                              </Button>
                            </>
                          )}

                          {/* 블랙리스트 해제 버튼 - 모든 상태에서 블랙리스트된 사용자에게 표시 */}
                          {isUserBlacklisted(application.user_id) && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  블랙리스트 해제
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>블랙리스트 해제</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    <strong>{application.profiles?.name || "참여자"}</strong>님의 블랙리스트를 해제하시겠습니까?
                                    <br /><br />
                                    해제 후 해당 사용자는 다시 프로그램에 신청할 수 있습니다.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>취소</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleRemoveFromBlacklist(application.user_id, application.profiles?.name || "참여자")}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    블랙리스트 해제
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!selectedApplicationId} onOpenChange={() => {
        setSelectedApplicationId(null);
        setSelectedAction(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>신청 처리 확인</AlertDialogTitle>
            <AlertDialogDescription>
              선택한 신청을 {selectedAction === 'approved' ? '승인' : selectedAction === 'cancelled' ? '거절' : selectedAction === 'pending' ? '대기중으로 변경' : '삭제'}하시겠습니까?
              <br />
              이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmStatusChange}
              className={selectedAction === 'approved'
                ? 'bg-green-600 hover:bg-green-700'
                : selectedAction === 'pending'
                ? ''
                : 'bg-red-600 hover:bg-red-700'
              }
            >
              {selectedAction === 'approved' ? '승인' : selectedAction === 'cancelled' ? '거절' : selectedAction === 'pending' ? '대기중으로 변경' : '삭제'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ApplicationsList;