import { useNavigate } from "react-router-dom";

const Footer = () => {
  const navigate = useNavigate();

  return (
    <footer className="py-12 border-t bg-gradient-to-r from-muted/50 to-background mt-24">
      <div className="container">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <img src="/favicon-32x32.png" alt="인천에듀" className="w-8 h-8 object-contain rounded-lg" />
              <span className="font-bold text-lg">인천에듀</span>
            </div>
            <p className="text-sm text-muted-foreground">
              인천 동구청과 함께하는<br />
              통합 교육 정보 플랫폼
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">서비스</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><button onClick={() => navigate('/programs')} className="hover:text-primary transition-colors text-left">프로그램 검색</button></li>
              <li><button onClick={() => navigate('/community')} className="hover:text-primary transition-colors text-left">커뮤니티</button></li>
              <li><button onClick={() => navigate('/my-applications')} className="hover:text-primary transition-colors text-left">내 신청관리</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">지원</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="https://aklabs1984.notion.site/27de562546d580129938f20a9d17f2cf?source=copy_link" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">도움말</a></li>
              <li><a href="https://aklabs1984.notion.site/27de562546d580babf1df70aae76aa00?source=copy_link" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">문의하기</a></li>
              <li><a href="https://aklabs1984.notion.site/27de562546d580eba93ccce119d389bc?source=copy_link" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">공지사항</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">연락처</h4>
            <p className="text-sm text-muted-foreground">
              인천광역시 동구 화도진로 154,<br />
              2층 & 지하드론교육장<br />
              Tel: 0507-1335-0298
            </p>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          © 2025 인천동구청 & (주)마음길
        </div>
      </div>
    </footer>
  );
};

export default Footer;