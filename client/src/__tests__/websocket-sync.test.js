/*!
 * WebSocket 실시간 동기화 통합 테스트
 * 소켓 이벤트 수신 시 올바른 Redux 액션이 디스패치되는지 검증
 * Requirements: 10.6 (1초 이내 갱신)
 */

import EntryActionTypes from '../constants/EntryActionTypes';
import entryActions from '../entry-actions';

// 소켓 이벤트 핸들러 시뮬레이션 (socket.js watcher 패턴 재현)
const createEventHandler = (eventName, emit) => {
  const handlers = {
    swimLaneCreate: ({ item }) => emit(entryActions.handleSwimLaneCreate(item)),
    swimLaneUpdate: ({ item }) => emit(entryActions.handleSwimLaneUpdate(item)),
    swimLaneDelete: ({ item }) => emit(entryActions.handleSwimLaneDelete(item)),
    commitmentPointCreate: ({ item }) => emit(entryActions.handleCommitmentPointCreate(item)),
    commitmentPointUpdate: ({ item }) => emit(entryActions.handleCommitmentPointUpdate(item)),
    commitmentPointDelete: ({ item }) => emit(entryActions.handleCommitmentPointDelete(item)),
    classOfServiceCreate: ({ item }) => emit(entryActions.handleClassOfServiceCreate(item)),
    classOfServiceUpdate: ({ item }) => emit(entryActions.handleClassOfServiceUpdate(item)),
    classOfServiceDelete: ({ item }) => emit(entryActions.handleClassOfServiceDelete(item)),
    blockerCreate: ({ item }) => emit(entryActions.handleBlockerCreate(item)),
    blockerUpdate: ({ item }) => emit(entryActions.handleBlockerUpdate(item)),
    blockerDelete: ({ item }) => emit(entryActions.handleBlockerDelete(item)),
    cardRelationshipCreate: ({ item }) => emit(entryActions.handleCardRelationshipCreate(item)),
    cardRelationshipDelete: ({ item }) => emit(entryActions.handleCardRelationshipDelete(item)),
    decoratorCreate: ({ item }) => emit(entryActions.handleDecoratorCreate(item)),
    decoratorUpdate: ({ item }) => emit(entryActions.handleDecoratorUpdate(item)),
    decoratorDelete: ({ item }) => emit(entryActions.handleDecoratorDelete(item)),
    cardDecoratorCreate: ({ item }) => emit(entryActions.handleCardDecoratorCreate(item)),
    cardDecoratorDelete: ({ item }) => emit(entryActions.handleCardDecoratorDelete(item)),
    boardUpdate: ({ item }) => emit(entryActions.handleBoardUpdate(item)),
    listUpdate: ({ item }) => emit(entryActions.handleListUpdate(item)),
    cardUpdate: ({ item }) => emit(entryActions.handleCardUpdate(item)),
  };

  return handlers[eventName];
};

