-- 서울 지역을 인천 지역으로 수정
UPDATE public.programs 
SET region = CASE 
  WHEN region = '강남구' THEN '연수구'
  WHEN region = '서초구' THEN '남동구'
  WHEN region = '마포구' THEN '부평구'
  WHEN region = '종로구' THEN '중구'
  WHEN region = '송파구' THEN '계양구'
  WHEN region = '광진구' THEN '서구'
  WHEN region = '성동구' THEN '동구'
  WHEN region = '용산구' THEN '미추홀구'
  WHEN region = '은평구' THEN '강화군'
  ELSE region
END
WHERE region IN ('강남구', '서초구', '마포구', '종로구', '송파구', '광진구', '성동구', '용산구', '은평구');