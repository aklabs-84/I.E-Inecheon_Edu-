import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // 페이지 이동 시 상단으로 스크롤
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "smooth" // 부드러운 스크롤 효과
    });
  }, [pathname]);

  return null;
};

export default ScrollToTop;