/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

/**
 * generate-daily-snapshot.js
 *
 * @description :: 매일 자정(UTC) 실행되는 스케줄러 헬퍼.
 *                 모든 활성 보드의 컬럼별 카드 수를 board_daily_snapshot에 기록한다.
 *                 동일 날짜에 이미 스냅샷이 존재하면 card_count를 업데이트한다.
 */

module.exports = {
  inputs: {},

  async fn() {
    const today = new Date().toISOString().split('T')[0];

    // 모든 보드 조회
    const boards = await Board.find({});

    // 보드별로 독립적으로 처리 (한 보드 실패가 다른 보드에 영향 주지 않음)
    await Promise.allSettled(
      boards.map(async (board) => {
        try {
          // 해당 보드의 칸반 리스트 조회 (백로그/태스크/완료/디스카드, 서브컬럼 제외)
          const lists = await List.find({
            boardId: board.id,
            type: List.KANBAN_TYPES,
            parentListId: null,
          });

          // 각 리스트별 카드 수 기록
          await Promise.all(
            lists.map(async (list) => {
              // position이 null이 아닌 카드만 카운트 (활성 카드)
              const cardCount = await Card.count({
                listId: list.id,
                position: { '!=': null },
              });

              // 기존 스냅샷 확인 (upsert 로직)
              const existingSnapshot = await BoardDailySnapshot.qm.getOneByBoardIdAndListIdAndDate(
                board.id,
                list.id,
                today,
              );

              if (existingSnapshot) {
                // 이미 존재하면 card_count 업데이트
                await BoardDailySnapshot.qm.updateOne({ id: existingSnapshot.id }, { cardCount });
              } else {
                // 새 스냅샷 생성
                await BoardDailySnapshot.qm.createOne({
                  boardId: board.id,
                  listId: list.id,
                  cardCount,
                  snapshotDate: today,
                });
              }
            }),
          );
        } catch (error) {
          sails.log.error(
            `[generate-daily-snapshot] 보드 ${board.id} 스냅샷 생성 실패:`,
            error.message,
          );
        }
      }),
    );

    sails.log.info(`[generate-daily-snapshot] 일별 스냅샷 생성 완료: ${today}`);
  },
};
