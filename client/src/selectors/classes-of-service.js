/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import { createSelector } from 'redux-orm';

import orm from '../orm';
import { isLocalId } from '../utils/local-id';

// 보드별 전체 서비스 클래스 목록 (position 정렬)
export const makeSelectClassesOfServiceByBoardId = () =>
  createSelector(
    orm,
    (_, id) => id,
    ({ Board }, id) => {
      if (!id) {
        return id;
      }

      const boardModel = Board.withId(id);

      if (!boardModel) {
        return boardModel;
      }

      return boardModel.classesOfService
        .orderBy('position')
        .toRefArray()
        .map((classOfService) => ({
          ...classOfService,
          isPersisted: !isLocalId(classOfService.id),
        }));
    },
  );

export const selectClassesOfServiceByBoardId = makeSelectClassesOfServiceByBoardId();

// 보드별 기본 서비스 클래스 (isDefault === true)
export const makeSelectDefaultClassesOfService = () =>
  createSelector(
    orm,
    (_, id) => id,
    ({ Board }, id) => {
      if (!id) {
        return id;
      }

      const boardModel = Board.withId(id);

      if (!boardModel) {
        return boardModel;
      }

      return boardModel.classesOfService
        .filter({ isDefault: true })
        .orderBy('position')
        .toRefArray();
    },
  );

export const selectDefaultClassesOfService = makeSelectDefaultClassesOfService();

// 보드별 사용자 정의 서비스 클래스 (isDefault === false)
export const makeSelectCustomClassesOfService = () =>
  createSelector(
    orm,
    (_, id) => id,
    ({ Board }, id) => {
      if (!id) {
        return id;
      }

      const boardModel = Board.withId(id);

      if (!boardModel) {
        return boardModel;
      }

      return boardModel.classesOfService
        .filter({ isDefault: false })
        .orderBy('position')
        .toRefArray();
    },
  );

export const selectCustomClassesOfService = makeSelectCustomClassesOfService();

// ID로 단일 서비스 클래스 조회
export const makeSelectClassOfServiceById = () =>
  createSelector(
    orm,
    (_, id) => id,
    ({ ClassOfService }, id) => {
      if (!id) {
        return null;
      }

      const cosModel = ClassOfService.withId(id);

      if (!cosModel) {
        return null;
      }

      return cosModel.ref;
    },
  );

export const selectClassOfServiceById = makeSelectClassOfServiceById();

export default {
  makeSelectClassesOfServiceByBoardId,
  selectClassesOfServiceByBoardId,
  makeSelectDefaultClassesOfService,
  selectDefaultClassesOfService,
  makeSelectCustomClassesOfService,
  selectCustomClassesOfService,
  makeSelectClassOfServiceById,
  selectClassOfServiceById,
};