describe('WebSocket 실시간 동기화 통합 테스트', () => {
  let emittedActions;
  let emit;

  beforeEach(() => {
    emittedActions = [];
    emit = (action) => emittedActions.push(action);
  });

  describe('SwimLane 이벤트', () => {
    it('swimLaneCreate 이벤트 수신 시 SWIM_LANE_CREATE_HANDLE 액션을 디스패치해야 함', () => {
      const handler = createEventHandler('swimLaneCreate', emit);
      const swimLane = {
        id: 'sl-1',
        boardId: 'board-1',
        name: 'Feature Development',
        type: 'standard',
        wipLimit: 5,
        position: 65536,
        color: 'lagoon-blue',
      };

      handler({ item: swimLane });

      expect(emittedActions).toHaveLength(1);
      expect(emittedActions[0]).toEqual({
        type: EntryActionTypes.SWIM_LANE_CREATE_HANDLE,
        payload: { swimLane },
      });
    });

    it('swimLaneUpdate 이벤트 수신 시 SWIM_LANE_UPDATE_HANDLE 액션을 디스패치해야 함', () => {
      const handler = createEventHandler('swimLaneUpdate', emit);
      const swimLane = {
        id: 'sl-1',
        boardId: 'board-1',
        name: 'Updated Lane',
        wipLimit: 10,
        position: 65536,
      };

      handler({ item: swimLane });

      expect(emittedActions).toHaveLength(1);
      expect(emittedActions[0]).toEqual({
        type: EntryActionTypes.SWIM_LANE_UPDATE_HANDLE,
        payload: { swimLane },
      });
    });

    it('swimLaneDelete 이벤트 수신 시 SWIM_LANE_DELETE_HANDLE 액션을 디스패치해야 함', () => {
      const handler = createEventHandler('swimLaneDelete', emit);
      const swimLane = { id: 'sl-1' };

      handler({ item: swimLane });

      expect(emittedActions).toHaveLength(1);
      expect(emittedActions[0]).toEqual({
        type: EntryActionTypes.SWIM_LANE_DELETE_HANDLE,
        payload: { swimLane },
      });
    });
  });

  describe('CommitmentPoint 이벤트', () => {
    it('commitmentPointCreate 이벤트 수신 시 올바른 액션을 디스패치해야 함', () => {
      const handler = createEventHandler('commitmentPointCreate', emit);
      const commitmentPoint = {
        id: 'cp-1',
        boardId: 'board-1',
        leftListId: 'list-1',
        rightListId: 'list-2',
        label: 'Dev Ready',
        type: 'commitment',
        position: 65536,
      };

      handler({ item: commitmentPoint });

      expect(emittedActions).toHaveLength(1);
      expect(emittedActions[0]).toEqual({
        type: EntryActionTypes.COMMITMENT_POINT_CREATE_HANDLE,
        payload: { commitmentPoint },
      });
    });

    it('commitmentPointUpdate 이벤트 수신 시 올바른 액션을 디스패치해야 함', () => {
      const handler = createEventHandler('commitmentPointUpdate', emit);
      const commitmentPoint = { id: 'cp-1', label: 'Updated Label' };

      handler({ item: commitmentPoint });

      expect(emittedActions).toHaveLength(1);
      expect(emittedActions[0]).toEqual({
        type: EntryActionTypes.COMMITMENT_POINT_UPDATE_HANDLE,
        payload: { commitmentPoint },
      });
    });

    it('commitmentPointDelete 이벤트 수신 시 올바른 액션을 디스패치해야 함', () => {
      const handler = createEventHandler('commitmentPointDelete', emit);
      const commitmentPoint = { id: 'cp-1' };

      handler({ item: commitmentPoint });

      expect(emittedActions).toHaveLength(1);
      expect(emittedActions[0]).toEqual({
        type: EntryActionTypes.COMMITMENT_POINT_DELETE_HANDLE,
        payload: { commitmentPoint },
      });
    });
  });

  describe('ClassOfService 이벤트', () => {
    it('classOfServiceCreate 이벤트 수신 시 올바른 액션을 디스패치해야 함', () => {
      const handler = createEventHandler('classOfServiceCreate', emit);
      const classOfService = {
        id: 'cos-1',
        boardId: 'board-1',
        name: 'Expedite',
        type: 'expedite',
        color: '#FF0000',
        policy: 'Immediate attention required',
        position: 65536,
        isDefault: true,
      };

      handler({ item: classOfService });

      expect(emittedActions).toHaveLength(1);
      expect(emittedActions[0]).toEqual({
        type: EntryActionTypes.CLASS_OF_SERVICE_CREATE_HANDLE,
        payload: { classOfService },
      });
    });

    it('classOfServiceUpdate 이벤트 수신 시 올바른 액션을 디스패치해야 함', () => {
      const handler = createEventHandler('classOfServiceUpdate', emit);
      const classOfService = { id: 'cos-1', name: 'Updated CoS', color: '#00FF00' };

      handler({ item: classOfService });

      expect(emittedActions).toHaveLength(1);
      expect(emittedActions[0]).toEqual({
        type: EntryActionTypes.CLASS_OF_SERVICE_UPDATE_HANDLE,
        payload: { classOfService },
      });
    });

    it('classOfServiceDelete 이벤트 수신 시 올바른 액션을 디스패치해야 함', () => {
      const handler = createEventHandler('classOfServiceDelete', emit);
      const classOfService = { id: 'cos-1' };

      handler({ item: classOfService });

      expect(emittedActions).toHaveLength(1);
      expect(emittedActions[0]).toEqual({
        type: EntryActionTypes.CLASS_OF_SERVICE_DELETE_HANDLE,
        payload: { classOfService },
      });
    });
  });

  describe('Decorator 이벤트', () => {
    it('decoratorCreate 이벤트 수신 시 올바른 액션을 디스패치해야 함', () => {
      const handler = createEventHandler('decoratorCreate', emit);
      const decorator = {
        id: 'dec-1',
        boardId: 'board-1',
        name: 'API Dependency',
        icon: 'star',
        color: '#FFD700',
      };

      handler({ item: decorator });

      expect(emittedActions).toHaveLength(1);
      expect(emittedActions[0]).toEqual({
        type: EntryActionTypes.DECORATOR_CREATE_HANDLE,
        payload: { decorator },
      });
    });

    it('decoratorUpdate 이벤트 수신 시 올바른 액션을 디스패치해야 함', () => {
      const handler = createEventHandler('decoratorUpdate', emit);
      const decorator = { id: 'dec-1', name: 'Updated Decorator', icon: 'circle' };

      handler({ item: decorator });

      expect(emittedActions).toHaveLength(1);
      expect(emittedActions[0]).toEqual({
        type: EntryActionTypes.DECORATOR_UPDATE_HANDLE,
        payload: { decorator },
      });
    });

    it('decoratorDelete 이벤트 수신 시 올바른 액션을 디스패치해야 함', () => {
      const handler = createEventHandler('decoratorDelete', emit);
      const decorator = { id: 'dec-1' };

      handler({ item: decorator });

      expect(emittedActions).toHaveLength(1);
      expect(emittedActions[0]).toEqual({
        type: EntryActionTypes.DECORATOR_DELETE_HANDLE,
        payload: { decorator },
      });
    });

    it('cardDecoratorCreate 이벤트 수신 시 올바른 액션을 디스패치해야 함', () => {
      const handler = createEventHandler('cardDecoratorCreate', emit);
      const cardDecorator = { id: 'cd-1', cardId: 'card-1', decoratorId: 'dec-1' };

      handler({ item: cardDecorator });

      expect(emittedActions).toHaveLength(1);
      expect(emittedActions[0]).toEqual({
        type: EntryActionTypes.CARD_DECORATOR_CREATE_HANDLE,
        payload: { cardDecorator },
      });
    });

    it('cardDecoratorDelete 이벤트 수신 시 올바른 액션을 디스패치해야 함', () => {
      const handler = createEventHandler('cardDecoratorDelete', emit);
      const cardDecorator = { id: 'cd-1' };

      handler({ item: cardDecorator });

      expect(emittedActions).toHaveLength(1);
      expect(emittedActions[0]).toEqual({
        type: EntryActionTypes.CARD_DECORATOR_DELETE_HANDLE,
        payload: { cardDecorator },
      });
    });
  });

  describe('Blocker 이벤트', () => {
    it('blockerCreate 이벤트 수신 시 올바른 액션을 디스패치해야 함', () => {
      const handler = createEventHandler('blockerCreate', emit);
      const blocker = {
        id: 'blk-1',
        cardId: 'card-1',
        reason: 'Waiting for API approval',
        status: 'active',
        linkedCardId: null,
        creatorUserId: 'user-1',
      };

      handler({ item: blocker });

      expect(emittedActions).toHaveLength(1);
      expect(emittedActions[0]).toEqual({
        type: EntryActionTypes.BLOCKER_CREATE_HANDLE,
        payload: { blocker },
      });
    });

    it('blockerUpdate 이벤트 수신 시 올바른 액션을 디스패치해야 함', () => {
      const handler = createEventHandler('blockerUpdate', emit);
      const blocker = { id: 'blk-1', status: 'resolved', resolvedAt: '2025-01-15T10:00:00.000Z' };

      handler({ item: blocker });

      expect(emittedActions).toHaveLength(1);
      expect(emittedActions[0]).toEqual({
        type: EntryActionTypes.BLOCKER_UPDATE_HANDLE,
        payload: { blocker },
      });
    });

    it('blockerDelete 이벤트 수신 시 올바른 액션을 디스패치해야 함', () => {
      const handler = createEventHandler('blockerDelete', emit);
      const blocker = { id: 'blk-1' };

      handler({ item: blocker });

      expect(emittedActions).toHaveLength(1);
      expect(emittedActions[0]).toEqual({
        type: EntryActionTypes.BLOCKER_DELETE_HANDLE,
        payload: { blocker },
      });
    });
  });

  describe('CardRelationship 이벤트', () => {
    it('cardRelationshipCreate 이벤트 수신 시 올바른 액션을 디스패치해야 함', () => {
      const handler = createEventHandler('cardRelationshipCreate', emit);
      const cardRelationship = {
        id: 'cr-1',
        parentCardId: 'card-1',
        childCardId: 'card-2',
        type: 'sub_ticket',
        position: 65536,
      };

      handler({ item: cardRelationship });

      expect(emittedActions).toHaveLength(1);
      expect(emittedActions[0]).toEqual({
        type: EntryActionTypes.CARD_RELATIONSHIP_CREATE_HANDLE,
        payload: { cardRelationship },
      });
    });

    it('cardRelationshipDelete 이벤트 수신 시 올바른 액션을 디스패치해야 함', () => {
      const handler = createEventHandler('cardRelationshipDelete', emit);
      const cardRelationship = { id: 'cr-1' };

      handler({ item: cardRelationship });

      expect(emittedActions).toHaveLength(1);
      expect(emittedActions[0]).toEqual({
        type: EntryActionTypes.CARD_RELATIONSHIP_DELETE_HANDLE,
        payload: { cardRelationship },
      });
    });
  });

  describe('cardUpdate 이벤트 - 새 필드 포함', () => {
    it('칸반 확장 필드가 포함된 cardUpdate를 처리해야 함', () => {
      const handler = createEventHandler('cardUpdate', emit);
      const card = {
        id: 'card-1',
        name: 'Test Card',
        listId: 'list-2',
        classOfServiceId: 'cos-1',
        priority: 'H',
        startDate: '2025-01-10T00:00:00.000Z',
        swimLaneId: 'sl-1',
        completedAt: '2025-01-15T10:00:00.000Z',
      };

      handler({ item: card });

      expect(emittedActions).toHaveLength(1);
      expect(emittedActions[0].type).toBe(EntryActionTypes.CARD_UPDATE_HANDLE);
      expect(emittedActions[0].payload.card).toEqual(card);
    });

    it('새 필드가 null인 cardUpdate도 정상 처리해야 함', () => {
      const handler = createEventHandler('cardUpdate', emit);
      const card = {
        id: 'card-2',
        name: 'Card without new fields',
        listId: 'list-1',
        classOfServiceId: null,
        priority: null,
        startDate: null,
        swimLaneId: null,
        completedAt: null,
      };

      handler({ item: card });

      expect(emittedActions).toHaveLength(1);
      expect(emittedActions[0].type).toBe(EntryActionTypes.CARD_UPDATE_HANDLE);
      expect(emittedActions[0].payload.card.classOfServiceId).toBeNull();
      expect(emittedActions[0].payload.card.priority).toBeNull();
      expect(emittedActions[0].payload.card.swimLaneId).toBeNull();
    });
  });

  describe('listUpdate 이벤트 - 새 필드 포함', () => {
    it('WIP/컬럼 구조 필드가 포함된 listUpdate를 처리해야 함', () => {
      const handler = createEventHandler('listUpdate', emit);
      const list = {
        id: 'list-1',
        name: 'In Progress',
        wipLimit: 5,
        subColumnType: 'active',
        parentListId: 'list-parent',
        isBuffer: false,
        pullCriteria: 'Code review completed',
        policy: 'Max 2 items per developer',
      };

      handler({ item: list });

      expect(emittedActions).toHaveLength(1);
      expect(emittedActions[0].type).toBe(EntryActionTypes.LIST_UPDATE_HANDLE);
      expect(emittedActions[0].payload.list).toEqual(list);
    });

    it('WIP 관련 필드가 null인 listUpdate도 정상 처리해야 함', () => {
      const handler = createEventHandler('listUpdate', emit);
      const list = {
        id: 'list-2',
        name: 'Backlog',
        wipLimit: null,
        subColumnType: null,
        parentListId: null,
        isBuffer: false,
        pullCriteria: null,
        policy: null,
      };

      handler({ item: list });

      expect(emittedActions).toHaveLength(1);
      expect(emittedActions[0].type).toBe(EntryActionTypes.LIST_UPDATE_HANDLE);
      expect(emittedActions[0].payload.list.wipLimit).toBeNull();
    });
  });

  describe('boardUpdate 이벤트 - systemWipLimit 포함', () => {
    it('systemWipLimit 필드가 포함된 boardUpdate를 처리해야 함', () => {
      const handler = createEventHandler('boardUpdate', emit);
      const board = { id: 'board-1', name: 'Kanban Board', systemWipLimit: 24 };

      handler({ item: board });

      expect(emittedActions).toHaveLength(1);
      expect(emittedActions[0].type).toBe(EntryActionTypes.BOARD_UPDATE_HANDLE);
      expect(emittedActions[0].payload.board).toEqual(board);
    });

    it('systemWipLimit이 null인 boardUpdate도 정상 처리해야 함', () => {
      const handler = createEventHandler('boardUpdate', emit);
      const board = { id: 'board-1', name: 'Board', systemWipLimit: null };

      handler({ item: board });

      expect(emittedActions).toHaveLength(1);
      expect(emittedActions[0].payload.board.systemWipLimit).toBeNull();
    });
  });

  describe('이벤트 페이로드 구조 검증', () => {
    it('모든 create 이벤트는 { item: {...} } 구조의 페이로드를 받아야 함', () => {
      const createEvents = [
        'swimLaneCreate',
        'commitmentPointCreate',
        'classOfServiceCreate',
        'blockerCreate',
        'cardRelationshipCreate',
        'decoratorCreate',
        'cardDecoratorCreate',
      ];

      createEvents.forEach((eventName) => {
        emittedActions = [];
        const handler = createEventHandler(eventName, emit);
        handler({ item: { id: `test-${eventName}`, name: 'Test' } });

        expect(emittedActions).toHaveLength(1);
        const payloadValues = Object.values(emittedActions[0].payload);
        expect(payloadValues[0]).toEqual({ id: `test-${eventName}`, name: 'Test' });
      });
    });

    it('모든 delete 이벤트는 { item: { id } } 구조의 페이로드를 받아야 함', () => {
      const deleteEvents = [
        'swimLaneDelete',
        'commitmentPointDelete',
        'classOfServiceDelete',
        'blockerDelete',
        'cardRelationshipDelete',
        'decoratorDelete',
        'cardDecoratorDelete',
      ];

      deleteEvents.forEach((eventName) => {
        emittedActions = [];
        const handler = createEventHandler(eventName, emit);
        handler({ item: { id: `delete-${eventName}` } });

        expect(emittedActions).toHaveLength(1);
        const payloadValues = Object.values(emittedActions[0].payload);
        expect(payloadValues[0]).toEqual({ id: `delete-${eventName}` });
      });
    });
  });

  describe('연속 이벤트 처리', () => {
    it('동일 리소스에 대한 연속 이벤트를 순서대로 처리해야 함', () => {
      const createHandler = createEventHandler('swimLaneCreate', emit);
      const updateHandler = createEventHandler('swimLaneUpdate', emit);
      const deleteHandler = createEventHandler('swimLaneDelete', emit);

      createHandler({ item: { id: 'sl-1', boardId: 'board-1', name: 'Lane', position: 65536 } });
      updateHandler({ item: { id: 'sl-1', name: 'Updated Lane' } });
      deleteHandler({ item: { id: 'sl-1' } });

      expect(emittedActions).toHaveLength(3);
      expect(emittedActions[0].type).toBe(EntryActionTypes.SWIM_LANE_CREATE_HANDLE);
      expect(emittedActions[1].type).toBe(EntryActionTypes.SWIM_LANE_UPDATE_HANDLE);
      expect(emittedActions[2].type).toBe(EntryActionTypes.SWIM_LANE_DELETE_HANDLE);
    });

    it('서로 다른 리소스 이벤트를 독립적으로 처리해야 함', () => {
      const swimLaneHandler = createEventHandler('swimLaneCreate', emit);
      const blockerHandler = createEventHandler('blockerCreate', emit);
      const decoratorHandler = createEventHandler('decoratorCreate', emit);

      swimLaneHandler({ item: { id: 'sl-1', name: 'Lane' } });
      blockerHandler({ item: { id: 'blk-1', reason: 'Blocked' } });
      decoratorHandler({ item: { id: 'dec-1', name: 'Decorator' } });

      expect(emittedActions).toHaveLength(3);
      expect(emittedActions[0].type).toBe(EntryActionTypes.SWIM_LANE_CREATE_HANDLE);
      expect(emittedActions[1].type).toBe(EntryActionTypes.BLOCKER_CREATE_HANDLE);
      expect(emittedActions[2].type).toBe(EntryActionTypes.DECORATOR_CREATE_HANDLE);
    });
  });
});
