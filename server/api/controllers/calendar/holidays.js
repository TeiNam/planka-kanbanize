/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

const { idInput } = require('../../../utils/inputs');

const Errors = {
  PROJECT_NOT_FOUND: {
    projectNotFound: 'Project not found',
  },
};

module.exports = {
  inputs: {
    projectId: {
      ...idInput,
      required: true,
    },
    year: {
      type: 'number',
      isInteger: true,
      min: 1970,
      max: 9999,
      required: true,
    },
    month: {
      type: 'number',
      isInteger: true,
      min: 1,
      max: 12,
      required: true,
    },
  },

  exits: {
    projectNotFound: {
      responseType: 'notFound',
    },
  },

  async fn(inputs) {
    const { currentUser } = this.req;

    // 경로/리소스 조회: 프로젝트가 없으면 not-found (처리 순서: 검증 → 조회 → 멤버십)
    const project = await Project.qm.getOneById(inputs.projectId);

    if (!project) {
      throw Errors.PROJECT_NOT_FOUND;
    }

    // 접근 제어: 프로젝트 관리자이거나 프로젝트 내 보드 멤버십 보유. 비멤버는 거부(notFound).
    const isProjectManager = await sails.helpers.users.isProjectManager(currentUser.id, project.id);

    if (!isProjectManager) {
      const boardMemberships = await BoardMembership.qm.getByProjectIdAndUserId(
        project.id,
        currentUser.id,
      );

      if (boardMemberships.length === 0) {
        throw Errors.PROJECT_NOT_FOUND;
      }
    }

    // 외부 호출 대상은 project 에 저장된 endpoint 로만 한정 (SSRF 경계).
    // 클라이언트는 endpoint 를 전달하지 않으며 서버가 project 레코드에서 직접 읽는다.
    const holidays = await sails.helpers.calendar.fetchHolidays.with({
      endpoint: project.holidayApiEndpoint,
      year: inputs.year,
      month: inputs.month,
    });

    return {
      items: holidays,
    };
  },
};
