import { useEffect, useState, useCallback } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export const useAuth = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Listen first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('Auth state change:', event, newSession?.user?.id);
      
      // Handle token refresh failures by clearing session
      if (event === 'TOKEN_REFRESHED' && !newSession) {
        console.log('Token refresh failed, clearing session');
        setSession(null);
        setUser(null);
        setLoading(false);
        return;
      }
      
      setSession(newSession);
      setUser(newSession?.user ?? null);
      
      // Check for super admin redirect after login - only redirect on auth/login page
      if (event === 'SIGNED_IN' && newSession?.user && (window.location.pathname === '/auth' || window.location.pathname === '/')) {
        setTimeout(async () => {
          try {
            // 먼저 사용자 프로필 확인
            const { data: profile } = await supabase
              .from('profiles')
              .select('role, onboarding_completed')
              .eq('id', newSession.user.id)
              .single();

            if (profile) {
              // 슈퍼 관리자 확인
              const { data: isSuperAdmin, error } = await supabase.rpc('is_super_admin', { uid: newSession.user.id });
              if (!error && isSuperAdmin) {
                navigate('/super-admin');
                return;
              }

              // 온보딩 완료 확인
              if (profile.onboarding_completed) {
                navigate('/');
                return;
              } else {
                navigate('/onboarding');
                return;
              }
            }
          } catch (error) {
            console.error('Error checking user status:', error);
          }
        }, 100);
      }
    });

    // Then get current session and handle URL fragments
    const handleAuthState = async () => {
      // URL에 인증 토큰이 있는지 확인 (이메일 확인 후)
      if (window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');
        
        console.log('URL fragment detected:', { accessToken: !!accessToken, refreshToken: !!refreshToken, type });
        
        if (accessToken) {
          // 이메일 확인 후 자동 로그인 처리 - URL 정리
          window.history.replaceState({}, document.title, window.location.pathname);
          
          // 세션 새로고침하여 최신 상태 가져오기
          const { data } = await supabase.auth.getSession();
          console.log('Session after email verification:', data.session);
          
          if (data.session?.user) {
            setSession(data.session);
            setUser(data.session.user);
            setLoading(false);
            
            // 프로필 확인 후 온보딩으로 이동
            setTimeout(async () => {
              try {
                const { data: profile } = await supabase
                  .from('profiles')
                  .select('onboarding_completed')
                  .eq('id', data.session.user.id)
                  .single();
                
                console.log('Profile check:', profile);
                
                // Only redirect if we're on auth or home page
                if (window.location.pathname === '/auth' || window.location.pathname === '/') {
                  if (!profile?.onboarding_completed) {
                    navigate('/onboarding');
                  } else {
                    navigate('/');
                  }
                }
              } catch (error) {
                console.error('Error checking onboarding:', error);
                navigate('/onboarding');
              }
            }, 500);
          } else {
            setLoading(false);
          }
          return;
        }
      }
      
      // 일반적인 세션 확인
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    };

    handleAuthState();

    return () => subscription.unsubscribe();
  }, [navigate]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  }, []);

  const signUp = useCallback(async (email: string, password: string, userData?: { name?: string; nickname?: string }) => {
    // 현재 환경에 맞는 리디렉션 URL 설정
    const redirectUrl = window.location.origin + '/';
    console.log('Sign up redirect URL:', redirectUrl); // 디버깅용
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { 
        emailRedirectTo: redirectUrl,
        data: userData // 추가 사용자 데이터를 meta data로 저장
      },
    });
    return { error };
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  }, []);

  return { session, user, loading, signIn, signUp, signOut };
};
