-- 테스트용: 블랙리스트 해제 시간을 내일(2025-10-17) 00:00:00으로 변경
-- 실제 운영 시에는 이 스크립트를 사용하지 마세요!

UPDATE blacklist 
SET blacklisted_until = '2025-10-17 00:00:00+00:00'
WHERE user_id = 'e02d1b1d-3602-4aac-b1f4-894988551bb5' 
  AND is_active = true;

-- 확인용 쿼리
SELECT 
  id,
  user_id,
  reason,
  blacklisted_at,
  blacklisted_until,
  is_active,
  CASE 
    WHEN blacklisted_until > NOW() THEN '활성 (제한 중)'
    ELSE '기간 만료 (해제됨)'
  END as status
FROM blacklist 
WHERE user_id = 'e02d1b1d-3602-4aac-b1f4-894988551bb5'
ORDER BY created_at DESC;