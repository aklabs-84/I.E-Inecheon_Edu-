import { useState } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Ban, UserX, Mail, Calendar, AlertTriangle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBlacklistRecords, useRemoveFromBlacklist, BlacklistRecord } from "@/hooks/useBlacklist";

export const BlacklistManagement = () => {
  const { data: blacklistRecords = [], isLoading } = useBlacklistRecords();
  const removeFromBlacklist = useRemoveFromBlacklist();

  // 활성/비활성 블랙리스트 분리
  const activeBlacklist = blacklistRecords.filter((record: BlacklistRecord) => 
    record.is_active && new Date(record.blacklisted_until) > new Date()
  );
  
  const expiredBlacklist = blacklistRecords.filter((record: BlacklistRecord) => 
    record.is_active && new Date(record.blacklisted_until) <= new Date()
  );
  
  const inactiveBlacklist = blacklistRecords.filter((record: BlacklistRecord) => !record.is_active);

  const handleRemoveFromBlacklist = (recordId: number) => {
    removeFromBlacklist.mutate(recordId);
  };

  const getStatusBadge = (record: BlacklistRecord) => {
    if (!record.is_active) {
      return <Badge className="bg-gray-100 text-gray-800">해제됨</Badge>;
    }
    
    const isExpired = new Date(record.blacklisted_until) <= new Date();
    if (isExpired) {
      return <Badge className="bg-orange-100 text-orange-800">기간 만료</Badge>;
    }
    
    return <Badge variant="destructive">활성</Badge>;
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "yyyy.MM.dd (EEE)", { locale: ko });
  };

  const BlacklistTable = ({ records, showActions = true }: { records: BlacklistRecord[], showActions?: boolean }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">번호</TableHead>
          <TableHead>이름</TableHead>
          <TableHead>이메일</TableHead>
          <TableHead>프로그램</TableHead>
          <TableHead>사유</TableHead>
          <TableHead>처리일</TableHead>
          <TableHead>해제일</TableHead>
          <TableHead>처리자</TableHead>
          <TableHead>상태</TableHead>
          {showActions && <TableHead className="w-24">액션</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {records.map((record, index) => (
          <TableRow key={record.id}>
            <TableCell className="font-medium">{index + 1}</TableCell>
            <TableCell>{record.profiles?.name || "알 수 없음"}</TableCell>
            <TableCell>{record.profiles?.email || "-"}</TableCell>
            <TableCell>{record.programs?.title || "전체 프로그램"}</TableCell>
            <TableCell className="max-w-xs truncate">{record.reason}</TableCell>
            <TableCell>{formatDate(record.blacklisted_at)}</TableCell>
            <TableCell>{formatDate(record.blacklisted_until)}</TableCell>
            <TableCell>{record.blacklisted_by_profile?.name || "시스템"}</TableCell>
            <TableCell>{getStatusBadge(record)}</TableCell>
            {showActions && (
              <TableCell>
                {record.is_active && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="outline" className="text-green-600 hover:bg-green-50">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        해제
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>블랙리스트 해제</AlertDialogTitle>
                        <AlertDialogDescription>
                          <strong>{record.profiles?.name}</strong>님의 블랙리스트를 해제하시겠습니까?
                          <br /><br />
                          해제 후 해당 사용자는 즉시 프로그램 신청이 가능합니다.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>취소</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleRemoveFromBlacklist(record.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          해제하기
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ban className="h-5 w-5" />
            블랙리스트 관리
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-foreground">로딩 중...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ban className="h-5 w-5" />
            블랙리스트 관리
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* 통계 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">활성 블랙리스트</p>
                    <p className="text-2xl font-bold text-red-600">{activeBlacklist.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-orange-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">기간 만료</p>
                    <p className="text-2xl font-bold text-orange-600">{expiredBlacklist.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">수동 해제</p>
                    <p className="text-2xl font-bold text-green-600">{inactiveBlacklist.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <UserX className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">전체 기록</p>
                    <p className="text-2xl font-bold text-gray-600">{blacklistRecords.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 탭으로 분리된 블랙리스트 목록 */}
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="active" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                활성 블랙리스트 ({activeBlacklist.length})
              </TabsTrigger>
              <TabsTrigger value="expired" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                기간 만료 ({expiredBlacklist.length})
              </TabsTrigger>
              <TabsTrigger value="inactive" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                해제된 기록 ({inactiveBlacklist.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="active" className="mt-4">
              {activeBlacklist.length > 0 ? (
                <div className="border rounded-lg">
                  <BlacklistTable records={activeBlacklist} showActions={true} />
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  활성 블랙리스트가 없습니다.
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="expired" className="mt-4">
              {expiredBlacklist.length > 0 ? (
                <div className="border rounded-lg">
                  <BlacklistTable records={expiredBlacklist} showActions={true} />
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  기간 만료된 블랙리스트가 없습니다.
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="inactive" className="mt-4">
              {inactiveBlacklist.length > 0 ? (
                <div className="border rounded-lg">
                  <BlacklistTable records={inactiveBlacklist} showActions={false} />
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  수동 해제된 기록이 없습니다.
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};