import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { SurveyResponse } from "@/hooks/useSurveys";

export async function exportSurveyResultsXLSX({
  surveyTitle,
  programTitle,
  responses,
}: {
  surveyTitle: string;
  programTitle: string;
  responses: SurveyResponse[];
}) {
  const wb = new ExcelJS.Workbook();
  
  // 응답자 목록 시트
  const responseSheet = wb.addWorksheet("설문 응답", {
    properties: { defaultRowHeight: 20 },
    pageSetup: { paperSize: 9, orientation: "landscape", fitToPage: true },
    views: [{ state: "frozen", ySplit: 3 }], // title + meta + header rows
  });

  // 컬럼 정의
  responseSheet.columns = [
    { header: "번호", key: "no", width: 6 },
    { header: "이름", key: "name", width: 16 },
    { header: "소속", key: "institution", width: 20 },
    { header: "성별", key: "gender", width: 8 },
    { header: "나이", key: "age", width: 8 },
    { header: "운영전반", key: "satisfaction_0", width: 10 },
    { header: "교육시간", key: "satisfaction_1", width: 10 },
    { header: "수강인원", key: "satisfaction_2", width: 10 },
    { header: "프로그램구성", key: "satisfaction_3", width: 12 },
    { header: "강사전문성", key: "satisfaction_4", width: 10 },
    { header: "흥미유익성", key: "satisfaction_5", width: 10 },
    { header: "추천의향", key: "satisfaction_6", width: 10 },
    { header: "기타의견", key: "comments", width: 30 },
    { header: "응답일시", key: "created_at", width: 16 },
  ];

  // 공통 스타일
  const headerStyle = {
    font: { bold: true },
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
    alignment: { horizontal: "center", vertical: "middle", wrapText: true } as const,
    border: {
      top: { style: "hair", color: { argb: "FFE5E7EB" } },
      left: { style: "hair", color: { argb: "FFE5E7EB" } },
      right: { style: "hair", color: { argb: "FFE5E7EB" } },
      bottom: { style: "hair", color: { argb: "FFE5E7EB" } },
    },
  };

  // 제목 추가
  responseSheet.mergeCells("A1:N1");
  const titleCell = responseSheet.getCell("A1");
  titleCell.value = `${surveyTitle} - 응답 결과`;
  titleCell.font = { bold: true, size: 14 };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };

  // 메타(헤더 영역) 추가 (프로그램명, 응답수 등)
  responseSheet.mergeCells("A2:N2");
  const metaCell = responseSheet.getCell("A2");
  metaCell.value = `${programTitle} | 총 응답: ${responses.length}건`;
  metaCell.font = { bold: false, size: 11 };
  metaCell.alignment = { horizontal: "center", vertical: "middle" };
  // apply header-like fill to meta row
  Object.assign(metaCell, { fill: headerStyle.fill });

  // 헤더 스타일 적용 (컬럼 헤더는 3행)
  const headerRow = responseSheet.getRow(3);
  headerRow.height = 25;
  headerRow.eachCell((cell) => Object.assign(cell, { style: headerStyle }));

  // 데이터 행 추가
  responses.forEach((response, index) => {
    const rowData = {
      no: index + 1,
      name: response.profiles?.name || "이름 없음",
      institution: response.responses.institution || "-",
      gender: response.responses.gender === "male" ? "남" : response.responses.gender === "female" ? "여" : "-",
      age: response.responses.age || "-",
      satisfaction_0: getSatisfactionText(response.responses.satisfaction_0),
      satisfaction_1: getSatisfactionText(response.responses.satisfaction_1),
      satisfaction_2: getSatisfactionText(response.responses.satisfaction_2),
      satisfaction_3: getSatisfactionText(response.responses.satisfaction_3),
      satisfaction_4: getSatisfactionText(response.responses.satisfaction_4),
      satisfaction_5: getSatisfactionText(response.responses.satisfaction_5),
      satisfaction_6: getSatisfactionText(response.responses.satisfaction_6),
      comments: response.responses.comments || "-",
      created_at: new Date(response.created_at).toLocaleDateString("ko-KR"),
    };

    const row = responseSheet.addRow(rowData);
    row.height = 20;
    
    // 셀 스타일 적용
    row.eachCell((cell, colNum) => {
      Object.assign(cell, { style: cellStyle });
      
      // 만족도 셀 색상 적용
      if (colNum >= 6 && colNum <= 12) {
        const value = parseInt(String(cell.value));
        if (value >= 4) {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD1FAE5" } }; // 연녹
          cell.font = { bold: true };
        } else if (value <= 2) {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEE2E2" } }; // 연빨강
          cell.font = { bold: true };
        }
      }
      
      // 번호 열 굵게
      if (colNum === 1) {
        cell.font = { bold: true };
      }
    });

    // (원래 적용하던 짝수행 배경색 제거 — 데이터 셀은 색상 없음으로 유지)
  });

  // 통계 시트
  const statsSheet = wb.addWorksheet("만족도 통계", {
    properties: { defaultRowHeight: 20 },
    views: [{ state: "frozen", ySplit: 3 }],
  });

  statsSheet.columns = [
    { header: "문항", key: "question", width: 30 },
    { header: "평균점수", key: "average", width: 12 },
    { header: "응답수", key: "responses", width: 10 },
    { header: "매우불만", key: "very_bad", width: 10 },
    { header: "불만", key: "bad", width: 10 },
    { header: "보통", key: "normal", width: 10 },
    { header: "만족", key: "good", width: 10 },
    { header: "매우만족", key: "very_good", width: 10 },
  ];

  // 통계 제목
  statsSheet.mergeCells("A1:H1");
  const statsTitle = statsSheet.getCell("A1");
  statsTitle.value = `만족도 통계 - ${programTitle}`;
  statsTitle.font = { bold: true, size: 14 };
  statsTitle.alignment = { horizontal: "center", vertical: "middle" };
  // title fill to match response sheet header/meta
  Object.assign(statsTitle, { fill: headerStyle.fill });

  // meta row
  statsSheet.mergeCells("A2:H2");
  const statsMeta = statsSheet.getCell("A2");
  statsMeta.value = `총 응답: ${responses.length}건`;
  statsMeta.font = { bold: false, size: 11 };
  statsMeta.alignment = { horizontal: "center", vertical: "middle" };
  Object.assign(statsMeta, { fill: headerStyle.fill });

  // 통계 헤더 (3행)
  const statsHeaderRow = statsSheet.getRow(3);
  statsHeaderRow.height = 25;
  statsHeaderRow.eachCell((cell) => Object.assign(cell, { style: headerStyle }));

  // 문항별 통계 계산 및 추가
  const questions = [
    "교육과정 운영 전반에 대한 만족도",
    "교육시간의 적절성",
    "교육 수강 인원의 적절성",
    "교육 프로그램 구성 만족도",
    "강사의 준비성, 전문성",
    "프로그램 흥미/유익성",
    "향후 동일 수업 참여/추천 의향"
  ];

  questions.forEach((question, index) => {
    const questionResponses = responses
      .map(r => parseInt(r.responses[`satisfaction_${index}`]) || 0)
      .filter(v => v > 0);

    if (questionResponses.length > 0) {
      const average = questionResponses.reduce((a, b) => a + b, 0) / questionResponses.length;
      const distribution = [1, 2, 3, 4, 5].map(score => 
        questionResponses.filter(r => r === score).length
      );

      const statsRowData = {
        question,
        average: average.toFixed(1),
        responses: questionResponses.length,
        very_bad: distribution[0],
        bad: distribution[1],
        normal: distribution[2],
        good: distribution[3],
        very_good: distribution[4],
      };

      const statsRow = statsSheet.addRow(statsRowData);
      statsRow.eachCell((cell, colNum) => {
        Object.assign(cell, { style: cellStyle });
        // 데이터 행 배경 제거 (투명)
        cell.fill = undefined;
        if (colNum === 2) { // 평균점수 열
          cell.font = { bold: true };
          const avgValue = parseFloat(String(cell.value));
          if (avgValue >= 4) {
            cell.font = { bold: true, color: { argb: "FF047857" } };
          } else if (avgValue <= 2) {
            cell.font = { bold: true, color: { argb: "FFB91C1C" } };
          }
        }
      });
    }
  });

  // 파일 저장
  const buf = await wb.xlsx.writeBuffer();
  const fileName = `설문결과_${programTitle.replace(/[^a-zA-Z0-9가-힣]/g, "_")}_${new Date().toISOString().split('T')[0]}.xlsx`;
  saveAs(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), fileName);
}

function getSatisfactionText(value: string | number): string {
  const numValue = parseInt(String(value));
  switch (numValue) {
    case 5: return "매우만족";
    case 4: return "만족";
    case 3: return "보통";
    case 2: return "불만";
    case 1: return "매우불만";
    default: return "-";
  }
}