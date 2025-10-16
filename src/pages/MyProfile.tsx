import Header from "@/components/Header";
import CommunityCard from "@/components/CommunityCard";
import PostForm from "@/components/PostForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { User, Lock, Shield, Eye, EyeOff, FileText, Settings, Ban, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usePosts } from "@/hooks/usePosts";
import { useMyBlacklistStatus } from "@/hooks/useBlacklist";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { validatePassword } from "@/lib/passwordValidation";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import Footer from "@/components/Footer";

const MyProfile = () => {
  const { user } = useAuth();
  const { posts, loading: postsLoading, fetchMyPosts, updatePost, deletePost } = usePosts();
  const { data: blacklistStatus, isLoading: isBlacklistLoading } = useMyBlacklistStatus();
  const [userProfile, setUserProfile] = useState<{name?: string; role?: string} | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [showPostForm, setShowPostForm] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [isFormLoading, setIsFormLoading] = useState(false);
  
  // Profile form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  
  // Password form states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState<{
    isValid: boolean;
    score: number;
    feedback: string[];
    isBreached: boolean;
  } | null>(null);

  // Admin request state
  const [isRequestingAdmin, setIsRequestingAdmin] = useState(false);
  const [hasAdminRequest, setHasAdminRequest] = useState(false);

  // Onboarding data state
  const [onboardingData, setOnboardingData] = useState({
    age_group: '',
    gender: '',
    region: '',
    preferred_category: '',
    learning_style: '',
    available_time: [] as string[],
    learning_purpose: ''
  });
  const [isUpdatingOnboarding, setIsUpdatingOnboarding] = useState(false);

  useEffect(() => {
    document.title = "내 프로필 - 인천 Connect Hub";
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;

      // Get user profile and onboarding data
      const { data: profileData } = await supabase
        .from('profiles')
        .select('name, role, age_group, gender, region, preferred_category, learning_style, available_time, learning_purpose')
        .eq('id', user.id)
        .single();
      
      if (profileData) {
        setUserProfile(profileData);
        setName(profileData.name || "");
        setEmail(user.email || "");
        
        // Set onboarding data
        setOnboardingData({
          age_group: profileData.age_group || '',
          gender: profileData.gender || '',
          region: profileData.region || '',
          preferred_category: profileData.preferred_category || '',
          learning_style: profileData.learning_style || '',
          available_time: profileData.available_time ? profileData.available_time.split(',') : [],
          learning_purpose: profileData.learning_purpose || ''
        });
      }

      // Check admin status
      const { data: adminData } = await supabase.rpc('is_admin', { uid: user.id });
      setIsAdmin(!!adminData);

      const { data: superAdminData } = await supabase.rpc('is_super_admin', { uid: user.id });
      setIsSuperAdmin(!!superAdminData);

      // Check existing admin request
      const { data: requestData } = await supabase
        .from('admin_requests')
        .select('status')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .single();
      
      setHasAdminRequest(!!requestData);

      // Fetch user posts
      fetchMyPosts(user.id);
    };

    fetchUserData();
  }, [user]);

  const handleOnboardingUpdate = async () => {
    if (!user) return;
    
    setIsUpdatingOnboarding(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          age_group: onboardingData.age_group,
          gender: onboardingData.gender,
          region: onboardingData.region,
          preferred_category: onboardingData.preferred_category,
          learning_style: onboardingData.learning_style,
          available_time: onboardingData.available_time.join(','),
          learning_purpose: onboardingData.learning_purpose
        })
        .eq('id', user.id);

      if (error) throw error;
      
      toast.success("온보딩 정보가 업데이트되었습니다.");
    } catch (error: any) {
      toast.error("온보딩 정보 업데이트에 실패했습니다: " + error.message);
    } finally {
      setIsUpdatingOnboarding(false);
    }
  };

  const updateOnboardingData = (key: string, value: any) => {
    setOnboardingData(prev => ({ ...prev, [key]: value }));
  };

  const handleProfileUpdate = async () => {
    if (!user) return;
    
    setIsUpdatingProfile(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ name })
        .eq('id', user.id);

      if (error) throw error;
      
      toast.success("프로필이 업데이트되었습니다.");
      setUserProfile(prev => prev ? { ...prev, name } : { name });
    } catch (error: any) {
      toast.error("프로필 업데이트에 실패했습니다: " + error.message);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("새 비밀번호가 일치하지 않습니다.");
      return;
    }

    if (!passwordValidation?.isValid) {
      toast.error("비밀번호가 보안 요구사항을 충족하지 않습니다.");
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
      
      toast.success("비밀번호가 변경되었습니다.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordValidation(null);
    } catch (error: any) {
      toast.error("비밀번호 변경에 실패했습니다: " + error.message);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleAdminRequest = async () => {
    if (!user) return;
    
    setIsRequestingAdmin(true);
    try {
      const { error } = await supabase.rpc('request_admin_role');
      
      if (error) throw error;
      
      toast.success("관리자 권한 요청이 제출되었습니다.");
      setHasAdminRequest(true);
    } catch (error: any) {
      toast.error("관리자 권한 요청에 실패했습니다: " + error.message);
    } finally {
      setIsRequestingAdmin(false);
    }
  };

  const handlePasswordValidation = async (password: string) => {
    setNewPassword(password);
    if (password) {
      const validation = await validatePassword(password);
      setPasswordValidation(validation);
    } else {
      setPasswordValidation(null);
    }
  };

  const handleEditPost = (post: any) => {
    setEditingPost(post);
    setShowPostForm(true);
  };

  const handleDeletePost = async (postId: number) => {
    if (confirm("정말로 이 게시글을 삭제하시겠습니까?")) {
      await deletePost(postId);
    }
  };

  const handlePostSubmit = async (data: any) => {
    setIsFormLoading(true);
    try {
      if (editingPost) {
        const success = await updatePost(editingPost.id, data);
        if (success && user) {
          await fetchMyPosts(user.id);
        }
        return success;
      }
      return false;
    } finally {
      setIsFormLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return `${Math.floor(diffInHours * 60)}분 전`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}시간 전`;
    } else {
      return `${Math.floor(diffInHours / 24)}일 전`;
    }
  };

  const getRoleDisplay = () => {
    if (isSuperAdmin) return "슈퍼관리자";
    if (isAdmin) return "관리자";
    return "일반 사용자";
  };

  const getRoleBadgeColor = () => {
    if (isSuperAdmin) return "bg-red-500";
    if (isAdmin) return "bg-blue-500";
    return "bg-gray-500";
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">로그인이 필요합니다.</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">나의 페이지</h1>
          <p className="text-muted-foreground">
            개인정보를 관리하고 계정 설정을 변경하세요
          </p>
        </div>

        {/* User Info Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              사용자 정보
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xl">
                  {(userProfile?.name || user.email?.split('@')[0] || 'U')[0].toUpperCase()}
                </span>
              </div>
              <div className="space-y-1 flex-1">
                <h3 className="text-lg font-semibold">
                  {userProfile?.name || user.email?.split('@')[0]}
                </h3>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white ${getRoleBadgeColor()}`}>
                    {getRoleDisplay()}
                  </div>
                  
                  {/* 블랙리스트 상태 뱃지 */}
                  {isBlacklistLoading ? (
                    <Badge variant="outline" className="text-xs">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      확인 중...
                    </Badge>
                  ) : blacklistStatus && blacklistStatus.is_active && new Date(blacklistStatus.blacklisted_until) > new Date() ? (
                    <Badge variant="destructive" className="text-xs">
                      <Ban className="h-3 w-3 mr-1" />
                      블랙리스트 ({new Date(blacklistStatus.blacklisted_until).toLocaleDateString("ko-KR")}까지)
                    </Badge>
                  ) : blacklistStatus ? (
                    <Badge variant="outline" className="text-xs text-green-600 border-green-500">
                      ✅ 정상 사용자
                    </Badge>
                  ) : null}
                </div>
              </div>
            </div>
            
            {/* 블랙리스트 상세 정보 */}
            {blacklistStatus && blacklistStatus.is_active && new Date(blacklistStatus.blacklisted_until) > new Date() && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Ban className="h-4 w-4 text-red-500 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-red-700">프로그램 신청이 제한되었습니다</p>
                    <p className="text-red-600 mt-1">
                      <strong>사유:</strong> {blacklistStatus.reason}
                    </p>
                    <p className="text-red-600">
                      <strong>해제일:</strong> {new Date(blacklistStatus.blacklisted_until).toLocaleDateString("ko-KR")}
                    </p>
                    <p className="text-red-500 text-xs mt-2">
                      문의사항이 있으시면 운영팀에 연락주세요.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Settings Tabs */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile">프로필 설정</TabsTrigger>
            <TabsTrigger value="onboarding">온보딩 정보</TabsTrigger>
            <TabsTrigger value="password">비밀번호 변경</TabsTrigger>
            <TabsTrigger value="posts">내 게시글</TabsTrigger>
            <TabsTrigger value="admin">권한 관리</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>프로필 정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">표시 이름</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="표시될 이름을 입력하세요"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">이메일</Label>
                  <Input
                    id="email"
                    value={email}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    이메일은 변경할 수 없습니다.
                  </p>
                </div>
                <Button 
                  onClick={handleProfileUpdate}
                  disabled={isUpdatingProfile || !name.trim()}
                >
                  {isUpdatingProfile ? "업데이트 중..." : "프로필 업데이트"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="onboarding" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  온보딩 정보 수정
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Age Group */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">나이대</Label>
                  <RadioGroup 
                    value={onboardingData.age_group} 
                    onValueChange={(value) => updateOnboardingData('age_group', value)}
                  >
                    {['10대', '20대', '30대', '40대', '50대', '60대 이상'].map((age) => (
                      <div key={age} className="flex items-center space-x-2">
                        <RadioGroupItem value={age} id={`age-${age}`} />
                        <Label htmlFor={`age-${age}`}>{age}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {/* Gender */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">성별</Label>
                  <RadioGroup 
                    value={onboardingData.gender} 
                    onValueChange={(value) => updateOnboardingData('gender', value)}
                  >
                    {['남성', '여성', '기타'].map((gender) => (
                      <div key={gender} className="flex items-center space-x-2">
                        <RadioGroupItem value={gender} id={`gender-${gender}`} />
                        <Label htmlFor={`gender-${gender}`}>{gender}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {/* Region */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">거주 지역</Label>
                  <Select value={onboardingData.region} onValueChange={(value) => updateOnboardingData('region', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="거주 지역을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {['중구', '동구', '미추홀구', '연수구', '남동구', '부평구', '계양구', '서구', '강화군', '옹진군'].map((region) => (
                        <SelectItem key={region} value={region}>{region}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Preferred Category */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">관심 카테고리</Label>
                  <RadioGroup 
                    value={onboardingData.preferred_category} 
                    onValueChange={(value) => updateOnboardingData('preferred_category', value)}
                  >
                    {['컴퓨터', '어학', '예술', '요리', '운동', '기타'].map((category) => (
                      <div key={category} className="flex items-center space-x-2">
                        <RadioGroupItem value={category} id={`category-${category}`} />
                        <Label htmlFor={`category-${category}`}>{category}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {/* Learning Style */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">선호하는 학습 방식</Label>
                  <RadioGroup 
                    value={onboardingData.learning_style} 
                    onValueChange={(value) => updateOnboardingData('learning_style', value)}
                  >
                    {['오프라인', '온라인', '상관없음'].map((style) => (
                      <div key={style} className="flex items-center space-x-2">
                        <RadioGroupItem value={style} id={`style-${style}`} />
                        <Label htmlFor={`style-${style}`}>{style}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {/* Available Time */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">참여 가능한 시간대</Label>
                  <div className="space-y-2">
                    {['오전', '오후', '저녁', '주말'].map((time) => (
                      <div key={time} className="flex items-center space-x-2">
                        <Checkbox
                          id={`time-${time}`}
                          checked={onboardingData.available_time.includes(time)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              updateOnboardingData('available_time', [...onboardingData.available_time, time]);
                            } else {
                              updateOnboardingData('available_time', onboardingData.available_time.filter(t => t !== time));
                            }
                          }}
                        />
                        <Label htmlFor={`time-${time}`}>{time}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Learning Purpose */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">학습 목적</Label>
                  <RadioGroup 
                    value={onboardingData.learning_purpose} 
                    onValueChange={(value) => updateOnboardingData('learning_purpose', value)}
                  >
                    {['자격증', '취미', '진학', '취업', '개인발전'].map((purpose) => (
                      <div key={purpose} className="flex items-center space-x-2">
                        <RadioGroupItem value={purpose} id={`purpose-${purpose}`} />
                        <Label htmlFor={`purpose-${purpose}`}>{purpose}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <Button 
                  onClick={handleOnboardingUpdate}
                  disabled={isUpdatingOnboarding}
                  className="w-full"
                >
                  {isUpdatingOnboarding ? "업데이트 중..." : "온보딩 정보 업데이트"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="password" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  비밀번호 변경
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">새 비밀번호</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => handlePasswordValidation(e.target.value)}
                      placeholder="새 비밀번호를 입력하세요"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  
                  {passwordValidation && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-full rounded-full bg-gray-200`}>
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              passwordValidation.score >= 3 ? 'bg-green-500' : 
                              passwordValidation.score >= 2 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${(passwordValidation.score / 4) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium">
                          {passwordValidation.score === 4 ? '매우 강함' :
                           passwordValidation.score === 3 ? '강함' :
                           passwordValidation.score === 2 ? '보통' : '약함'}
                        </span>
                      </div>
                      
                      {passwordValidation.feedback.length > 0 && (
                        <ul className="text-xs text-muted-foreground space-y-1">
                          {passwordValidation.feedback.map((item, index) => (
                            <li key={index}>• {item}</li>
                          ))}
                        </ul>
                      )}
                      
                      {passwordValidation.isBreached && (
                        <p className="text-xs text-red-500">
                          ⚠️ 이 비밀번호는 데이터 유출에서 발견되었습니다. 다른 비밀번호를 사용하세요.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">새 비밀번호 확인</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="새 비밀번호를 다시 입력하세요"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-red-500">
                      비밀번호가 일치하지 않습니다.
                    </p>
                  )}
                </div>

                <Button 
                  onClick={handlePasswordChange}
                  disabled={
                    isUpdatingPassword || 
                    !newPassword || 
                    !confirmPassword || 
                    newPassword !== confirmPassword ||
                    !passwordValidation?.isValid
                  }
                >
                  {isUpdatingPassword ? "변경 중..." : "비밀번호 변경"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="posts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  내가 작성한 게시글
                </CardTitle>
              </CardHeader>
              <CardContent>
                {postsLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    게시글을 불러오는 중...
                  </div>
                ) : posts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    아직 작성한 게시글이 없습니다.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {posts.map((post) => (
                      <CommunityCard
                        key={post.id}
                        id={post.id}
                        title={post.title}
                        content={post.content}
                        category={post.category}
                        region={post.region}
                        author={post.profiles?.name || '익명'}
                        createdAt={formatDate(post.created_at)}
                        commentCount={0}
                        likeCount={0}
                        isLiked={false}
                        canEdit={true}
                        onEdit={() => handleEditPost(post)}
                        onDelete={() => handleDeletePost(post.id)}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="admin" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  권한 관리
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">현재 권한</h4>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white ${getRoleBadgeColor()}`}>
                    {getRoleDisplay()}
                  </div>
                </div>

                {!isAdmin && !isSuperAdmin && (
                  <div className="space-y-4 pt-4 border-t">
                    <div className="space-y-2">
                      <h4 className="font-medium">관리자 권한 요청</h4>
                      <p className="text-sm text-muted-foreground">
                        프로그램을 관리하려면 관리자 권한이 필요합니다. 
                        관리자 권한을 요청하면 슈퍼관리자의 승인을 받게 됩니다.
                      </p>
                    </div>

                    {hasAdminRequest ? (
                      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">
                          관리자 권한 요청이 제출되었습니다. 승인을 기다려주세요.
                        </p>
                      </div>
                    ) : (
                      <Button 
                        onClick={handleAdminRequest}
                        disabled={isRequestingAdmin}
                        variant="outline"
                      >
                        {isRequestingAdmin ? "요청 중..." : "관리자 권한 요청"}
                      </Button>
                    )}
                  </div>
                )}

                {(isAdmin || isSuperAdmin) && (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-sm text-green-700 dark:text-green-300">
                      관리자 권한을 보유하고 있습니다. 프로그램 관리 기능을 사용할 수 있습니다.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <PostForm
          open={showPostForm}
          onOpenChange={setShowPostForm}
          onSubmit={handlePostSubmit}
          post={editingPost}
          loading={isFormLoading}
        />
      </main>
      <Footer />
    </div>
  );
};

export default MyProfile;
