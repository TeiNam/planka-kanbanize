/*!
 * 블로커 셀렉터 단위 테스트
 * selectBlockersByCardId, selectActiveBlockerCount, selectHasActiveBlockers 검증
 */

import orm from '../../orm';
import {
  makeSelectBlockersByCardId,
  makeSelectActiveBlockerCount,
  makeSelectHasActiveBlockers,
} from '../../selectors/blockers';

// ORM 상태를 생성하는 헬퍼
function createOrmState(setupFn) {
  const emptyState = orm.getEmptyState();
  const session = orm.session(emptyState);
  setupFn(session);
  return { orm: session.state };
}

describe('blockers selectors', () => {
  describe('makeSelectBlockersByCardId', () => {
    it('카드에 속한 모든 블로커를 반환해야 함', () => {
      const state = createOrmState((session) => {
        session.Board.create({ id: 'board-1', name: 'Board' });
        session.List.create({ id: 'list-1', boardId: 'board-1', position: 1 });
        session.Card.create({
          id: 'card-1',
          listId: 'list-1',
          boardId: 'board-1',
          name: 'Card 1',
          position: 1,
        });
        session.Blocker.create({
          id: 'blocker-1',
          cardId: 'card-1',
          reason: 'Waiting for API',
          status: 'active',
        });
        session.Blocker.create({
          id: 'blocker-2',
          cardId: 'card-1',
          reason: 'Dependency issue',
          status: 'resolved',
        });
      });

      const selector = makeSelectBlockersByCardId();
      const result = selector(state, 'card-1');

      expect(result).toHaveLength(2);
      expect(result.map((b) => b.id)).toContain('blocker-1');
      expect(result.map((b) => b.id)).toContain('blocker-2');
    });

    it('블로커가 없는 카드는 빈 배열을 반환해야 함', () => {
      const state = createOrmState((session) => {
        session.Board.create({ id: 'board-1', name: 'Board' });
        session.List.create({ id: 'list-1', boardId: 'board-1', position: 1 });
        session.Card.create({
          id: 'card-1',
          listId: 'list-1',
          boardId: 'board-1',
          name: 'Card 1',
          position: 1,
        });
      });

      const selector = makeSelectBlockersByCardId();
      const result = selector(state, 'card-1');

      expect(result).toHaveLength(0);
    });

    it('존재하지 않는 카드 ID에 대해 falsy 값을 반환해야 함', () => {
      const state = createOrmState(() => {});

      const selector = makeSelectBlockersByCardId();
      const result = selector(state, 'non-existent');

      expect(result).toBeFalsy();
    });

    it('null ID에 대해 null을 반환해야 함', () => {
      const state = createOrmState(() => {});

      const selector = makeSelectBlockersByCardId();
      const result = selector(state, null);

      expect(result).toBeNull();
    });

    it('다른 카드의 블로커는 포함하지 않아야 함', () => {
      const state = createOrmState((session) => {
        session.Board.create({ id: 'board-1', name: 'Board' });
        session.List.create({ id: 'list-1', boardId: 'board-1', position: 1 });
        session.Card.create({
          id: 'card-1',
          listId: 'list-1',
          boardId: 'board-1',
          name: 'Card 1',
          position: 1,
        });
        session.Card.create({
          id: 'card-2',
          listId: 'list-1',
          boardId: 'board-1',
          name: 'Card 2',
          position: 2,
        });
        session.Blocker.create({
          id: 'blocker-1',
          cardId: 'card-1',
          reason: 'Blocker for card 1',
          status: 'active',
        });
        session.Blocker.create({
          id: 'blocker-2',
          cardId: 'card-2',
          reason: 'Blocker for card 2',
          status: 'active',
        });
      });

      const selector = makeSelectBlockersByCardId();
      const result = selector(state, 'card-1');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('blocker-1');
    });
  });

  describe('makeSelectActiveBlockerCount', () => {
    it('활성 블로커 수를 정확히 반환해야 함', () => {
      const state = createOrmState((session) => {
        session.Board.create({ id: 'board-1', name: 'Board' });
        session.List.create({ id: 'list-1', boardId: 'board-1', position: 1 });
        session.Card.create({
          id: 'card-1',
          listId: 'list-1',
          boardId: 'board-1',
          name: 'Card 1',
          position: 1,
        });
        session.Blocker.create({
          id: 'blocker-1',
          cardId: 'card-1',
          reason: 'Active 1',
          status: 'active',
        });
        session.Blocker.create({
          id: 'blocker-2',
          cardId: 'card-1',
          reason: 'Resolved',
          status: 'resolved',
        });
        session.Blocker.create({
          id: 'blocker-3',
          cardId: 'card-1',
          reason: 'Active 2',
          status: 'active',
        });
      });

      const selector = makeSelectActiveBlockerCount();
      const result = selector(state, 'card-1');

      expect(result).toBe(2);
    });

    it('모든 블로커가 resolved이면 0을 반환해야 함', () => {
      const state = createOrmState((session) => {
        session.Board.create({ id: 'board-1', name: 'Board' });
        session.List.create({ id: 'list-1', boardId: 'board-1', position: 1 });
        session.Card.create({
          id: 'card-1',
          listId: 'list-1',
          boardId: 'board-1',
          name: 'Card 1',
          position: 1,
        });
        session.Blocker.create({
          id: 'blocker-1',
          cardId: 'card-1',
          reason: 'Resolved 1',
          status: 'resolved',
        });
        session.Blocker.create({
          id: 'blocker-2',
          cardId: 'card-1',
          reason: 'Resolved 2',
          status: 'resolved',
        });
      });

      const selector = makeSelectActiveBlockerCount();
      const result = selector(state, 'card-1');

      expect(result).toBe(0);
    });

    it('블로커가 없는 카드는 0을 반환해야 함', () => {
      const state = createOrmState((session) => {
        session.Board.create({ id: 'board-1', name: 'Board' });
        session.List.create({ id: 'list-1', boardId: 'board-1', position: 1 });
        session.Card.create({
          id: 'card-1',
          listId: 'list-1',
          boardId: 'board-1',
          name: 'Card 1',
          position: 1,
        });
      });

      const selector = makeSelectActiveBlockerCount();
      const result = selector(state, 'card-1');

      expect(result).toBe(0);
    });

    it('존재하지 않는 카드 ID에 대해 0을 반환해야 함', () => {
      const state = createOrmState(() => {});

      const selector = makeSelectActiveBlockerCount();
      const result = selector(state, 'non-existent');

      expect(result).toBe(0);
    });

    it('null ID에 대해 0을 반환해야 함', () => {
      const state = createOrmState(() => {});

      const selector = makeSelectActiveBlockerCount();
      const result = selector(state, null);

      expect(result).toBe(0);
    });
  });

  describe('makeSelectHasActiveBlockers', () => {
    it('활성 블로커가 있으면 true를 반환해야 함', () => {
      const state = createOrmState((session) => {
        session.Board.create({ id: 'board-1', name: 'Board' });
        session.List.create({ id: 'list-1', boardId: 'board-1', position: 1 });
        session.Card.create({
          id: 'card-1',
          listId: 'list-1',
          boardId: 'board-1',
          name: 'Card 1',
          position: 1,
        });
        session.Blocker.create({
          id: 'blocker-1',
          cardId: 'card-1',
          reason: 'Active blocker',
          status: 'active',
        });
      });

      const selector = makeSelectHasActiveBlockers();
      const result = selector(state, 'card-1');

      expect(result).toBe(true);
    });

    it('활성 블로커가 없으면 false를 반환해야 함', () => {
      const state = createOrmState((session) => {
        session.Board.create({ id: 'board-1', name: 'Board' });
        session.List.create({ id: 'list-1', boardId: 'board-1', position: 1 });
        session.Card.create({
          id: 'card-1',
          listId: 'list-1',
          boardId: 'board-1',
          name: 'Card 1',
          position: 1,
        });
        session.Blocker.create({
          id: 'blocker-1',
          cardId: 'card-1',
          reason: 'Resolved blocker',
          status: 'resolved',
        });
      });

      const selector = makeSelectHasActiveBlockers();
      const result = selector(state, 'card-1');

      expect(result).toBe(false);
    });

    it('블로커가 없는 카드는 false를 반환해야 함', () => {
      const state = createOrmState((session) => {
        session.Board.create({ id: 'board-1', name: 'Board' });
        session.List.create({ id: 'list-1', boardId: 'board-1', position: 1 });
        session.Card.create({
          id: 'card-1',
          listId: 'list-1',
          boardId: 'board-1',
          name: 'Card 1',
          position: 1,
        });
      });

      const selector = makeSelectHasActiveBlockers();
      const result = selector(state, 'card-1');

      expect(result).toBe(false);
    });

    it('존재하지 않는 카드 ID에 대해 false를 반환해야 함', () => {
      const state = createOrmState(() => {});

      const selector = makeSelectHasActiveBlockers();
      const result = selector(state, 'non-existent');

      expect(result).toBe(false);
    });

    it('null ID에 대해 false를 반환해야 함', () => {
      const state = createOrmState(() => {});

      const selector = makeSelectHasActiveBlockers();
      const result = selector(state, null);

      expect(result).toBe(false);
    });
  });
});
