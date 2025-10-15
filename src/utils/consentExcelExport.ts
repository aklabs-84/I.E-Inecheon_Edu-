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

    // 개별 동의서 시트 생성
    for (let index = 0; index < submissions.length; index++) {
      const submission = submissions[index];
      const personName = submission.name || submission.profiles?.name || `사용자${index + 1}`;
      const sheetName = `${personName}_동의서`;
      
      try {
        const personalSheet = workbook.addWorksheet(sheetName);
        await createIndividualConsentSheet(personalSheet, submission, programTitle, consentTitle);
      } catch (error) {
        console.error(`개별 시트 생성 실패 (${personName}):`, error);
        // 시트 이름이 중복되거나 문제가 있을 경우 번호 추가
        const fallbackSheetName = `동의서_${index + 1}`;
        const personalSheet = workbook.addWorksheet(fallbackSheetName);
        await createIndividualConsentSheet(personalSheet, submission, programTitle, consentTitle);
      }
    }

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

// 개별 동의서 시트 생성 함수
const createIndividualConsentSheet = async (
  worksheet: ExcelJS.Worksheet, 
  submission: ConsentSubmissionWithProfile, 
  programTitle: string, 
  consentTitle: string
) => {
  // 페이지 설정
  worksheet.pageSetup = {
    paperSize: 9, // A4
    orientation: 'portrait',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    margins: { left: 0.7, right: 0.7, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 }
  };

  // A4에 맞게 컬럼 너비 설정 (총 8개 컬럼)
  worksheet.columns = [
    { width: 8 },   // A - 라벨용
    { width: 12 },  // B - 값용
    { width: 8 },   // C - 라벨용
    { width: 15 },  // D - 값용
    { width: 8 },   // E - 라벨용
    { width: 12 },  // F - 값용
    { width: 8 },   // G - 라벨용
    { width: 15 }   // H - 값용
  ];

  let currentRow = 1;

  // 제목
  worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
  const titleCell = worksheet.getCell(`A${currentRow}`);
  titleCell.value = '개인정보 수집·이용 동의서';
  titleCell.font = { name: '맑은 고딕', size: 18, bold: true };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6E6FA' } };
  worksheet.getRow(currentRow).height = 35;
  currentRow += 2;

  // 프로그램명
  worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
  const programCell = worksheet.getCell(`A${currentRow}`);
  programCell.value = `프로그램: ${programTitle}`;
  programCell.font = { name: '맑은 고딕', size: 12, bold: true };
  programCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(currentRow).height = 25;
  currentRow += 2;

  // 개인정보 섹션 헤더
  worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
  const personalInfoHeader = worksheet.getCell(`A${currentRow}`);
  personalInfoHeader.value = '개인정보';
  personalInfoHeader.font = { name: '맑은 고딕', size: 14, bold: true };
  personalInfoHeader.alignment = { horizontal: 'center', vertical: 'middle' };
  personalInfoHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9EDF7' } };
  personalInfoHeader.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
  worksheet.getRow(currentRow).height = 25;
  currentRow++;

  // 성명과 생년월일 (한 줄에 표시)
  // 성명
  const nameCell = worksheet.getCell(`A${currentRow}`);
  nameCell.value = '성명';
  nameCell.font = { name: '맑은 고딕', size: 11, bold: true };
  nameCell.alignment = { horizontal: 'center', vertical: 'middle' };
  nameCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } };
  nameCell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };

  const nameValueCell = worksheet.getCell(`B${currentRow}`);
  nameValueCell.value = submission.name || submission.profiles?.name || '';
  nameValueCell.font = { name: '맑은 고딕', size: 11 };
  nameValueCell.alignment = { horizontal: 'left', vertical: 'middle' };
  nameValueCell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };

  // 생년월일
  const birthCell = worksheet.getCell(`C${currentRow}`);
  birthCell.value = '생년월일';
  birthCell.font = { name: '맑은 고딕', size: 11, bold: true };
  birthCell.alignment = { horizontal: 'center', vertical: 'middle' };
  birthCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } };
  birthCell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };

  worksheet.mergeCells(`D${currentRow}:H${currentRow}`);
  const birthValueCell = worksheet.getCell(`D${currentRow}`);
  birthValueCell.value = submission.birth_date || '';
  birthValueCell.font = { name: '맑은 고딕', size: 11 };
  birthValueCell.alignment = { horizontal: 'left', vertical: 'middle' };
  birthValueCell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };

  worksheet.getRow(currentRow).height = 25;
  currentRow++;

  // 성별과 연락처 (한 줄에 표시)
  // 성별
  const genderCell = worksheet.getCell(`A${currentRow}`);
  genderCell.value = '성별';
  genderCell.font = { name: '맑은 고딕', size: 11, bold: true };
  genderCell.alignment = { horizontal: 'center', vertical: 'middle' };
  genderCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } };
  genderCell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };

  const genderValueCell = worksheet.getCell(`B${currentRow}`);
  genderValueCell.value = submission.gender === 'male' ? '남' : submission.gender === 'female' ? '여' : '';
  genderValueCell.font = { name: '맑은 고딕', size: 11 };
  genderValueCell.alignment = { horizontal: 'left', vertical: 'middle' };
  genderValueCell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };

  // 연락처
  const phoneCell = worksheet.getCell(`C${currentRow}`);
  phoneCell.value = '연락처';
  phoneCell.font = { name: '맑은 고딕', size: 11, bold: true };
  phoneCell.alignment = { horizontal: 'center', vertical: 'middle' };
  phoneCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } };
  phoneCell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };

  worksheet.mergeCells(`D${currentRow}:H${currentRow}`);
  const phoneValueCell = worksheet.getCell(`D${currentRow}`);
  phoneValueCell.value = submission.phone || '';
  phoneValueCell.font = { name: '맑은 고딕', size: 11 };
  phoneValueCell.alignment = { horizontal: 'left', vertical: 'middle' };
  phoneValueCell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };

  worksheet.getRow(currentRow).height = 25;
  currentRow++;

  // 주소
  const addressLabel = worksheet.getCell(`A${currentRow}`);
  addressLabel.value = '주소';
  addressLabel.font = { name: '맑은 고딕', size: 11, bold: true };
  addressLabel.alignment = { horizontal: 'center', vertical: 'middle' };
  addressLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } };
  addressLabel.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };

  worksheet.mergeCells(`B${currentRow}:H${currentRow}`);
  const addressValue = worksheet.getCell(`B${currentRow}`);
  addressValue.value = submission.address || '';
  addressValue.font = { name: '맑은 고딕', size: 11 };
  addressValue.alignment = { horizontal: 'left', vertical: 'middle' };
  addressValue.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
  worksheet.getRow(currentRow).height = 25;
  currentRow++;

  // 소속기관
  const institutionLabel = worksheet.getCell(`A${currentRow}`);
  institutionLabel.value = '소속기관';
  institutionLabel.font = { name: '맑은 고딕', size: 11, bold: true };
  institutionLabel.alignment = { horizontal: 'center', vertical: 'middle' };
  institutionLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } };
  institutionLabel.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };

  worksheet.mergeCells(`B${currentRow}:H${currentRow}`);
  const institutionValue = worksheet.getCell(`B${currentRow}`);
  institutionValue.value = submission.institution || '';
  institutionValue.font = { name: '맑은 고딕', size: 11 };
  institutionValue.alignment = { horizontal: 'left', vertical: 'middle' };
  institutionValue.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
  worksheet.getRow(currentRow).height = 25;
  currentRow += 2;

  // 동의 내용 섹션
  worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
  const consentHeader = worksheet.getCell(`A${currentRow}`);
  consentHeader.value = '동의 내용';
  consentHeader.font = { name: '맑은 고딕', size: 14, bold: true };
  consentHeader.alignment = { horizontal: 'center', vertical: 'middle' };
  consentHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9EDF7' } };
  consentHeader.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
  worksheet.getRow(currentRow).height = 25;
  currentRow++;

  // 동의서 제목
  worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
  const consentTitleCell = worksheet.getCell(`A${currentRow}`);
  consentTitleCell.value = consentTitle;
  consentTitleCell.font = { name: '맑은 고딕', size: 12, bold: true };
  consentTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  consentTitleCell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
  worksheet.getRow(currentRow).height = 25;
  currentRow++;

  // 개인정보 수집 및 활용 안내 섹션
  worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
  const infoHeader = worksheet.getCell(`A${currentRow}`);
  infoHeader.value = '개인정보 수집 및 활용 안내';
  infoHeader.font = { name: '맑은 고딕', size: 11, bold: true };
  infoHeader.alignment = { horizontal: 'left', vertical: 'middle' };
  infoHeader.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
  worksheet.getRow(currentRow).height = 25;
  currentRow++;

  // 수집 목적
  const purposeLabel = worksheet.getCell(`A${currentRow}`);
  purposeLabel.value = '수집 목적:';
  purposeLabel.font = { name: '맑은 고딕', size: 11, bold: true };
  purposeLabel.alignment = { horizontal: 'center', vertical: 'middle' };
  purposeLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } };
  purposeLabel.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };

  worksheet.mergeCells(`B${currentRow}:H${currentRow}`);
  const purposeValue = worksheet.getCell(`B${currentRow}`);
  purposeValue.value = '프로그램 참여자 관리 및 서비스 제공';
  purposeValue.font = { name: '맑은 고딕', size: 11 };
  purposeValue.alignment = { horizontal: 'left', vertical: 'middle' };
  purposeValue.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
  worksheet.getRow(currentRow).height = 25;
  currentRow++;

  // 수집 항목
  const itemLabel = worksheet.getCell(`A${currentRow}`);
  itemLabel.value = '수집 항목:';
  itemLabel.font = { name: '맑은 고딕', size: 11, bold: true };
  itemLabel.alignment = { horizontal: 'center', vertical: 'middle' };
  itemLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } };
  itemLabel.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };

  worksheet.mergeCells(`B${currentRow}:H${currentRow}`);
  const itemValue = worksheet.getCell(`B${currentRow}`);
  itemValue.value = '성명, 생년월일, 성별, 휴대폰 번호, 거주동명, 학교/기관';
  itemValue.font = { name: '맑은 고딕', size: 11 };
  itemValue.alignment = { horizontal: 'left', vertical: 'middle' };
  itemValue.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
  worksheet.getRow(currentRow).height = 25;
  currentRow++;

  // 보유 기간
  const periodLabel = worksheet.getCell(`A${currentRow}`);
  periodLabel.value = '보유 기간:';
  periodLabel.font = { name: '맑은 고딕', size: 11, bold: true };
  periodLabel.alignment = { horizontal: 'center', vertical: 'middle' };
  periodLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } };
  periodLabel.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };

  worksheet.mergeCells(`B${currentRow}:H${currentRow}`);
  const periodValue = worksheet.getCell(`B${currentRow}`);
  periodValue.value = '프로그램 종료 후 1년';
  periodValue.font = { name: '맑은 고딕', size: 11 };
  periodValue.alignment = { horizontal: 'left', vertical: 'middle' };
  periodValue.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
  worksheet.getRow(currentRow).height = 25;
  currentRow++;

  // 동의 거부권
  worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
  const refusalRightCell = worksheet.getCell(`A${currentRow}`);
  refusalRightCell.value = '동의 거부권: 개인정보 수집에 동의하지 않을 권리가 있으며, 동의 거부 시 프로그램 참가 제한될 수 있습니다.';
  refusalRightCell.font = { name: '맑은 고딕', size: 10 };
  refusalRightCell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
  refusalRightCell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
  worksheet.getRow(currentRow).height = 30;
  currentRow += 2;

  // 동의 여부 체크박스 형태
  // 첫 번째 동의 옵션
  const agreeEmptyCell1 = worksheet.getCell(`A${currentRow}`);
  agreeEmptyCell1.value = '';
  agreeEmptyCell1.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };

  worksheet.mergeCells(`B${currentRow}:G${currentRow}`);
  const agreeText1 = worksheet.getCell(`B${currentRow}`);
  agreeText1.value = '개인정보 수집 및 활용에 동의합니다.';
  agreeText1.font = { name: '맑은 고딕', size: 11 };
  agreeText1.alignment = { horizontal: 'left', vertical: 'middle' };
  agreeText1.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };

  const agreeCheckBox1 = worksheet.getCell(`H${currentRow}`);
  agreeCheckBox1.value = submission.agreed ? '☑' : '☐';
  agreeCheckBox1.font = { name: '맑은 고딕', size: 14, bold: true };
  agreeCheckBox1.alignment = { horizontal: 'center', vertical: 'middle' };
  agreeCheckBox1.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
  
  // 동의 시 색상 적용
  if (submission.agreed) {
    agreeCheckBox1.font = { name: '맑은 고딕', size: 14, bold: true, color: { argb: 'FF0066CC' } };
    agreeText1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E8' } };
  }

  worksheet.getRow(currentRow).height = 25;
  currentRow++;

  // 두 번째 미동의 옵션
  const agreeEmptyCell2 = worksheet.getCell(`A${currentRow}`);
  agreeEmptyCell2.value = '';
  agreeEmptyCell2.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };

  worksheet.mergeCells(`B${currentRow}:G${currentRow}`);
  const agreeText2 = worksheet.getCell(`B${currentRow}`);
  agreeText2.value = '개인정보 수집 및 활용에 동의하지 않습니다.';
  agreeText2.font = { name: '맑은 고딕', size: 11 };
  agreeText2.alignment = { horizontal: 'left', vertical: 'middle' };
  agreeText2.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };

  const agreeCheckBox2 = worksheet.getCell(`H${currentRow}`);
  agreeCheckBox2.value = !submission.agreed ? '☑' : '☐';
  agreeCheckBox2.font = { name: '맑은 고딕', size: 14, bold: true };
  agreeCheckBox2.alignment = { horizontal: 'center', vertical: 'middle' };
  agreeCheckBox2.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };

  // 미동의 시 색상 적용
  if (!submission.agreed) {
    agreeCheckBox2.font = { name: '맑은 고딕', size: 14, bold: true, color: { argb: 'FFCC0000' } };
    agreeText2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEAEA' } };
  }

  worksheet.getRow(currentRow).height = 25;
  currentRow += 2;

  // 서명 섹션
  worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
  const signatureHeader = worksheet.getCell(`A${currentRow}`);
  signatureHeader.value = '서명';
  signatureHeader.font = { name: '맑은 고딕', size: 14, bold: true };
  signatureHeader.alignment = { horizontal: 'center', vertical: 'middle' };
  signatureHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9EDF7' } };
  signatureHeader.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
  worksheet.getRow(currentRow).height = 25;
  currentRow++;

  // 서명 영역
  worksheet.mergeCells(`A${currentRow}:H${currentRow + 2}`);
  const signatureArea = worksheet.getCell(`A${currentRow}`);
  signatureArea.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
  
  // 서명 이미지 추가
  if (submission.signature) {
    try {
      let base64Data: string | null = null;
      if (submission.signature.startsWith('data:image/')) {
        base64Data = submission.signature.split(',')[1];
      } else {
        const dataUrl = await urlToBase64(submission.signature);
        if (dataUrl && dataUrl.startsWith('data:image/')) {
          base64Data = dataUrl.split(',')[1];
        }
      }
      
      if (base64Data) {
        const imageId = worksheet.workbook.addImage({
          base64: base64Data,
          extension: 'png',
        });
        worksheet.addImage(imageId, {
          tl: { col: 0, row: currentRow - 1 },
          ext: { width: 200, height: 80 },
          editAs: 'oneCell'
        });
      } else {
        signatureArea.value = '서명 이미지 로드 실패';
        signatureArea.alignment = { horizontal: 'center', vertical: 'middle' };
      }
    } catch (error) {
      console.error('서명 이미지 처리 실패:', error);
      signatureArea.value = '서명 이미지 처리 실패';
      signatureArea.alignment = { horizontal: 'center', vertical: 'middle' };
    }
  } else {
    signatureArea.value = '서명 없음';
    signatureArea.alignment = { horizontal: 'center', vertical: 'middle' };
  }
  
  worksheet.getRow(currentRow).height = 30;
  worksheet.getRow(currentRow + 1).height = 30;
  worksheet.getRow(currentRow + 2).height = 30;
  currentRow += 4;

  // 제출일시
  worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
  const submitDate = worksheet.getCell(`A${currentRow}`);
  submitDate.value = `제출일시: ${new Date(submission.created_at).toLocaleString('ko-KR')}`;
  submitDate.font = { name: '맑은 고딕', size: 10 };
  submitDate.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(currentRow).height = 20;
};

