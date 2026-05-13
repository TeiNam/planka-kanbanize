/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

/**
 * 보드에 기본 4종 서비스 클래스를 초기화하는 헬퍼
 * Expedite (빨간색), Fixed_Date (주황색), Standard (파란색), Intangible (회색)
 */

const DEFAULTS = [
  {
    name: 'Expedite',
    type: 'expedite',
    color: 'berry-red',
    position: 65536,
  },
  {
    name: 'Fixed Date',
    type: 'fixed_date',
    color: 'pumpkin-orange',
    position: 131072,
  },
  {
    name: 'Standard',
    type: 'standard',
    color: 'lagoon-blue',
    position: 196608,
  },
  {
    name: 'Intangible',
    type: 'intangible',
    color: 'muddy-grey',
    position: 262144,
  },
];

module.exports = {
  inputs: {
    board: {
      type: 'ref',
      required: true,
    },
  },

  async fn(inputs) {
    const classesOfService = [];

    // eslint-disable-next-line no-restricted-syntax
    for (const defaultClass of DEFAULTS) {
      // eslint-disable-next-line no-await-in-loop
      const classOfService = await ClassOfService.qm.createOne({
        ...defaultClass,
        isDefault: true,
        boardId: inputs.board.id,
      });

      classesOfService.push(classOfService);
    }

    return classesOfService;
  },
};
