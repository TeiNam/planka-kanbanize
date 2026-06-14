/*!
 * CalendarEvent redux-orm 리듀서 단위 테스트
 *
 * 검증 범위:
 * - 실시간 핸들 액션(CREATE/UPDATE/DELETE_HANDLE)의 정상 upsert/delete (R12.4)
 * - 멱등성: 동일 create/update 메시지를 중복 수신해도 상태가 동일 (Correctness Property 7)
 * - 손상 메시지 스킵: item/id 누락 메시지는 크래시 없이 상태를 변경하지 않음 (R12.4)
 *
 * 리듀서는 모델의 정적 메서드이므로 세션 바인딩 모델을 인자로 직접 호출한다.
 */

import orm from '../../orm';
import CalendarEvent from '../../models/CalendarEvent';
import ActionTypes from '../../constants/ActionTypes';
import { CalendarEventKinds } from '../../constants/Enums';

// 액션 시퀀스를 빈 세션에 적용하고 결과 세션을 반환한다.
function applyActions(actions) {
  const session = orm.session(orm.getEmptyState());
  actions.forEach((action) => {
    CalendarEvent.reducer(action, session.CalendarEvent, session);
  });
  return session;
}

const sampleEvent = {
  id: 'ce-1',
  projectId: 'project-1',
  name: 'Sprint Review',
  eventKind: CalendarEventKinds.TIME_BASED,
  startAt: '2026-06-15T09:00:00.000Z',
  endAt: '2026-06-15T10:00:00.000Z',
  color: null,
};

describe('CalendarEvent reducer - 실시간 핸들 액션', () => {
  it('CALENDAR_EVENT_CREATE_HANDLE 수신 시 일정을 upsert 해야 함', () => {
    const session = applyActions([
      { type: ActionTypes.CALENDAR_EVENT_CREATE_HANDLE, payload: { calendarEvent: sampleEvent } },
    ]);

    const records = session.CalendarEvent.all().toRefArray();
    expect(records).toHaveLength(1);
    expect(records[0].name).toBe('Sprint Review');
  });

  it('CALENDAR_EVENT_UPDATE_HANDLE 수신 시 기존 일정을 갱신해야 함', () => {
    const session = applyActions([
      { type: ActionTypes.CALENDAR_EVENT_CREATE_HANDLE, payload: { calendarEvent: sampleEvent } },
      {
        type: ActionTypes.CALENDAR_EVENT_UPDATE_HANDLE,
        payload: { calendarEvent: { ...sampleEvent, name: 'Updated Review' } },
      },
    ]);

    const records = session.CalendarEvent.all().toRefArray();
    expect(records).toHaveLength(1);
    expect(records[0].name).toBe('Updated Review');
  });

  it('CALENDAR_EVENT_DELETE_HANDLE 수신 시 일정을 삭제해야 함', () => {
    const session = applyActions([
      { type: ActionTypes.CALENDAR_EVENT_CREATE_HANDLE, payload: { calendarEvent: sampleEvent } },
      {
        type: ActionTypes.CALENDAR_EVENT_DELETE_HANDLE,
        payload: { calendarEvent: { id: 'ce-1' } },
      },
    ]);

    expect(session.CalendarEvent.all().toRefArray()).toHaveLength(0);
  });
});

describe('CalendarEvent reducer - 프로젝트 fetch 적재 (projects/show included)', () => {
  it('PROJECT_UPDATE_HANDLE 의 calendarEvents 를 upsert 해야 함', () => {
    const session = applyActions([
      {
        type: ActionTypes.PROJECT_UPDATE_HANDLE,
        payload: {
          calendarEvents: [sampleEvent, { ...sampleEvent, id: 'ce-2', name: 'Planning' }],
        },
      },
    ]);

    const records = session.CalendarEvent.all().toRefArray();
    expect(records).toHaveLength(2);
    expect(records.map((record) => record.id).sort()).toEqual(['ce-1', 'ce-2']);
  });

  it('PROJECT_CREATE_HANDLE 의 calendarEvents 를 upsert 해야 함', () => {
    const session = applyActions([
      {
        type: ActionTypes.PROJECT_CREATE_HANDLE,
        payload: {
          calendarEvents: [sampleEvent],
        },
      },
    ]);

    expect(session.CalendarEvent.all().toRefArray()).toHaveLength(1);
  });

  it('calendarEvents 가 없는 프로젝트 핸들은 크래시 없이 무시해야 함', () => {
    expect(() => {
      const session = applyActions([{ type: ActionTypes.PROJECT_UPDATE_HANDLE, payload: {} }]);
      expect(session.CalendarEvent.all().toRefArray()).toHaveLength(0);
    }).not.toThrow();
  });
});

