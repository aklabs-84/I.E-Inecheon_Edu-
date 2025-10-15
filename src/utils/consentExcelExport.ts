import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import type { ConsentSubmissionWithProfile } from '@/hooks/useConsent';

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

interface ConsentExportData {
  programTitle: string;
  consentTitle: string;
  submissions: ConsentSubmissionWithProfile[];
}

export const exportConsentXLSX = async ({
  programTitle,
  consentTitle,
  submissions
}: ConsentExportData) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('동의서 현황');

    // 열 정의 (서명 컬럼 추가)
    worksheet.columns = [
      { header: '번호', key: 'no', width: 8 },
      { header: '성명', key: 'name', width: 12 },
      { header: '생년월일', key: 'birthDate', width: 12 },
      { header: '성별', key: 'gender', width: 8 },
      { header: '휴대폰 번호', key: 'phone', width: 15 },
      { header: '거주동명', key: 'address', width: 12 },
      { header: '학교/기관', key: 'institution', width: 15 },
      { header: '동의 여부', key: 'agreed', width: 10 },
      { header: '서명', key: 'signature', width: 20 },
      { header: '제출일시', key: 'submittedAt', width: 15 },
      { header: '비고', key: 'memo', width: 15 }
    ];

    // 상단 메타 정보 (1-3행)
    const totalCount = submissions.length;
    const agreedCount = submissions.filter(s => s.agreed).length;
    const disagreedCount = totalCount - agreedCount;

    worksheet.mergeCells('A1:K1');
    worksheet.getCell('A1').value = `동의서 현황 - ${programTitle}`;
    worksheet.getCell('A1').font = { size: 16, bold: true };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };

    worksheet.mergeCells('A2:K2');
    const metaText = `동의서명: ${consentTitle} | 총 작성 인원: ${totalCount}명 | 동의: ${agreedCount}명 | 미동의: ${disagreedCount}명`;
    worksheet.getCell('A2').value = metaText;
    worksheet.getCell('A2').alignment = { horizontal: 'center' };
    worksheet.getCell('A2').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF2F2F2' }
    };

    // 빈 행
    worksheet.addRow([]);

    // 헤더 행 (4행) - 높이 증가
    const headerRow = worksheet.getRow(4);
    headerRow.height = 30;
    worksheet.columns.forEach((col, index) => {
      const cell = headerRow.getCell(index + 1);
      if (col.header && typeof col.header === 'string') {
        cell.value = col.header;
      }
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6E6E6' }
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    // 데이터 행 처리 (서명 이미지 포함)
    for (let index = 0; index < submissions.length; index++) {
      const submission = submissions[index];
      const rowIndex = 5 + index; // 헤더 다음부터 시작
      
      // 행 높이를 서명 이미지에 맞게 조정
      const row = worksheet.getRow(rowIndex);
      row.height = 80; // 서명 이미지 표시를 위해 높이 증가

      // 기본 데이터 입력
      row.getCell('no').value = index + 1;
      row.getCell('name').value = submission.name || submission.profiles?.name || '정보없음';
      row.getCell('birthDate').value = submission.birth_date ? 
        new Date(submission.birth_date).toLocaleDateString('ko-KR') : '';
      row.getCell('gender').value = submission.gender === 'male' ? '남' : 
        submission.gender === 'female' ? '여' : submission.gender || '';
      row.getCell('phone').value = submission.phone || '';
      row.getCell('address').value = submission.address || '';
      row.getCell('institution').value = submission.institution || '';
      row.getCell('agreed').value = submission.agreed ? '동의' : '미동의';
      row.getCell('submittedAt').value = new Date(submission.created_at).toLocaleDateString('ko-KR');

      // 동의 여부에 따른 색상 적용
      const agreedCell = row.getCell('agreed');
      if (submission.agreed) {
        agreedCell.font = { color: { argb: 'FF0066CC' }, bold: true };
      } else {
        agreedCell.font = { color: { argb: 'FFCC0000' }, bold: true };
      }

      // 서명 이미지 추가
      if (submission.signature) {
        try {
          let base64Data: string | null = null;
          if (submission.signature.startsWith('data:image/')) {
            // data:image/png;base64,... 형태면 접두사 제거
            base64Data = submission.signature.split(',')[1];
          } else {
            // URL 등 다른 형식이면 base64로 변환
            const dataUrl = await urlToBase64(submission.signature);
            if (dataUrl && dataUrl.startsWith('data:image/')) {
              base64Data = dataUrl.split(',')[1];
            }
          }
          if (base64Data) {
            const imageId = workbook.addImage({
              base64: base64Data,
              extension: 'png',
            });
            worksheet.addImage(imageId, {
              tl: { col: 8, row: rowIndex - 1 }, // I열 (0-based)
              ext: { width: 120, height: 60 },
              editAs: 'oneCell'
            });
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

      // 모든 셀에 테두리 적용
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      });
    }

    // 하단 통계 (빈 행 후)
    const lastDataRow = worksheet.lastRow;
    const statsStartRow = (lastDataRow?.number || 4) + 2;

    worksheet.addRow([]);

    // 통계 헤더
    const statsHeaderRow = worksheet.getRow(statsStartRow);
    statsHeaderRow.getCell(1).value = '통계 항목';
    statsHeaderRow.getCell(2).value = '인원 수';
    
    statsHeaderRow.eachCell((cell, colNumber) => {
      if (colNumber <= 2) {
        cell.font = { bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD9F0FF' }
        };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }
    });

    // 통계 데이터
    const statsData = [
      ['총 인원', `${totalCount}명`],
      ['동의', `${agreedCount}명`],
      ['미동의', `${disagreedCount}명`]
    ];

    statsData.forEach((stat, index) => {
      const row = worksheet.getRow(statsStartRow + 1 + index);
      row.getCell(1).value = stat[0];
      row.getCell(2).value = stat[1];
      
      row.eachCell((cell, colNumber) => {
        if (colNumber <= 2) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD9F0FF' }
          };
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
          if (colNumber === 1) {
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
          } else {
            cell.alignment = { horizontal: 'right', vertical: 'middle' };
          }
        }
      });
    });

    // 파일 저장
    const buffer = await workbook.xlsx.writeBuffer();
    const today = new Date().toISOString().split('T')[0];
    const fileName = `동의서현황_${programTitle}_${today}.xlsx`;
    
    saveAs(new Blob([buffer]), fileName);
  } catch (error) {
    console.error('엑셀 내보내기 오류:', error);
    throw error;
  }
};