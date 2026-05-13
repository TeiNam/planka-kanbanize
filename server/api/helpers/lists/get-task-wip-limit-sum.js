/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/closeplanka/blob/master/LICENSE.md
 */

/**
 * 보드의 task 컬럼들 wipLimit 합계를 계산한다.
 * - parentListId IS NULL (서브컬럼 제외) 인 최상위 task 컬럼만
 * - wipLimit가 null이면 0으로 친다
 *
 * @param {string} boardId
 * @param {Object} [overrides] - 가상 변경을 적용한 합계를 계산하기 위한 옵션
 * @param {string|null} [overrides.excludeListId] - 합계에서 제외할 리스트 id (예: 자기 자신)
 * @param {{ id?, type?, wipLimit?, parentListId? }} [overrides.virtualList] - 합계에 추가/덮어쓸 가상 리스트
 *
 * @returns {Promise<number>}
 */
module.exports = {
  inputs: {
    boardId: {
      type: 'string',
      required: true,
    },
    excludeListId: {
      type: 'string',
      allowNull: true,
    },
    virtualList: {
      type: 'ref',
    },
  },

  async fn(inputs) {
    const lists = await List.qm.getByBoardId(inputs.boardId);

    let sum = 0;
    lists.forEach((list) => {
      if (inputs.excludeListId && list.id === inputs.excludeListId) {
        return;
      }
      if (list.parentListId) {
        return;
      }
      if (list.type !== List.Types.TASK) {
        return;
      }
      sum += Number(list.wipLimit) || 0;
    });

    if (inputs.virtualList) {
      const v = inputs.virtualList;
      const isTopLevel = !v.parentListId;
      const isTask = v.type === List.Types.TASK;
      if (isTopLevel && isTask) {
        sum += Number(v.wipLimit) || 0;
      }
    }

    return sum;
  },
};
