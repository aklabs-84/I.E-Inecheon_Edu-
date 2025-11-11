import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, User, Menu, Bell, MapPin, Shield, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { attendanceNotificationBus } from "@/utils/attendanceNotificationBus";
import { DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userProfile, setUserProfile] = useState<{name?: string; role?: string} | null>(null);
  const [headerSearchQuery, setHeaderSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("인천 전체");
  const [hasNotifications, setHasNotifications] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: 'profile' | 'application' | 'comment' | 'like' | 'attendance';
    message: string;
    timestamp: Date;
    read: boolean;
  }>>([]);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    let active = true;
    const run = async () => {
      if (!user) { 
        setIsSuperAdmin(false);
        setIsAdmin(false); 
        setUserProfile(null);
        return; 
      }
      
      // Get user profile first
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('name, role')
        .eq('id', user.id)
        .single();
      
      if (!active) return;
      if (!profileError && profileData) {
        setUserProfile(profileData);
        console.log('User profile data:', profileData);
      }
      
      // Check super admin status
      const { data: superAdminData, error: superAdminError } = await supabase.rpc('is_super_admin', { uid: user.id });
      console.log('Super admin check:', { data: superAdminData, error: superAdminError });
      if (!active) return;
      const isSuperAdminResult = !!superAdminData && !superAdminError;
      setIsSuperAdmin(isSuperAdminResult);
      
      // Check admin status
      const { data: adminData, error: adminError } = await supabase.rpc('is_admin', { uid: user.id });
      console.log('Admin check:', { data: adminData, error: adminError });
      if (!active) return;
      const isAdminResult = !!adminData && !adminError;
      setIsAdmin(isAdminResult);
      
      console.log('Final permission states:', { 
        isSuperAdmin: isSuperAdminResult, 
        isAdmin: isAdminResult,
        profileRole: profileData?.role 
      });
    };
    run();
    return () => { active = false; };
  }, [user?.id]);

  // Realtime subscriptions for user notifications
  useEffect(() => {
    if (!user?.id) return;

    console.log('🔔 Setting up notification subscriptions for user:', user.id);

    // Add notification helper function (로컬 함수로 이동)
    const addNotification = (type: 'profile' | 'application' | 'comment' | 'like' | 'attendance', message: string) => {
      console.log('🔔 Adding notification:', { type, message });
      const newNotification = {
        id: Date.now().toString(),
        type,
        message,
        timestamp: new Date(),
        read: false
      };
      setNotifications(prev => [newNotification, ...prev.slice(0, 9)]); // Keep last 10 notifications
      setNotificationCount(prev => prev + 1);
      setHasNotifications(true);
      console.log('🔔 Notification added successfully');
    };

    // Profile changes subscription
    const profileChannel = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        },
        (payload) => {
          console.log('📱 Profile change detected:', payload);
          
          if (payload.eventType === 'UPDATE') {
            const newProfile = payload.new as {name?: string; role?: string};
            const oldProfile = payload.old as {name?: string; role?: string};
            
            // Check if role changed
            if (oldProfile.role !== newProfile.role) {
              const roleText = newProfile.role === 'super_admin' ? '슈퍼관리자' : 
                              newProfile.role === 'admin' ? '관리자' : '일반 사용자';
              toast.success(`권한이 변경되었습니다: ${roleText}`);
              addNotification('profile', `권한이 ${roleText}로 변경되었습니다`);
              
              // Update states immediately
              setTimeout(() => {
                setUserProfile(newProfile);
                if (newProfile.role === 'super_admin') {
                  setIsSuperAdmin(true);
                  setIsAdmin(true);
                } else if (newProfile.role === 'admin') {
                  setIsSuperAdmin(false);
                  setIsAdmin(true);
                } else {
                  setIsSuperAdmin(false);
                  setIsAdmin(false);
                }
              }, 0);
            }
            
            // Check if name changed
            if (oldProfile.name !== newProfile.name) {
              toast.success(`프로필이 업데이트되었습니다`);
              addNotification('profile', `프로필 이름이 업데이트되었습니다`);
              
              setTimeout(() => {
                setUserProfile(newProfile);
              }, 0);
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('📱 Profile channel status:', status);  
      });

    // Application status changes subscription
    const applicationChannel = supabase
      .channel('application-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'applications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('📋 Application status changed:', payload);
          const newApp = payload.new as {status?: string; program_id?: number};
          const oldApp = payload.old as {status?: string; program_id?: number};
          
          if (oldApp.status !== newApp.status) {
            let message = '';
            switch (newApp.status) {
              case 'approved':
                message = '프로그램 신청이 승인되었습니다!';
                break;
              case 'cancelled':
                message = '프로그램 신청이 거절되었습니다.';
                break;
              case 'pending':
                message = '프로그램 신청 상태가 대기중으로 변경되었습니다.';
                break;
              default:
                message = '프로그램 신청 상태가 변경되었습니다.';
            }
            
            toast.success(message);
            addNotification('application', message);
          }
        }
      )
      .subscribe((status) => {
        console.log('📋 Application channel status:', status);  
      });

    // Comments on user's posts subscription
    const commentChannel = supabase
      .channel('comment-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments'
        },
        async (payload) => {
          console.log('💬 New comment detected:', payload);
          const comment = payload.new as {post_id?: number; user_id?: string; content?: string};
          
          // Skip if it's user's own comment
          if (comment.user_id === user.id) {
            console.log('💬 Skipping own comment');
            return;
          }
          
          console.log('💬 Checking if comment is on user post...');
          // Check if the comment is on user's post
          const { data: post } = await supabase
            .from('posts')
            .select('user_id, title')
            .eq('id', comment.post_id)
            .single();
            
          console.log('💬 Post data:', post);
          if (post?.user_id === user.id) {
            const message = `"${post.title?.substring(0, 20)}..." 게시글에 새 댓글이 달렸습니다`;
            console.log('💬 Adding comment notification:', message);
            toast.success('게시글에 새 댓글이 달렸습니다!');
            addNotification('comment', message);
          }
        }
      )
      .subscribe((status) => {
        console.log('💬 Comment channel status:', status);  
      });

    // Likes on user's posts subscription
    const likeChannel = supabase
      .channel('like-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'likes'
        },
        async (payload) => {
          console.log('❤️ New like detected:', payload);
          const like = payload.new as {post_id?: number; user_id?: string};
          
          // Skip if it's user's own like
          if (like.user_id === user.id) {
            console.log('❤️ Skipping own like');
            return;
          }
          
          console.log('❤️ Checking if like is on user post...');
          // Check if the like is on user's post
          const { data: post } = await supabase
            .from('posts')
            .select('user_id, title')
            .eq('id', like.post_id)
            .single();
            
          console.log('❤️ Post data:', post);
          if (post?.user_id === user.id) {
            const message = `"${post.title?.substring(0, 20)}..." 게시글에 좋아요가 눌렸습니다`;
            console.log('❤️ Adding like notification:', message);
            toast.success('게시글에 좋아요가 눌렸습니다!');
            addNotification('like', message);
          }
        }
      )
      .subscribe((status) => {
        console.log('❤️ Like channel status:', status);  
      });

    // 출석 알림 구독 추가
    const unsubscribeAttendance = attendanceNotificationBus.subscribe((data) => {
      console.log('📋 출석 알림 수신됨:', data);
      console.log('📋 현재 사용자 ID:', user.id);
      console.log('📋 알림 대상 사용자 ID:', data.userId);
      
      // 현재 로그인한 사용자의 알림만 처리
      if (data.userId === user.id) {
        console.log('📋 현재 사용자 알림 맞음! 처리 중...');
        
        const statusText = {
          'present': '출석',
          'absent': '결석',
          'late': '지각'
        };
        
        const message = `${data.programTitle} (${data.date}) - ${statusText[data.status]} 처리되었습니다.`;
        
        console.log('📋 Adding attendance notification:', message);
        
        // 알림 목록에 추가
        addNotification('attendance', message);
        
        // 토스트 알림도 표시
        toast.success('출석 상태가 변경되었습니다!', {
          description: message,
        });
      } else {
        console.log('📋 다른 사용자 알림이므로 무시');
      }
    });

    return () => {
      console.log('🔔 Cleaning up notification subscriptions');
      supabase.removeChannel(profileChannel);
      supabase.removeChannel(applicationChannel);
      supabase.removeChannel(commentChannel);
      supabase.removeChannel(likeChannel);
      unsubscribeAttendance();
    };
  }, [user?.id]);

  // Clear notifications when clicked
  const handleNotificationClick = () => {
    setShowNotificationDropdown(!showNotificationDropdown);
  };

  // Mark notifications as read
  const markAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    setHasNotifications(false);
    setNotificationCount(0);
  };


  // Search handlers
  const handleHeaderSearch = () => {
    if (!headerSearchQuery.trim()) return;
    navigate(`/programs?search=${encodeURIComponent(headerSearchQuery.trim())}`);
  };

  const handleRegionClick = (region: string) => {
    const regionValue = region === "인천 전체" ? "전체" : region;
    setSelectedRegion(region);
    if (regionValue === "전체") {
      navigate('/programs');
    } else {
      navigate(`/programs?region=${encodeURIComponent(regionValue)}`);
    }
  };

  const regions = ["인천 전체", "중구", "동구", "미추홀구", "연수구", "남동구", "부평구", "계양구", "서구", "강화군", "옹진군"];
 
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">인</span>
            </div>
            <span className="hidden font-bold sm:inline-block text-lg">인천에듀</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-6 text-lg font-bold">
          <Link
            to="/"
            className={`transition-colors hover:text-primary ${
              location.pathname === "/" ? "text-foreground/90" : "text-foreground/60"
            }`}
          >
            홈
          </Link>
          <Link
            to="/programs"
            className={`transition-colors hover:text-primary ${
              location.pathname === "/programs" ? "text-foreground/90" : "text-foreground/60"
            }`}
          >
            프로그램
          </Link>
          <Link
            to="/community"
            className={`transition-colors hover:text-primary ${
              location.pathname === "/community" ? "text-foreground/90" : "text-foreground/60"
            }`}
          >
            커뮤니티
          </Link>
          {/* <Link
            to="/my-profile"
            className={`transition-colors hover:text-primary ${
              location.pathname === "/my-profile" ? "text-foreground/90" : "text-foreground/60"
            }`}
          >
            나의 페이지
          </Link> */}
        </nav>

        {/* Search & User Actions */}
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="hidden md:flex relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input 
              placeholder="프로그램, 지역 검색..." 
              className="pl-10 w-64" 
              value={headerSearchQuery}
              onChange={(e) => setHeaderSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleHeaderSearch();
                }
              }}
            />
          </div>

          {/* Location */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="hidden sm:flex items-center space-x-1"
              >
                <MapPin className="h-4 w-4" />
                <span className="text-sm">{selectedRegion}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-background border shadow-lg z-50">
              {regions.map((region) => (
                <DropdownMenuItem 
                  key={region} 
                  onClick={() => handleRegionClick(region)}
                  className={selectedRegion === region ? "bg-accent" : ""}
                >
                  <MapPin className="mr-2 h-4 w-4" />
                  {region}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>


          {/* Notifications */}
          <DropdownMenu open={showNotificationDropdown} onOpenChange={setShowNotificationDropdown}>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className={`relative ${hasNotifications ? 'animate-shake' : ''}`}
                onClick={handleNotificationClick}
              >
                <Bell className={`h-4 w-4 ${hasNotifications ? 'text-orange-500' : 'text-muted-foreground'}`} />
                {hasNotifications && notificationCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 bg-destructive text-white text-xs flex items-center justify-center">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto bg-background border shadow-lg z-50">
              <div className="px-3 py-2 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">알림</h3>
                  {notifications.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={markAsRead} className="text-xs">
                      모두 읽음
                    </Button>
                  )}
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-3 py-4 text-center text-muted-foreground text-sm">
                    새로운 알림이 없습니다
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div 
                      key={notification.id}
                      className={`px-3 py-2 border-b last:border-b-0 hover:bg-accent/50 ${
                        !notification.read ? 'bg-accent/20' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${
                          notification.type === 'profile' ? 'bg-blue-500' :
                          notification.type === 'application' ? 'bg-green-500' :
                          notification.type === 'comment' ? 'bg-purple-500' :
                          notification.type === 'attendance' ? 'bg-orange-500' :
                          'bg-red-500'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground">{notification.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(notification.timestamp).toLocaleString('ko-KR', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="p-0">
                {user ? (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-sky-500 text-white font-bold text-sm">
                      {userProfile?.name?.charAt(0)?.toUpperCase() || 
                       user.email?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <User className="h-4 w-4" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {user ? (
                <>
                  {/* User Info Section */}
                  <div className="px-2 py-1.5">
                    <div className="font-medium text-sm">
                      {userProfile?.name || user.email?.split('@')[0]}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {user.email}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      {isSuperAdmin ? (
                        <Badge variant="destructive" className="text-xs">슈퍼관리자</Badge>
                      ) : isAdmin ? (
                        <Badge variant="secondary" className="text-xs">관리자</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">일반 사용자</Badge>
                      )}
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/my-profile">나의 페이지</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/my-applications">내 신청</Link>
                  </DropdownMenuItem>
                  {(isAdmin || isSuperAdmin) && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin/programs">프로그램 관리</Link>
                    </DropdownMenuItem>
                  )}
                  {isSuperAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to="/super-admin"><Shield className="mr-2 h-4 w-4"/>슈퍼관리자</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    className="text-destructive"
                    onSelect={async () => {
                      const { error } = await signOut();
                      if (error) toast.error(error.message);
                      else {
                        toast.success("로그아웃 되었습니다");
                        navigate("/");
                      }
                    }}
                  >
                    로그아웃
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem asChild>
                    <Link to="/auth">로그인</Link>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile Menu */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="md:hidden">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 overflow-y-auto max-h-screen">
              <SheetHeader className="sticky top-0 bg-background z-10 pb-4">
                <SheetTitle>메뉴</SheetTitle>
              </SheetHeader>
              
              <div className="flex flex-col space-y-6 mt-2 pb-6">{/* mt-2로 조정하고 pb-6 추가로 하단 여백 확보 */}
                {/* Mobile Search */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">검색</h3>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input 
                      placeholder="프로그램, 지역 검색..." 
                      className="pl-10" 
                      value={headerSearchQuery}
                      onChange={(e) => setHeaderSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleHeaderSearch();
                          setIsMobileMenuOpen(false);
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Mobile Region Selection */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">지역</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {regions.map((region) => (
                      <Button
                        key={region}
                        variant={selectedRegion === region ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          handleRegionClick(region);
                          setIsMobileMenuOpen(false);
                        }}
                        className="text-xs"
                      >
                        {region}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Mobile Navigation */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">메뉴</h3>
                  <div className="space-y-2">
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      asChild
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Link to="/">홈</Link>
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      asChild
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Link to="/programs">프로그램</Link>
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      asChild
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Link to="/community">커뮤니티</Link>
                    </Button>

                    {user ? (
                      <>
                        <Button
                          variant="ghost"
                          className="w-full justify-start"
                          asChild
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Link to="/my-profile">나의 페이지</Link>
                        </Button>
                        <Button
                          variant="ghost"
                          className="w-full justify-start"
                          asChild
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Link to="/my-applications">내 신청</Link>
                        </Button>
                        {(isAdmin || isSuperAdmin) && (
                          <Button
                            variant="ghost"
                            className="w-full justify-start"
                            asChild
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <Link to="/admin/programs">프로그램 관리</Link>
                          </Button>
                        )}
                        {isSuperAdmin && (
                          <Button
                            variant="ghost"
                            className="w-full justify-start"
                            asChild
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <Link to="/super-admin">슈퍼관리자</Link>
                          </Button>
                        )}
                        <Button
                          variant="destructive"
                          className="w-full justify-start mt-4"
                          onClick={async () => {
                            const { error } = await signOut();
                            if (error) toast.error(error.message);
                            else {
                              toast.success("로그아웃 되었습니다");
                              setIsMobileMenuOpen(false);
                              navigate("/");
                            }
                          }}
                        >
                          로그아웃
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="default"
                        className="w-full justify-start"
                        asChild
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Link to="/auth">로그인</Link>
                      </Button>
                    )}
                  </div>
                </div>

                {user && (
                  <div className="border-t pt-4">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-sky-500 text-white font-bold">
                          {userProfile?.name?.charAt(0)?.toUpperCase() || 
                           user.email?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-sm">
                          {userProfile?.name || user.email?.split('@')[0]}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {user.email}
                        </div>
                        <div className="mt-1">
                          {isSuperAdmin ? (
                            <Badge variant="destructive" className="text-xs">슈퍼관리자</Badge>
                          ) : isAdmin ? (
                            <Badge variant="secondary" className="text-xs">관리자</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">일반 사용자</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;
