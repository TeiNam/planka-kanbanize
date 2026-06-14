/*!
 * 마감일 카드 셀렉터 단위 테스트
 * selectDueDateCardsForCurrentProject 검증
 * - 현재 프로젝트의 모든 보드를 가로질러 dueDate != null 인 카드만 수집 (R8.6)
 * - 빈 프로젝트 → 빈 배열, 프로젝트 없음/null 경로 → 안전 처리 (R8.1)
 * - R8.7: 카드가 dueDate 를 잃으면 셀렉터 재평가로 즉시 제외 (스냅샷 미보관 / Correctness Property 4)
 */

import orm from '../../orm';
import { selectDueDateCardsForCurrentProject } from '../../selectors/projects';
import Paths from '../../constants/Paths';

const PROJECT_ID = 'project-1';
const BOARD_1_ID = 'board-1';
const BOARD_2_ID = 'board-2';
const USER_ID = 'user-1';
// 현재 경로는 board-1 이며, selectPath 가 board.projectId 로 projectId 를 파생한다.
const PATHNAME = Paths.BOARDS.replace(':id', BOARD_1_ID);

// 현재 프로젝트(project-1)의 두 보드(board-1, board-2)에 멤버십을 가진 user-1 로 라우팅된
// 전체 상태를 구성한다. selectDueDateCardsForCurrentProject 는 selectPath + ORM 에 의존한다.
function createState(setupCards) {
  const session = orm.session(orm.getEmptyState());

  session.User.create({ id: USER_ID, name: 'Tester' });
  session.Project.create({ id: PROJECT_ID, name: 'Project' });
  session.Board.create({ id: BOARD_1_ID, projectId: PROJECT_ID, name: 'Board 1', position: 1 });
  session.Board.create({ id: BOARD_2_ID, projectId: PROJECT_ID, name: 'Board 2', position: 2 });
  session.BoardMembership.create({
    id: 'bm-1',
    boardId: BOARD_1_ID,
    userId: USER_ID,
    role: 'editor',
  });
  session.BoardMembership.create({
    id: 'bm-2',
    boardId: BOARD_2_ID,
    userId: USER_ID,
    role: 'editor',
  });
  // 칸반 리스트(type 이 KanbanListTypes 에 포함되어야 getCardsModelArray 에 잡힘)
  session.List.create({ id: 'list-1', boardId: BOARD_1_ID, type: 'task', position: 1 });
  session.List.create({ id: 'list-2', boardId: BOARD_2_ID, type: 'task', position: 1 });

  setupCards(session);

  return {
    orm: session.state,
    auth: { userId: USER_ID },
    router: { location: { pathname: PATHNAME } },
  };
}

