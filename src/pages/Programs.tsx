import Header from "@/components/Header";
import ProgramCard from "@/components/ProgramCard";
import { Input } from "@/components/ui/input";
import { Search, Filter, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePrograms } from "@/hooks/usePrograms";
import { useProgramApplications } from "@/hooks/useApplications";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Footer from "@/components/Footer";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const Programs = () => {
  const { data: programs = [], isLoading } = usePrograms();
  const applicationCounts = useProgramApplications(programs.map(p => p.id));
  const [searchParams] = useSearchParams();
  
  // Filter and sort state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [selectedRegion, setSelectedRegion] = useState("전체");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [sortBy, setSortBy] = useState("latest");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  useEffect(() => {
    document.title = "교육 프로그램 - 인천 Connect Hub";
  }, []);

  // Initialize filters from URL parameters
  useEffect(() => {
    const urlSearch = searchParams.get('search');
    const urlCategory = searchParams.get('category');
    const urlRegion = searchParams.get('region');
    
    if (urlSearch) {
      setSearchQuery(urlSearch);
    }
    if (urlCategory) {
      setSelectedCategory(urlCategory);
    }
    if (urlRegion) {
      setSelectedRegion(urlRegion);
    }
  }, [searchParams]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "미정";
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const getStatus = (program: any) => {
    if (!program.start_at || !program.end_at) return "미정";
    const now = new Date();
    const startDate = new Date(program.start_at);
    const endDate = new Date(program.end_at);
    
    if (now < startDate) return "모집중";
    if (now >= startDate && now <= endDate) return "진행중";
    return "완료";
  };

  const getCurrentApplicants = (programId: number) => {
    return applicationCounts.data?.[programId] || 0;
  };

  // Transform programs for ProgramCard component
  const transformedPrograms = programs.map(program => ({
    id: program.id,
    title: program.title,
    category: program.category || "미분류",
    region: program.region || "지역 미정",
    startDate: formatDate(program.start_at),
    endDate: formatDate(program.end_at),
    capacity: program.capacity || 0,
    currentApplicants: getCurrentApplicants(program.id),
    imageUrl: program.image_url || "",
    description: program.description || "설명 없음",
    status: getStatus(program) as "모집중" | "마감" | "진행중" | "완료",
    rawStartDate: program.start_at,
    rawEndDate: program.end_at,
    createdAt: program.created_at
  }));

  // Filter and sort programs
  const getFilteredAndSortedPrograms = () => {
    let filtered = transformedPrograms;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(program => 
        program.title.toLowerCase().includes(query) || 
        program.description.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (selectedCategory !== "전체") {
      filtered = filtered.filter(program => program.category === selectedCategory);
    }

    // Filter by region
    if (selectedRegion !== "전체") {
      filtered = filtered.filter(program => program.region === selectedRegion);
    }

    // Filter by status
    if (selectedStatus !== "all") {
      switch (selectedStatus) {
        case "open":
          filtered = filtered.filter(program => program.status === "모집중");
          break;
        case "ongoing":
          filtered = filtered.filter(program => program.status === "진행중");
          break;
        case "completed":
          filtered = filtered.filter(program => program.status === "완료");
          break;
        case "closed":
          filtered = filtered.filter(program => 
            program.currentApplicants >= program.capacity && program.capacity > 0
          );
          break;
      }
    }

    // Sort programs
    switch (sortBy) {
      case "deadline":
        // Sort by start date (earliest first)
        filtered.sort((a, b) => {
          if (!a.rawStartDate) return 1;
          if (!b.rawStartDate) return -1;
          return new Date(a.rawStartDate).getTime() - new Date(b.rawStartDate).getTime();
        });
        break;
      case "popular":
        // Sort by application count (highest first)
        filtered.sort((a, b) => b.currentApplicants - a.currentApplicants);
        break;
      case "latest":
      default:
        // Sort by creation date (latest first)
        filtered.sort((a, b) => {
          if (!a.createdAt) return 1;
          if (!b.createdAt) return -1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        break;
    }

    return filtered;
  };

  const filteredPrograms = getFilteredAndSortedPrograms();
  
  // Pagination calculations
  const totalPages = Math.ceil(filteredPrograms.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPrograms = filteredPrograms.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedRegion, selectedStatus, sortBy]);

  const categories = ["전체", "IT/프로그래밍", "생활체험", "환경", "문화", "예술", "체육", "학습"];
  const regions = ["전체", "중구", "동구", "미추홀구", "연수구", "남동구", "부평구", "계양구", "서구", "강화군", "옹진군"];
  const statusOptions = [
    { value: "all", label: "전체" },
    { value: "open", label: "모집중" },
    { value: "ongoing", label: "진행중" },
    { value: "completed", label: "완료" },
    { value: "closed", label: "마감" }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">프로그램</h1>
          <p className="text-muted-foreground">
            인천 지역의 다양한 교육 프로그램을 찾아보세요
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="프로그램명 또는 키워드로 검색..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {/* Filter Button */}
            <Button variant="outline" size="default" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              필터
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="카테고리" />
              </SelectTrigger>
              <SelectContent className="bg-background border shadow-lg z-50">
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="지역" />
              </SelectTrigger>
              <SelectContent className="bg-background border shadow-lg z-50">
                {regions.map((region) => (
                  <SelectItem key={region} value={region}>
                    {region}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="상태" />
              </SelectTrigger>
              <SelectContent className="bg-background border shadow-lg z-50">
                {statusOptions.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            총 <span className="font-semibold text-foreground">{filteredPrograms.length}</span>개의 프로그램
            {(searchQuery.trim() || selectedCategory !== "전체" || selectedRegion !== "전체" || selectedStatus !== "all") && (
              <span className="ml-2">
                (전체 {transformedPrograms.length}개 중 필터링됨)
              </span>
            )}
          </p>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">정렬:</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background border shadow-lg z-50">
                <SelectItem value="latest">최신순</SelectItem>
                <SelectItem value="deadline">마감임박순</SelectItem>
                <SelectItem value="popular">인기순</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Programs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {filteredPrograms.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              {transformedPrograms.length === 0 
                ? "아직 등록된 프로그램이 없습니다."
                : "검색 조건에 맞는 프로그램이 없습니다."
              }
            </div>
          ) : (
            currentPrograms.map((program) => (
              <ProgramCard key={program.id} {...program} />
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination className="justify-center">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1) setCurrentPage(currentPage - 1);
                  }}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              
              {/* Page numbers */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                // Show first page, last page, current page, and pages around current page
                const showPage = page === 1 || 
                                page === totalPages || 
                                (page >= currentPage - 1 && page <= currentPage + 1);
                
                if (!showPage) {
                  // Show ellipsis if there's a gap
                  if (page === currentPage - 2 || page === currentPage + 2) {
                    return (
                      <PaginationItem key={page}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    );
                  }
                  return null;
                }
                
                return (
                  <PaginationItem key={page}>
                    <PaginationLink
                      href="#"
                      isActive={currentPage === page}
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage(page);
                      }}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                  }}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Programs;