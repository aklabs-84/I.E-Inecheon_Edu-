import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

type AttendanceRecord = {
  date: string;
  status: string | null;
};

type StudentAttendance = {
  id: string;
  name: string;
  nickname: string;
  region: string;
  attendance: AttendanceRecord[];
  attendanceRate: number;
};

export async function exportAttendanceSummaryXLSX({
  programTitle,
  students,
  programDates,
}: {
  programTitle: string;
  students: StudentAttendance[];
  programDates: Date[];
}) {
  const wb = new ExcelJS.Workbook();
  
  // 첫 번째 시트: 출석 요약
  const summaryWs = wb.addWorksheet("출석 요약", {
    properties: { defaultRowHeight: 20 },
    pageSetup: { paperSize: 9, orientation: "landscape", fitToPage: true },
  });

  // 두 번째 시트: 상세 출석 현황
  const detailWs = wb.addWorksheet("상세 출석 현황", {
    properties: { defaultRowHeight: 20 },
    pageSetup: { paperSize: 9, orientation: "landscape", fitToPage: true },
  });

  // 공통 스타일
  const titleStyle = {
    font: { bold: true, size: 14 },
    alignment: { horizontal: "center", vertical: "middle" } as const,
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF4F46E5" } },
    color: { argb: "FFFFFFFF" },
  };

  const headerStyle = {
    font: { bold: true, size: 11 },
    alignment: { horizontal: "center", vertical: "middle", wrapText: true } as const,
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F4F6" } },
    border: {
      top: { style: "thin", color: { argb: "FFCBD5E1" } },
      left: { style: "thin", color: { argb: "FFCBD5E1" } },
      right: { style: "thin", color: { argb: "FFCBD5E1" } },
      bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
    },
  };

  const cellStyle = {
    alignment: { horizontal: "center", vertical: "middle" } as const,
    border: {
      top: { style: "hair", color: { argb: "FFE5E7EB" } },
      left: { style: "hair", color: { argb: "FFE5E7EB" } },
      right: { style: "hair", color: { argb: "FFE5E7EB" } },
      bottom: { style: "hair", color: { argb: "FFE5E7EB" } },
    },
  };

  // === 출석 요약 시트 ===
  // 제목
  const titleRange = `A1:E1`;
  summaryWs.mergeCells(titleRange);
  summaryWs.getCell("A1").value = `${programTitle} - 출석 요약`;
  Object.assign(summaryWs.getCell("A1"), { style: titleStyle });
  summaryWs.getRow(1).height = 30;

  // 기본 정보
  summaryWs.getCell("A3").value = "총 프로그램 일수:";
  summaryWs.getCell("B3").value = programDates.length;
  summaryWs.getCell("A4").value = "총 참가자 수:";
  summaryWs.getCell("B4").value = students.length;
  summaryWs.getCell("A5").value = "출력 일시:";
  summaryWs.getCell("B5").value = format(new Date(), "yyyy년 MM월 dd일 HH:mm", { locale: ko });

  // 요약 테이블 헤더
  const summaryHeaders = ["순번", "이름", "닉네임", "지역", "출석률"];
  summaryWs.addRow([]); // 빈 행
  const summaryHeaderRow = summaryWs.addRow(summaryHeaders);
  summaryHeaderRow.height = 25;
  summaryHeaderRow.eachCell((cell) => {
    Object.assign(cell, { style: headerStyle });
  });

  // 요약 데이터
  students.forEach((student, index) => {
    const row = summaryWs.addRow([
      index + 1,
      student.name,
      student.nickname,
      student.region,
      `${student.attendanceRate.toFixed(1)}%`
    ]);
    
    row.eachCell((cell, colNumber) => {
      Object.assign(cell, { style: cellStyle });
      
      // 출석률에 따른 색상 적용
      if (colNumber === 5) {
        if (student.attendanceRate >= 90) {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDCFCE7" } }; // 연한 초록
        } else if (student.attendanceRate >= 70) {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF3C7" } }; // 연한 노랑
        } else {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFECACA" } }; // 연한 빨강
        }
      }
    });
  });

  // 컬럼 너비 조정
  summaryWs.columns = [
    { width: 8 },   // 순번
    { width: 12 },  // 이름
    { width: 15 },  // 닉네임
    { width: 12 },  // 지역
    { width: 12 },  // 출석률
  ];

  // === 상세 출석 현황 시트 ===
  // 제목
  const detailTitleRange = `A1:${String.fromCharCode(68 + programDates.length)}1`; // D + 날짜 수만큼
  detailWs.mergeCells(detailTitleRange);
  detailWs.getCell("A1").value = `${programTitle} - 상세 출석 현황`;
  Object.assign(detailWs.getCell("A1"), { style: titleStyle });
  detailWs.getRow(1).height = 30;

  // 상세 테이블 헤더
  const detailHeaders = ["순번", "이름", "닉네임", "지역"];
  programDates.forEach(date => {
    detailHeaders.push(format(date, "MM/dd(E)", { locale: ko }));
  });
  detailHeaders.push("출석률");

  detailWs.addRow([]); // 빈 행
  const detailHeaderRow = detailWs.addRow(detailHeaders);
  detailHeaderRow.height = 25;
  detailHeaderRow.eachCell((cell) => {
    Object.assign(cell, { style: headerStyle });
  });

  // 상세 데이터
  students.forEach((student, index) => {
    const rowData = [
      index + 1,
      student.name,
      student.nickname,
      student.region,
    ];

    // 각 날짜별 출석 상태 추가
    programDates.forEach(date => {
      const dateStr = format(date, "yyyy-MM-dd");
      const attendance = student.attendance.find(a => a.date === dateStr);
      let statusText = "-";
      
      switch (attendance?.status) {
        case "present":
          statusText = "출석";
          break;
        case "absent":
          statusText = "결석";
          break;
        case "late":
          statusText = "지각";
          break;
        default:
          statusText = "-";
      }
      
      rowData.push(statusText);
    });

    // 출석률 추가
    rowData.push(`${student.attendanceRate.toFixed(1)}%`);

    const row = detailWs.addRow(rowData);
    
    row.eachCell((cell, colNumber) => {
      Object.assign(cell, { style: cellStyle });
      
      // 출석 상태에 따른 색상 적용 (날짜 컬럼들)
      if (colNumber > 4 && colNumber <= 4 + programDates.length) {
        switch (cell.value) {
          case "출석":
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDCFCE7" } }; // 연한 초록
            break;
          case "결석":
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFECACA" } }; // 연한 빨강
            break;
          case "지각":
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF3C7" } }; // 연한 노랑
            break;
        }
      }
      
      // 출석률 색상
      if (colNumber === rowData.length) {
        if (student.attendanceRate >= 90) {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDCFCE7" } };
        } else if (student.attendanceRate >= 70) {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF3C7" } };
        } else {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFECACA" } };
        }
      }
    });
  });

  // 상세 시트 컬럼 너비 조정
  const detailColumns = [
    { width: 8 },   // 순번
    { width: 12 },  // 이름
    { width: 15 },  // 닉네임
    { width: 12 },  // 지역
  ];
  
  // 날짜 컬럼들
  programDates.forEach(() => {
    detailColumns.push({ width: 10 });
  });
  
  detailColumns.push({ width: 12 }); // 출석률

  detailWs.columns = detailColumns;

  // 파일 저장
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { 
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" 
  });
  
  const fileName = `${programTitle}_출석현황_${format(new Date(), "yyyyMMdd_HHmm")}.xlsx`;
  saveAs(blob, fileName);
}