// 폼 행 추가 헬퍼 함수 (A4 레이아웃에 맞게 수정)
const addFormRow = (worksheet: ExcelJS.Worksheet, row: number, fields: Array<{label: string, value: string, span: number}>) => {
  let currentCol = 1;
  
  fields.forEach(field => {
    if (field.span === 4) {
      // 전체 너비 (4개 컬럼)를 사용하는 경우
      const labelColEnd = currentCol + 1; // A-B (라벨)
      const valueColStart = currentCol + 2; // C부터
      const valueColEnd = currentCol + field.span - 1; // H까지
      
      // 라벨 셀 (A-B)
      worksheet.mergeCells(row, currentCol, row, labelColEnd);
      const labelCell = worksheet.getCell(row, currentCol);
      labelCell.value = field.label;
      labelCell.font = { name: '맑은 고딕', size: 11, bold: true };
      labelCell.alignment = { horizontal: 'center', vertical: 'middle' };
      labelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } };
      labelCell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
      
      // 값 셀 (C-H)
      worksheet.mergeCells(row, valueColStart, row, valueColEnd);
      const valueCell = worksheet.getCell(row, valueColStart);
      valueCell.value = field.value;
      valueCell.font = { name: '맑은 고딕', size: 11 };
      valueCell.alignment = { horizontal: 'left', vertical: 'middle' };
      valueCell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
      
      currentCol = valueColEnd + 1;
    } else if (field.span === 2) {
      // 절반 너비 (2개 컬럼)를 사용하는 경우
      const labelColEnd = currentCol; // 1개 컬럼 (라벨)
      const valueColStart = currentCol + 1; // 다음 컬럼
      const valueColEnd = currentCol + field.span - 1; // 2개 컬럼 총 사용
      
      // 라벨 셀
      const labelCell = worksheet.getCell(row, currentCol);
      labelCell.value = field.label;
      labelCell.font = { name: '맑은 고딕', size: 11, bold: true };
      labelCell.alignment = { horizontal: 'center', vertical: 'middle' };
      labelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } };
      labelCell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
      
      // 값 셀
      const valueCell = worksheet.getCell(row, valueColStart);
      valueCell.value = field.value;
      valueCell.font = { name: '맑은 고딕', size: 11 };
      valueCell.alignment = { horizontal: 'left', vertical: 'middle' };
      valueCell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
      
      currentCol = valueColEnd + 1;
    }
  });
  
  // 사용되지 않은 컬럼들에 빈 셀 테두리 추가
  for (let col = currentCol; col <= 8; col++) {
    const emptyCell = worksheet.getCell(row, col);
    emptyCell.value = '';
    emptyCell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
  }
  
  worksheet.getRow(row).height = 25;
};