describe('selectDueDateCardsForCurrentProject', () => {
  it('프로젝트의 모든 보드를 가로질러 dueDate 가 설정된 카드만 수집해야 함 (R8.6)', () => {
    const state = createState((session) => {
      session.Card.create({
        id: 'card-board1-due',
        boardId: BOARD_1_ID,
        listId: 'list-1',
        name: 'Board1 has due',
        position: 1,
        dueDate: '2026-06-15T00:00:00.000Z',
      });
      session.Card.create({
        id: 'card-board1-no-due',
        boardId: BOARD_1_ID,
        listId: 'list-1',
        name: 'Board1 no due',
        position: 2,
        dueDate: null,
      });
      session.Card.create({
        id: 'card-board2-due',
        boardId: BOARD_2_ID,
        listId: 'list-2',
        name: 'Board2 has due',
        position: 1,
        dueDate: '2026-06-20T00:00:00.000Z',
      });
    });

    const result = selectDueDateCardsForCurrentProject(state);

    expect(result).toHaveLength(2);
    const ids = result.map((card) => card.id);
    expect(ids).toContain('card-board1-due');
    expect(ids).toContain('card-board2-due');
    expect(ids).not.toContain('card-board1-no-due');
  });

  it('dueDate 없는 카드만 있으면 빈 배열을 반환해야 함 (R8.6)', () => {
    const state = createState((session) => {
      session.Card.create({
        id: 'card-no-due',
        boardId: BOARD_1_ID,
        listId: 'list-1',
        name: 'No due date',
        position: 1,
        dueDate: null,
      });
    });

    const result = selectDueDateCardsForCurrentProject(state);

    expect(result).toEqual([]);
  });

  it('카드가 없는 빈 프로젝트는 빈 배열을 반환해야 함', () => {
    const state = createState(() => {});

    const result = selectDueDateCardsForCurrentProject(state);

    expect(result).toEqual([]);
  });

  it('현재 프로젝트 경로가 없으면(null projectId) 안전하게 처리해야 함 (R8.1)', () => {
    const session = orm.session(orm.getEmptyState());
    session.User.create({ id: USER_ID, name: 'Tester' });

    // 매칭되지 않는 경로 → selectPath 가 projectId 를 제공하지 않음
    const state = {
      orm: session.state,
      auth: { userId: USER_ID },
      router: { location: { pathname: '/' } },
    };

    const result = selectDueDateCardsForCurrentProject(state);

    // projectId 가 undefined 이면 셀렉터는 falsy(=id)를 반환한다.
    expect(result).toBeFalsy();
  });

  it('task 리스트의 카드만 수집하고 backlog/closed(done)/discard 리스트 카드는 제외해야 함', () => {
    const state = createState((session) => {
      // 비-task 리스트들 생성 (board-1)
      session.List.create({
        id: 'list-backlog',
        boardId: BOARD_1_ID,
        type: 'backlog',
        position: 2,
      });
      session.List.create({ id: 'list-closed', boardId: BOARD_1_ID, type: 'closed', position: 3 });
      session.List.create({
        id: 'list-discard',
        boardId: BOARD_1_ID,
        type: 'discard',
        position: 4,
      });

      // task 리스트 카드 (포함)
      session.Card.create({
        id: 'card-task',
        boardId: BOARD_1_ID,
        listId: 'list-1',
        name: 'Task card',
        position: 1,
        dueDate: '2026-06-15T00:00:00.000Z',
      });
      // backlog/closed/discard 카드 (모두 dueDate 있지만 제외되어야 함)
      session.Card.create({
        id: 'card-backlog',
        boardId: BOARD_1_ID,
        listId: 'list-backlog',
        name: 'Backlog card',
        position: 1,
        dueDate: '2026-06-16T00:00:00.000Z',
      });
      session.Card.create({
        id: 'card-closed',
        boardId: BOARD_1_ID,
        listId: 'list-closed',
        name: 'Closed card',
        position: 1,
        dueDate: '2026-06-17T00:00:00.000Z',
      });
      session.Card.create({
        id: 'card-discard',
        boardId: BOARD_1_ID,
        listId: 'list-discard',
        name: 'Discard card',
        position: 1,
        dueDate: '2026-06-18T00:00:00.000Z',
      });
    });

    const result = selectDueDateCardsForCurrentProject(state);
    const ids = result.map((card) => card.id);

    expect(ids).toEqual(['card-task']);
    expect(ids).not.toContain('card-backlog');
    expect(ids).not.toContain('card-closed');
    expect(ids).not.toContain('card-discard');
  });

  it('R8.7: 카드가 dueDate 를 잃으면 재평가로 즉시 제외되어야 함 (스냅샷 미보관)', () => {
    // 스냅샷 1: 카드에 dueDate 가 있음 → DueDateItem 으로 수집됨
    const stateWithDue = createState((session) => {
      session.Card.create({
        id: 'card-1',
        boardId: BOARD_1_ID,
        listId: 'list-1',
        name: 'Release',
        position: 1,
        dueDate: '2026-06-15T00:00:00.000Z',
      });
    });

    const before = selectDueDateCardsForCurrentProject(stateWithDue);
    expect(before).toHaveLength(1);
    expect(before[0].id).toBe('card-1');

    // 스냅샷 2: 동일 카드가 dueDate 를 잃음(cardUpdate 로 dueDate=null) → 즉시 제외
    const stateWithoutDue = createState((session) => {
      session.Card.create({
        id: 'card-1',
        boardId: BOARD_1_ID,
        listId: 'list-1',
        name: 'Release',
        position: 1,
        dueDate: null,
      });
    });

    const after = selectDueDateCardsForCurrentProject(stateWithoutDue);
    expect(after).toEqual([]);
  });
});
