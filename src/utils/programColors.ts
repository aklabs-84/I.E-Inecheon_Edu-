// 프로그램별 일관된 색상을 생성하는 유틸리티
export const getProgramCardColors = (programId: number) => {
  const colors = [
    'bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200',
    'bg-gradient-to-br from-green-50 to-emerald-100 border-green-200',
    'bg-gradient-to-br from-purple-50 to-violet-100 border-purple-200',
    'bg-gradient-to-br from-pink-50 to-rose-100 border-pink-200',
    'bg-gradient-to-br from-yellow-50 to-amber-100 border-yellow-200',
    'bg-gradient-to-br from-cyan-50 to-teal-100 border-cyan-200',
    'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200',
    'bg-gradient-to-br from-lime-50 to-lime-100 border-lime-200',
    'bg-gradient-to-br from-sky-50 to-sky-100 border-sky-200',
    'bg-gradient-to-br from-red-50 to-red-100 border-red-200',
  ];
  
  // 프로그램 ID를 시드로 사용하여 일관된 색상 선택
  const colorIndex = programId % colors.length;
  return colors[colorIndex];
};