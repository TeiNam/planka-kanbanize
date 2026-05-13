/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import EntryActionTypes from '../constants/EntryActionTypes';

const createCommitmentPointInCurrentBoard = (data) => ({
  type: EntryActionTypes.COMMITMENT_POINT_IN_CURRENT_BOARD_CREATE,
  payload: {
    data,
  },
});

const handleCommitmentPointCreate = (commitmentPoint) => ({
  type: EntryActionTypes.COMMITMENT_POINT_CREATE_HANDLE,
  payload: {
    commitmentPoint,
  },
});

const updateCommitmentPoint = (id, data) => ({
  type: EntryActionTypes.COMMITMENT_POINT_UPDATE,
  payload: {
    id,
    data,
  },
});

const handleCommitmentPointUpdate = (commitmentPoint) => ({
  type: EntryActionTypes.COMMITMENT_POINT_UPDATE_HANDLE,
  payload: {
    commitmentPoint,
  },
});

const deleteCommitmentPoint = (id) => ({
  type: EntryActionTypes.COMMITMENT_POINT_DELETE,
  payload: {
    id,
  },
});

const handleCommitmentPointDelete = (commitmentPoint) => ({
  type: EntryActionTypes.COMMITMENT_POINT_DELETE_HANDLE,
  payload: {
    commitmentPoint,
  },
});

export default {
  createCommitmentPointInCurrentBoard,
  handleCommitmentPointCreate,
  updateCommitmentPoint,
  handleCommitmentPointUpdate,
  deleteCommitmentPoint,
  handleCommitmentPointDelete,
};
