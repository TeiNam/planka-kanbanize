/*!
 * 스윔레인 셀렉터 단위 테스트
 * selectSwimLanesByBoardId, selectSwimLaneWipCount, selectSwimLaneWipExceeded 검증
 */

import orm from '../../orm';
import {
  makeSelectSwimLanesByBoardId,
  makeSelectSwimLaneWipCount,
  makeSelectSwimLaneWipExceeded,
} from '../../selectors/swim-lanes';

// ORM 상태를 생성하는 헬퍼
function createOrmState(setupFn) {
  const emptyState = orm.getEmptyState();
  const session = orm.session(emptyState);
  setupFn(session);
  return { orm: session.state };
}

describe('swim-lanes selectors', () => {
  describe('makeSelectSwimLanesByBoardId', () => {
    it('보드에 속한 스윔레인을 position 순서로 반환해야 함', () => {
      const state = createOrmState((session) => {
        session.Board.create({ id: 'board-1', name: 'Test Board' });
        session.SwimLane.create({
          id: 'sl-2',
          boardId: 'board-1',
          name: 'Second',
          position: 200,
          type: 'standard',
        });
        session.SwimLane.create({
          id: 'sl-1',
          boardId: 'board-1',
          name: 'First',
          position: 100,
          type: 'standard',
        });
        session.SwimLane.create({
          id: 'sl-3',
          boardId: 'board-1',
          name: 'Third',
          position: 300,
          type: 'standard',
        });
      });

      const selector = makeSelectSwimLanesByBoardId();
      const result = selector(state, 'board-1');

      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('First');
      expect(result[1].name).toBe('Second');
      expect(result[2].name).toBe('Third');
    });

    it('각 스윔레인에 isPersisted 플래그가 포함되어야 함', () => {
      const state = createOrmState((session) => {
        session.Board.create({ id: 'board-1', name: 'Test Board' });
        session.SwimLane.create({
          id: 'sl-1',
          boardId: 'board-1',
          name: 'Persisted',
          position: 100,
          type: 'standard',
        });
        session.SwimLane.create({
          id: 'local:1234-0000',
          boardId: 'board-1',
          name: 'Local',
          position: 200,
          type: 'standard',
        });
      });

      const selector = makeSelectSwimLanesByBoardId();
      const result = selector(state, 'board-1');

      expect(result[0].isPersisted).toBe(true);
      expect(result[1].isPersisted).toBe(false);
    });

    it('존재하지 않는 보드 ID에 대해 falsy 값을 반환해야 함', () => {
      const state = createOrmState((session) => {
        session.Board.create({ id: 'board-1', name: 'Test Board' });
      });

      const selector = makeSelectSwimLanesByBoardId();
      const result = selector(state, 'non-existent');

      expect(result).toBeFalsy();
    });

    it('null ID에 대해 null을 반환해야 함', () => {
      const state = createOrmState(() => {});

      const selector = makeSelectSwimLanesByBoardId();
      const result = selector(state, null);

      expect(result).toBeNull();
    });

    it('다른 보드의 스윔레인은 포함하지 않아야 함', () => {
      const state = createOrmState((session) => {
        session.Board.create({ id: 'board-1', name: 'Board 1' });
        session.Board.create({ id: 'board-2', name: 'Board 2' });
        session.SwimLane.create({
          id: 'sl-1',
          boardId: 'board-1',
          name: 'Lane A',
          position: 100,
          type: 'standard',
        });
        session.SwimLane.create({
          id: 'sl-2',
          boardId: 'board-2',
          name: 'Lane B',
          position: 100,
          type: 'standard',
        });
      });

      const selector = makeSelectSwimLanesByBoardId();
      const result = selector(state, 'board-1');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Lane A');
    });
  });

  describe('makeSelectSwimLaneWipCount', () => {
    it('스윔레인에 속한 카드 수를 반환해야 함', () => {
      const state = createOrmState((session) => {
        session.Board.create({ id: 'board-1', name: 'Board' });
        session.List.create({ id: 'list-1', boardId: 'board-1', position: 1 });
        session.SwimLane.create({
          id: 'sl-1',
          boardId: 'board-1',
          name: 'Lane',
          position: 100,
          type: 'standard',
          wipLimit: 5,
        });
        session.Card.create({
          id: 'card-1',
          listId: 'list-1',
          boardId: 'board-1',
          swimLaneId: 'sl-1',
          name: 'Card 1',
          position: 1,
        });
        session.Card.create({
          id: 'card-2',
          listId: 'list-1',
          boardId: 'board-1',
          swimLaneId: 'sl-1',
          name: 'Card 2',
          position: 2,
        });
        session.Card.create({
          id: 'card-3',
          listId: 'list-1',
          boardId: 'board-1',
          swimLaneId: 'sl-1',
          name: 'Card 3',
          position: 3,
        });
      });

      const selector = makeSelectSwimLaneWipCount();
      const result = selector(state, 'sl-1');

      expect(result).toBe(3);
    });

    it('카드가 없는 스윔레인은 0을 반환해야 함', () => {
      const state = createOrmState((session) => {
        session.Board.create({ id: 'board-1', name: 'Board' });
        session.SwimLane.create({
          id: 'sl-1',
          boardId: 'board-1',
          name: 'Empty Lane',
          position: 100,
          type: 'standard',
        });
      });

      const selector = makeSelectSwimLaneWipCount();
      const result = selector(state, 'sl-1');

      expect(result).toBe(0);
    });

    it('존재하지 않는 스윔레인 ID에 대해 0을 반환해야 함', () => {
      const state = createOrmState(() => {});

      const selector = makeSelectSwimLaneWipCount();
      const result = selector(state, 'non-existent');

      expect(result).toBe(0);
    });

    it('null ID에 대해 0을 반환해야 함', () => {
      const state = createOrmState(() => {});

      const selector = makeSelectSwimLaneWipCount();
      const result = selector(state, null);

      expect(result).toBe(0);
    });
  });

  describe('makeSelectSwimLaneWipExceeded', () => {
    it('카드 수가 WIP 제한을 초과하면 true를 반환해야 함', () => {
      const state = createOrmState((session) => {
        session.Board.create({ id: 'board-1', name: 'Board' });
        session.List.create({ id: 'list-1', boardId: 'board-1', position: 1 });
        session.SwimLane.create({
          id: 'sl-1',
          boardId: 'board-1',
          name: 'Lane',
          position: 100,
          type: 'standard',
          wipLimit: 2,
        });
        session.Card.create({
          id: 'card-1',
          listId: 'list-1',
          boardId: 'board-1',
          swimLaneId: 'sl-1',
          name: 'Card 1',
          position: 1,
        });
        session.Card.create({
          id: 'card-2',
          listId: 'list-1',
          boardId: 'board-1',
          swimLaneId: 'sl-1',
          name: 'Card 2',
          position: 2,
        });
        session.Card.create({
          id: 'card-3',
          listId: 'list-1',
          boardId: 'board-1',
          swimLaneId: 'sl-1',
          name: 'Card 3',
          position: 3,
        });
      });

      const selector = makeSelectSwimLaneWipExceeded();
      const result = selector(state, 'sl-1');

      expect(result).toBe(true);
    });

    it('카드 수가 WIP 제한 이하이면 false를 반환해야 함', () => {
      const state = createOrmState((session) => {
        session.Board.create({ id: 'board-1', name: 'Board' });
        session.List.create({ id: 'list-1', boardId: 'board-1', position: 1 });
        session.SwimLane.create({
          id: 'sl-1',
          boardId: 'board-1',
          name: 'Lane',
          position: 100,
          type: 'standard',
          wipLimit: 5,
        });
        session.Card.create({
          id: 'card-1',
          listId: 'list-1',
          boardId: 'board-1',
          swimLaneId: 'sl-1',
          name: 'Card 1',
          position: 1,
        });
      });

      const selector = makeSelectSwimLaneWipExceeded();
      const result = selector(state, 'sl-1');

      expect(result).toBe(false);
    });

    it('WIP 제한이 null이면 false를 반환해야 함', () => {
      const state = createOrmState((session) => {
        session.Board.create({ id: 'board-1', name: 'Board' });
        session.List.create({ id: 'list-1', boardId: 'board-1', position: 1 });
        session.SwimLane.create({
          id: 'sl-1',
          boardId: 'board-1',
          name: 'Lane',
          position: 100,
          type: 'standard',
          wipLimit: null,
        });
        session.Card.create({
          id: 'card-1',
          listId: 'list-1',
          boardId: 'board-1',
          swimLaneId: 'sl-1',
          name: 'Card 1',
          position: 1,
        });
      });

      const selector = makeSelectSwimLaneWipExceeded();
      const result = selector(state, 'sl-1');

      expect(result).toBe(false);
    });

    it('존재하지 않는 스윔레인 ID에 대해 false를 반환해야 함', () => {
      const state = createOrmState(() => {});

      const selector = makeSelectSwimLaneWipExceeded();
      const result = selector(state, 'non-existent');

      expect(result).toBe(false);
    });

    it('카드 수가 WIP 제한과 정확히 같으면 false를 반환해야 함', () => {
      const state = createOrmState((session) => {
        session.Board.create({ id: 'board-1', name: 'Board' });
        session.List.create({ id: 'list-1', boardId: 'board-1', position: 1 });
        session.SwimLane.create({
          id: 'sl-1',
          boardId: 'board-1',
          name: 'Lane',
          position: 100,
          type: 'standard',
          wipLimit: 2,
        });
        session.Card.create({
          id: 'card-1',
          listId: 'list-1',
          boardId: 'board-1',
          swimLaneId: 'sl-1',
          name: 'Card 1',
          position: 1,
        });
        session.Card.create({
          id: 'card-2',
          listId: 'list-1',
          boardId: 'board-1',
          swimLaneId: 'sl-1',
          name: 'Card 2',
          position: 2,
        });
      });

      const selector = makeSelectSwimLaneWipExceeded();
      const result = selector(state, 'sl-1');

      expect(result).toBe(false);
    });
  });
});
