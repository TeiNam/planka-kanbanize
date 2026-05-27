import ExcelJS from 'exceljs';

const HEADER = [
  '카드 ID',
  '제목',
  '컬럼',
  '컬럼 유형',
  '스윔레인',
  '담당자',
  '라벨',
  '우선순위',
  '시작일',
  '마감일',
  '완료일',
  '생성일',
];

const formatDate = (value) => {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

const sanitizeSheetName = (name) => {
  const fallback = 'Board';
  if (!name) return fallback;
  return (
    name
      .replace(/[\\/?*[\]:]/g, ' ')
      .trim()
      .slice(0, 31) || fallback
  );
};

const exportBoardToExcel = async (board, lists, swimLanes, cards) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Planka';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(sanitizeSheetName(board && board.name));

  sheet.columns = [
    { header: HEADER[0], key: 'id', width: 22 },
    { header: HEADER[1], key: 'name', width: 40 },
    { header: HEADER[2], key: 'list', width: 18 },
    { header: HEADER[3], key: 'listType', width: 12 },
    { header: HEADER[4], key: 'swimLane', width: 16 },
    { header: HEADER[5], key: 'members', width: 24 },
    { header: HEADER[6], key: 'labels', width: 24 },
    { header: HEADER[7], key: 'priority', width: 10 },
    { header: HEADER[8], key: 'startDate', width: 12 },
    { header: HEADER[9], key: 'dueDate', width: 12 },
    { header: HEADER[10], key: 'completedAt', width: 12 },
    { header: HEADER[11], key: 'createdAt', width: 12 },
  ];

  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).alignment = { vertical: 'middle' };

  const listById = new Map(lists.map((l) => [l.id, l]));
  const laneById = new Map(swimLanes.map((s) => [s.id, s]));

  cards.forEach((card) => {
    const list = listById.get(card.listId) || null;
    const lane = card.swimLaneId ? laneById.get(card.swimLaneId) : null;

    sheet.addRow({
      id: card.id,
      name: card.name || '',
      list: list ? list.name || list.type : '',
      listType: list ? list.type : '',
      swimLane: lane ? lane.name : '',
      members: (card.members || []).join(', '),
      labels: (card.labels || []).join(', '),
      priority: card.priority || '',
      startDate: formatDate(card.startDate),
      dueDate: formatDate(card.dueDate),
      completedAt: formatDate(card.completedAt),
      createdAt: formatDate(card.createdAt),
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);

  const datePart = new Date().toISOString().slice(0, 10);
  const baseName = (board && board.name ? board.name : 'board').replace(/[\\/:*?"<>|]/g, '_');
  const filename = `${baseName}_${datePart}.xlsx`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export default exportBoardToExcel;