describe('CalendarEvent reducer - 멱등성 (Correctness Property 7)', () => {
  it('동일 create 메시지를 두 번 수신해도 단일 레코드를 유지해야 함', () => {
    const single = applyActions([
      { type: ActionTypes.CALENDAR_EVENT_CREATE_HANDLE, payload: { calendarEvent: sampleEvent } },
    ]);
    const doubled = applyActions([
      { type: ActionTypes.CALENDAR_EVENT_CREATE_HANDLE, payload: { calendarEvent: sampleEvent } },
      { type: ActionTypes.CALENDAR_EVENT_CREATE_HANDLE, payload: { calendarEvent: sampleEvent } },
    ]);

    const singleRecords = single.CalendarEvent.all().toRefArray();
    const doubledRecords = doubled.CalendarEvent.all().toRefArray();

    expect(doubledRecords).toHaveLength(1);
    expect(doubledRecords).toEqual(singleRecords);
  });

  it('동일 update 메시지를 두 번 수신해도 상태가 동일해야 함', () => {
    const once = applyActions([
      { type: ActionTypes.CALENDAR_EVENT_CREATE_HANDLE, payload: { calendarEvent: sampleEvent } },
      {
        type: ActionTypes.CALENDAR_EVENT_UPDATE_HANDLE,
        payload: { calendarEvent: { ...sampleEvent, name: 'Final' } },
      },
    ]);
    const twice = applyActions([
      { type: ActionTypes.CALENDAR_EVENT_CREATE_HANDLE, payload: { calendarEvent: sampleEvent } },
      {
        type: ActionTypes.CALENDAR_EVENT_UPDATE_HANDLE,
        payload: { calendarEvent: { ...sampleEvent, name: 'Final' } },
      },
      {
        type: ActionTypes.CALENDAR_EVENT_UPDATE_HANDLE,
        payload: { calendarEvent: { ...sampleEvent, name: 'Final' } },
      },
    ]);

    expect(twice.CalendarEvent.all().toRefArray()).toEqual(once.CalendarEvent.all().toRefArray());
  });
});

describe('CalendarEvent reducer - 손상 메시지 스킵 (R12.4)', () => {
  it('item 이 없는 create 핸들은 크래시 없이 상태를 변경하지 않아야 함', () => {
    expect(() => {
      const session = applyActions([
        // socket 핸들러는 손상 메시지에서 item=undefined 로 핸들 액션을 만든다.
        { type: ActionTypes.CALENDAR_EVENT_CREATE_HANDLE, payload: { calendarEvent: undefined } },
      ]);
      expect(session.CalendarEvent.all().toRefArray()).toHaveLength(0);
    }).not.toThrow();
  });

  it('id 가 없는 update 핸들은 크래시 없이 기존 상태를 보존해야 함', () => {
    let session;
    expect(() => {
      session = applyActions([
        {
          type: ActionTypes.CALENDAR_EVENT_CREATE_HANDLE,
          payload: { calendarEvent: sampleEvent },
        },
        {
          type: ActionTypes.CALENDAR_EVENT_UPDATE_HANDLE,
          payload: { calendarEvent: { name: 'No id' } },
        },
      ]);
    }).not.toThrow();

    const records = session.CalendarEvent.all().toRefArray();
    expect(records).toHaveLength(1);
    expect(records[0].name).toBe('Sprint Review');
  });

  it('item 이 없는 delete 핸들은 크래시 없이 기존 상태를 보존해야 함', () => {
    let session;
    expect(() => {
      session = applyActions([
        {
          type: ActionTypes.CALENDAR_EVENT_CREATE_HANDLE,
          payload: { calendarEvent: sampleEvent },
        },
        {
          type: ActionTypes.CALENDAR_EVENT_DELETE_HANDLE,
          payload: { calendarEvent: undefined },
        },
      ]);
    }).not.toThrow();

    expect(session.CalendarEvent.all().toRefArray()).toHaveLength(1);
  });
});
