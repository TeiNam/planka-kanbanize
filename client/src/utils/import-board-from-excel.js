/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import ExcelJS from 'exceljs';

// export-board-to-excel.js 와 동일한 헤더 → 내부 키 매핑
const HEADER_TO_KEY = {
  '카드 ID': 'id',
  제목: 'name',
  컬럼: 'list',
  '컬럼 유형': 'listType',
  스윔레인: 'swimLane',
  담당자: 'members',
  라벨: 'labels',
  우선순위: 'priority',
  시작일: 'startDate',
  마감일: 'dueDate',
  완료일: 'completedAt',
  생성일: 'createdAt',
};

// ExcelJS 셀 값(문자열/숫자/날짜/리치텍스트/하이퍼링크/수식)을 안전하게 문자열로 변환
const readCellText = (value) => {
  if (value === null || value === undefined) {
    return '';
  }
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === 'object') {
    if (Array.isArray(value.richText)) {
      return value.richText
        .map((part) => part.text)
        .join('')
        .trim();
    }
    if (value.text !== undefined) {
      return String(value.text).trim();
    }
    if (value.result !== undefined) {
      return String(value.result).trim();
    }
    return '';
  }
  return String(value).trim();
};

// 'YYYY-MM-DD'(또는 파싱 가능한 날짜) → UTC 자정 Date. 형식이 안 맞으면 null.
const parseDueDate = (text) => {
  if (!text) {
    return null;
  }
  const isoDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(text);
  const date = new Date(isoDateOnly ? `${text}T00:00:00.000Z` : text);
  return Number.isNaN(date.getTime()) ? null : date;
};

// 업로드한 .xlsx 파일을 읽어 행 단위로 파싱한다.
// 반환: { rows: [{ name, listName, listType, swimLaneName, dueDate }], skipped }
// - 제목(name)이 없는데 다른 값이 있는 행은 skipped 로 집계 (완전 빈 행은 무시)
const importBoardFromExcel = async (file) => {
  const workbook = new ExcelJS.Workbook();
  const arrayBuffer = await file.arrayBuffer();
  await workbook.xlsx.load(arrayBuffer);

  const sheet = workbook.worksheets[0];
  if (!sheet) {
    return { rows: [], skipped: 0 };
  }

  // 1행을 헤더로 읽어 컬럼 번호 → 내부 키 매핑
  const keyByColumn = {};
  sheet.getRow(1).eachCell((cell, colNumber) => {
    const key = HEADER_TO_KEY[readCellText(cell.value)];
    if (key) {
      keyByColumn[colNumber] = key;
    }
  });

  const rows = [];
  let skipped = 0;

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      return;
    }

    const record = {};
    Object.entries(keyByColumn).forEach(([colNumber, key]) => {
      record[key] = readCellText(row.getCell(Number(colNumber)).value);
    });

    const name = (record.name || '').trim();
    if (!name) {
      // 제목은 없지만 다른 칸에 값이 있는 행만 "건너뜀"으로 집계
      if (Object.values(record).some((value) => value && value.trim())) {
        skipped += 1;
      }
      return;
    }

    rows.push({
      name,
      listName: (record.list || '').trim(),
      listType: (record.listType || '').trim(),
      swimLaneName: (record.swimLane || '').trim(),
      dueDate: parseDueDate((record.dueDate || '').trim()),
    });
  });

  return { rows, skipped };
};

export default importBoardFromExcel;
