import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

type RowItem = {
  no: number;
  name: string;
  nickname: string;
  region: string;
  status: "출석" | "결석" | "지각" | "미체크";
  signature?: string; // 서명 이미지 URL 추가
  memo?: string;
};

// 이미지 URL을 Base64로 변환하는 헬퍼 함수
const urlToBase64 = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('이미지 로드 실패:', error);
    return null;
  }
};

export async function exportAttendanceXLSX({
  programTitle,
  selectedDate, // "yyyy-MM-dd"
  rows,         // RowItem[]
}: {
  programTitle: string;
  selectedDate: string;
  rows: RowItem[];
}) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("출석부", {
    properties: { defaultRowHeight: 20 },
    pageSetup: { paperSize: 9, orientation: "portrait", fitToPage: true },
    views: [{ state: "frozen", ySplit: 1 }],
  });

  // 컬럼 정의 (서명 컬럼 추가)
  ws.columns = [
    { header: "번호",       key: "no",        width: 6 },
    { header: "이름",       key: "name",      width: 16 },
    { header: "닉네임",     key: "nickname",  width: 16 },
    { header: "지역",       key: "region",    width: 12 },
    { header: "출석상태",   key: "status",    width: 12 },
    { header: "서명",       key: "signature", width: 20 },
    { header: "비고",       key: "memo",      width: 24 },
  ];

  // 공통 스타일 헬퍼
  const thStyle = {
    font: { bold: true },
    alignment: { horizontal: "center", vertical: "middle", wrapText: true } as const,
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F4F6" } }, // 연회색
    border: {
      top: { style: "thin", color: { argb: "FFCBD5E1" } },
      left:{ style: "thin", color: { argb: "FFCBD5E1" } },
      right:{style: "thin", color: { argb: "FFCBD5E1" } },
      bottom:{style: "thin", color: { argb: "FFCBD5E1" } },
    },
  };
  const tdStyle = {
    alignment: { horizontal: "center", vertical: "middle", wrapText: true } as const,
    border: {
      top: { style: "hair", color: { argb: "FFE5E7EB" } },
      left:{ style: "hair", color: { argb: "FFE5E7EB" } },
      right:{style: "hair", color: { argb: "FFE5E7EB" } },
      bottom:{style: "hair", color: { argb: "FFE5E7EB" } },
    },
  };

  // 제목(병합 + 굵게)
  ws.mergeCells("A1:G1");
  ws.getCell("A1").value = `출석부 - ${programTitle} (${selectedDate})`;
  ws.getCell("A1").font = { bold: true, size: 14 };
  ws.getCell("A1").alignment = { horizontal: "left", vertical: "middle" };

  // 헤더 행
  const headerRow = ws.addRow(ws.columns.map(c => c.header as string));
  headerRow.height = 22;
  headerRow.eachCell((cell) => Object.assign(cell, { style: thStyle }));

  // 데이터 행 (서명 이미지 포함)
  for (let idx = 0; idx < rows.length; idx++) {
    const r = rows[idx];
    const rowIndex = 3 + idx; // 헤더 다음부터 시작
    
    // 행 높이를 서명 이미지에 맞게 조정 (서명이 있는 경우)
    const row = ws.addRow(r);
    row.height = r.signature ? 80 : 20;
    
    row.eachCell((cell, col) => {
      Object.assign(cell, { style: tdStyle });
      
      // 상태 컬러칩
      if (ws.getColumn(col).key === "status") {
        const v = String(cell.value);
        let color = "FFD1FAE5"; // 출석(연녹)
        if (v === "결석") color = "FFFEE2E2";
        else if (v === "지각") color = "FFFDF6B2";
        else if (v === "미체크") color = "FFE5E7EB";
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: color } };
        cell.font = { bold: true };
      }
      
      // 첫 컬럼 번호는 굵게
      if (ws.getColumn(col).key === "no") cell.font = { bold: true };
    });

    // 서명 이미지 추가
    if (r.signature) {
      try {
        let base64Data: string | null = null;
        if (r.signature.startsWith('data:image/')) {
          base64Data = r.signature.split(',')[1];
        } else {
          const dataUrl = await urlToBase64(r.signature);
          if (dataUrl && dataUrl.startsWith('data:image/')) {
            base64Data = dataUrl.split(',')[1];
          }
        }
        if (base64Data) {
          const imageId = wb.addImage({
            base64: base64Data,
            extension: 'png',
          });
          ws.addImage(imageId, {
            tl: { col: 5, row: rowIndex - 1 }, // F열 (0-based)
            ext: { width: 120, height: 60 },
            editAs: 'oneCell'
          });
          // 셀 값은 공백 처리 (이미지와 링크 겹침 방지)
          row.getCell('signature').value = '';
        } else {
          row.getCell('signature').value = '이미지 변환 실패';
        }
      } catch (error) {
        console.error('서명 이미지 로드 실패:', error);
        row.getCell('signature').value = '이미지 로드 실패';
      }
    } else {
      row.getCell('signature').value = '서명 없음';
    }

    // 줄무늬 효과
    if (idx % 2 === 1) {
      row.eachCell((cell) => {
        if (ws.getColumn(cell.col).key !== "status") {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFAFAFA" } };
        }
      });
    }
  }

  // 빈 줄 하나
  ws.addRow([]);

  // 하단 통계 블록
  const total = rows.length;
  const present = rows.filter(r => r.status === "출석").length;
  const absent  = rows.filter(r => r.status === "결석").length;
  const late    = rows.filter(r => r.status === "지각").length;
  const unchecked = rows.filter(r => r.status === "미체크").length;

  // "출석 통계" 타이틀 라인
  ws.mergeCells(`A${ws.lastRow!.number + 1}:G${ws.lastRow!.number + 1}`);
  const titleCell = ws.getCell(`A${ws.lastRow!.number}`);
  titleCell.value = "출석 통계";
  titleCell.font = { bold: true };
  titleCell.alignment = { horizontal: "left", vertical: "middle" };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };

  // 항목 행들
  const statRows: [string, number][] = [
    ["총 인원", total],
    ["출석", present],
    ["결석", absent],
    ["지각", late],
    ["미체크", unchecked],
  ];

  statRows.forEach(([label, value]) => {
    const r = ws.addRow([label, value]);
    // A~B만 사용, 나머지 셀은 병합해서 배경 유지
    ws.mergeCells(`C${r.number}:G${r.number}`);
    // 스타일
    const a = ws.getCell(`A${r.number}`);
    const b = ws.getCell(`B${r.number}`);
    const c = ws.getCell(`C${r.number}`);
    [a, b, c].forEach(cell => {
      cell.alignment = { horizontal: "left", vertical: "middle" };
      cell.border = tdStyle.border as any;
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
    });
    a.font = { bold: true };
    // 상태별 강조색
    if (label === "출석") b.font = { bold: true, color: { argb: "FF047857" } };
    if (label === "결석") b.font = { bold: true, color: { argb: "FFB91C1C" } };
    if (label === "지각") b.font = { bold: true, color: { argb: "FFA16207" } };
    if (label === "미체크") b.font = { bold: true, color: { argb: "FF52525B" } };
  });

  // 출력(다운로드)
  const buf = await wb.xlsx.writeBuffer();
  const fileName = `출석부_${programTitle.replace(/[^a-zA-Z0-9가-힣]/g, "_")}_${selectedDate}.xlsx`;
  saveAs(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), fileName);
}