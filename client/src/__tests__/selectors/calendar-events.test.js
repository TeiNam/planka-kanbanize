/*!
 * 캘린더 일정 셀렉터 단위 테스트
 * selectCalendarEventsByProjectId 검증
 * - 프로젝트 일정을 startAt 순서로 반환 (R6.1)
 * - 빈 프로젝트 / 일정 없음 → 빈 배열
 * - 존재하지 않는 프로젝트 / null ID → 안전 처리
 */

import orm from '../../orm';
import { makeSelectCalendarEventsByProjectId } from '../../selectors/calendar-events';
import { CalendarEventKinds } from '../../constants/Enums';

// ORM 상태를 생성하는 헬퍼 (swim-lanes 셀렉터 테스트와 동일 패턴)
function createOrmState(setupFn) {
  const emptyState = orm.getEmptyState();
  const session = orm.session(emptyState);
  setupFn(session);
  return { orm: session.state };
}

describe('selectCalendarEventsByProjectId', () => {
  it('프로젝트에 속한 일정을 startAt 순서로 반환해야 함 (R6.1)', () => {
    const state = createOrmState((session) => {
      session.Project.create({ id: 'project-1', name: 'Project' });
      session.CalendarEvent.create({
        id: 'ce-late',
        projectId: 'project-1',
        name: 'Later',
        eventKind: CalendarEventKinds.TIME_BASED,
        startAt: '2026-06-20T09:00:00.000Z',
        endAt: '2026-06-20T10:00:00.000Z',
      });
      session.CalendarEvent.create({
        id: 'ce-early',
        projectId: 'project-1',
        name: 'Earlier',
        eventKind: CalendarEventKinds.ALL_DAY,
        startAt: '2026-06-10T00:00:00.000Z',
        endAt: '2026-06-10T00:00:00.000Z',
      });
    });

    const selector = makeSelectCalendarEventsByProjectId();
    const result = selector(state, 'project-1');

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Earlier');
    expect(result[1].name).toBe('Later');
  });

  it('각 일정에 isPersisted 플래그가 포함되어야 함', () => {
    const state = createOrmState((session) => {
      session.Project.create({ id: 'project-1', name: 'Project' });
      session.CalendarEvent.create({
        id: 'ce-1',
        projectId: 'project-1',
        name: 'Persisted',
        eventKind: CalendarEventKinds.ALL_DAY,
        startAt: '2026-06-10T00:00:00.000Z',
        endAt: '2026-06-10T00:00:00.000Z',
      });
      session.CalendarEvent.create({
        id: 'local:1234-0000',
        projectId: 'project-1',
        name: 'Local',
        eventKind: CalendarEventKinds.ALL_DAY,
        startAt: '2026-06-11T00:00:00.000Z',
        endAt: '2026-06-11T00:00:00.000Z',
      });
    });

    const selector = makeSelectCalendarEventsByProjectId();
    const result = selector(state, 'project-1');

    expect(result[0].isPersisted).toBe(true);
    expect(result[1].isPersisted).toBe(false);
  });

  it('일정이 없는 프로젝트는 빈 배열을 반환해야 함', () => {
    const state = createOrmState((session) => {
      session.Project.create({ id: 'project-1', name: 'Empty Project' });
    });

    const selector = makeSelectCalendarEventsByProjectId();
    const result = selector(state, 'project-1');

    expect(result).toEqual([]);
  });

  it('다른 프로젝트의 일정은 포함하지 않아야 함', () => {
    const state = createOrmState((session) => {
      session.Project.create({ id: 'project-1', name: 'Project 1' });
      session.Project.create({ id: 'project-2', name: 'Project 2' });
      session.CalendarEvent.create({
        id: 'ce-1',
        projectId: 'project-1',
        name: 'On Project 1',
        eventKind: CalendarEventKinds.ALL_DAY,
        startAt: '2026-06-10T00:00:00.000Z',
        endAt: '2026-06-10T00:00:00.000Z',
      });
      session.CalendarEvent.create({
        id: 'ce-2',
        projectId: 'project-2',
        name: 'On Project 2',
        eventKind: CalendarEventKinds.ALL_DAY,
        startAt: '2026-06-10T00:00:00.000Z',
        endAt: '2026-06-10T00:00:00.000Z',
      });
    });

    const selector = makeSelectCalendarEventsByProjectId();
    const result = selector(state, 'project-1');

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('On Project 1');
  });

  it('존재하지 않는 프로젝트 ID에 대해 falsy 값을 반환해야 함', () => {
    const state = createOrmState((session) => {
      session.Project.create({ id: 'project-1', name: 'Project' });
    });

    const selector = makeSelectCalendarEventsByProjectId();
    const result = selector(state, 'non-existent');

    expect(result).toBeFalsy();
  });

  it('null ID에 대해 null을 반환해야 함', () => {
    const state = createOrmState(() => {});

    const selector = makeSelectCalendarEventsByProjectId();
    const result = selector(state, null);

    expect(result).toBeNull();
  });
});
