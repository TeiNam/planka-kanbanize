/*!
 * 스윔레인 액션 크리에이터 단위 테스트
 * 각 액션 크리에이터가 올바른 액션 객체를 생성하는지 검증
 */

import swimLaneActions from '../../actions/swim-lanes';
import ActionTypes from '../../constants/ActionTypes';

describe('swim-lanes action creators', () => {
  describe('createSwimLane', () => {
    it('SWIM_LANE_CREATE 액션을 생성해야 함', () => {
      const swimLane = {
        name: 'Feature Development',
        boardId: 'board-1',
        type: 'standard',
        wipLimit: 5,
        position: 65536,
      };

      const action = swimLaneActions.createSwimLane(swimLane);

      expect(action).toEqual({
        type: ActionTypes.SWIM_LANE_CREATE,
        payload: { swimLane },
      });
    });

    it('createSwimLane.success가 올바른 액션을 생성해야 함', () => {
      const localId = 'local:1234-0000';
      const swimLane = { id: 'sl-1', name: 'Lane', boardId: 'board-1' };

      const action = swimLaneActions.createSwimLane.success(localId, swimLane);

      expect(action).toEqual({
        type: ActionTypes.SWIM_LANE_CREATE__SUCCESS,
        payload: { localId, swimLane },
      });
    });

    it('createSwimLane.failure가 올바른 액션을 생성해야 함', () => {
      const localId = 'local:1234-0000';
      const error = new Error('Network error');

      const action = swimLaneActions.createSwimLane.failure(localId, error);

      expect(action).toEqual({
        type: ActionTypes.SWIM_LANE_CREATE__FAILURE,
        payload: { localId, error },
      });
    });
  });

  describe('handleSwimLaneCreate', () => {
    it('SWIM_LANE_CREATE_HANDLE 액션을 생성해야 함', () => {
      const swimLane = { id: 'sl-1', name: 'Lane', boardId: 'board-1' };

      const action = swimLaneActions.handleSwimLaneCreate(swimLane);

      expect(action).toEqual({
        type: ActionTypes.SWIM_LANE_CREATE_HANDLE,
        payload: { swimLane },
      });
    });
  });

  describe('updateSwimLane', () => {
    it('SWIM_LANE_UPDATE 액션을 생성해야 함', () => {
      const id = 'sl-1';
      const data = { name: 'Updated Lane', wipLimit: 10 };

      const action = swimLaneActions.updateSwimLane(id, data);

      expect(action).toEqual({
        type: ActionTypes.SWIM_LANE_UPDATE,
        payload: { id, data },
      });
    });

    it('updateSwimLane.success가 올바른 액션을 생성해야 함', () => {
      const swimLane = { id: 'sl-1', name: 'Updated Lane', wipLimit: 10 };

      const action = swimLaneActions.updateSwimLane.success(swimLane);

      expect(action).toEqual({
        type: ActionTypes.SWIM_LANE_UPDATE__SUCCESS,
        payload: { swimLane },
      });
    });

    it('updateSwimLane.failure가 올바른 액션을 생성해야 함', () => {
      const id = 'sl-1';
      const error = new Error('Validation error');

      const action = swimLaneActions.updateSwimLane.failure(id, error);

      expect(action).toEqual({
        type: ActionTypes.SWIM_LANE_UPDATE__FAILURE,
        payload: { id, error },
      });
    });
  });

  describe('handleSwimLaneUpdate', () => {
    it('SWIM_LANE_UPDATE_HANDLE 액션을 생성해야 함', () => {
      const swimLane = { id: 'sl-1', name: 'Updated', wipLimit: 3 };

      const action = swimLaneActions.handleSwimLaneUpdate(swimLane);

      expect(action).toEqual({
        type: ActionTypes.SWIM_LANE_UPDATE_HANDLE,
        payload: { swimLane },
      });
    });
  });

  describe('sortSwimLanes', () => {
    it('SWIM_LANE_SORT 액션을 생성해야 함', () => {
      const id = 'sl-1';
      const data = { position: 200 };

      const action = swimLaneActions.sortSwimLanes(id, data);

      expect(action).toEqual({
        type: ActionTypes.SWIM_LANE_SORT,
        payload: { id, data },
      });
    });

    it('sortSwimLanes.success가 올바른 액션을 생성해야 함', () => {
      const swimLanes = [
        { id: 'sl-1', position: 100 },
        { id: 'sl-2', position: 200 },
      ];

      const action = swimLaneActions.sortSwimLanes.success(swimLanes);

      expect(action).toEqual({
        type: ActionTypes.SWIM_LANE_SORT__SUCCESS,
        payload: { swimLanes },
      });
    });

    it('sortSwimLanes.failure가 올바른 액션을 생성해야 함', () => {
      const id = 'sl-1';
      const error = new Error('Sort failed');

      const action = swimLaneActions.sortSwimLanes.failure(id, error);

      expect(action).toEqual({
        type: ActionTypes.SWIM_LANE_SORT__FAILURE,
        payload: { id, error },
      });
    });
  });

  describe('deleteSwimLane', () => {
    it('SWIM_LANE_DELETE 액션을 생성해야 함', () => {
      const id = 'sl-1';

      const action = swimLaneActions.deleteSwimLane(id);

      expect(action).toEqual({
        type: ActionTypes.SWIM_LANE_DELETE,
        payload: { id },
      });
    });

    it('deleteSwimLane.success가 올바른 액션을 생성해야 함', () => {
      const swimLane = { id: 'sl-1' };

      const action = swimLaneActions.deleteSwimLane.success(swimLane);

      expect(action).toEqual({
        type: ActionTypes.SWIM_LANE_DELETE__SUCCESS,
        payload: { swimLane },
      });
    });

    it('deleteSwimLane.failure가 올바른 액션을 생성해야 함', () => {
      const id = 'sl-1';
      const error = new Error('Delete failed');

      const action = swimLaneActions.deleteSwimLane.failure(id, error);

      expect(action).toEqual({
        type: ActionTypes.SWIM_LANE_DELETE__FAILURE,
        payload: { id, error },
      });
    });
  });

  describe('handleSwimLaneDelete', () => {
    it('SWIM_LANE_DELETE_HANDLE 액션을 생성해야 함', () => {
      const swimLane = { id: 'sl-1' };

      const action = swimLaneActions.handleSwimLaneDelete(swimLane);

      expect(action).toEqual({
        type: ActionTypes.SWIM_LANE_DELETE_HANDLE,
        payload: { swimLane },
      });
    });
  });
});
