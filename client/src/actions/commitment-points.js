/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import ActionTypes from '../constants/ActionTypes';

const createCommitmentPoint = (commitmentPoint) => ({
  type: ActionTypes.COMMITMENT_POINT_CREATE,
  payload: {
    commitmentPoint,
  },
});

createCommitmentPoint.success = (localId, commitmentPoint) => ({
  type: ActionTypes.COMMITMENT_POINT_CREATE__SUCCESS,
  payload: {
    localId,
    commitmentPoint,
  },
});

createCommitmentPoint.failure = (localId, error) => ({
  type: ActionTypes.COMMITMENT_POINT_CREATE__FAILURE,
  payload: {
    localId,
    error,
  },
});

const handleCommitmentPointCreate = (commitmentPoint) => ({
  type: ActionTypes.COMMITMENT_POINT_CREATE_HANDLE,
  payload: {
    commitmentPoint,
  },
});

const updateCommitmentPoint = (id, data) => ({
  type: ActionTypes.COMMITMENT_POINT_UPDATE,
  payload: {
    id,
    data,
  },
});

updateCommitmentPoint.success = (commitmentPoint) => ({
  type: ActionTypes.COMMITMENT_POINT_UPDATE__SUCCESS,
  payload: {
    commitmentPoint,
  },
});

updateCommitmentPoint.failure = (id, error) => ({
  type: ActionTypes.COMMITMENT_POINT_UPDATE__FAILURE,
  payload: {
    id,
    error,
  },
});

const handleCommitmentPointUpdate = (commitmentPoint) => ({
  type: ActionTypes.COMMITMENT_POINT_UPDATE_HANDLE,
  payload: {
    commitmentPoint,
  },
});

const deleteCommitmentPoint = (id) => ({
  type: ActionTypes.COMMITMENT_POINT_DELETE,
  payload: {
    id,
  },
});

deleteCommitmentPoint.success = (commitmentPoint) => ({
  type: ActionTypes.COMMITMENT_POINT_DELETE__SUCCESS,
  payload: {
    commitmentPoint,
  },
});

deleteCommitmentPoint.failure = (id, error) => ({
  type: ActionTypes.COMMITMENT_POINT_DELETE__FAILURE,
  payload: {
    id,
    error,
  },
});

const handleCommitmentPointDelete = (commitmentPoint) => ({
  type: ActionTypes.COMMITMENT_POINT_DELETE_HANDLE,
  payload: {
    commitmentPoint,
  },
});

export default {
  createCommitmentPoint,
  handleCommitmentPointCreate,
  updateCommitmentPoint,
  handleCommitmentPointUpdate,
  deleteCommitmentPoint,
  handleCommitmentPointDelete,
};
