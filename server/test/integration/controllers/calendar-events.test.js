const { expect } = require('chai');
const request = require('supertest');

// 캘린더 일정(CalendarEvent) API 통합 테스트 — 프로젝트 단위 소유권
// 검증 대상 요구사항: R3.4~3.7, R4.4/4.5, R5.2/5.3, R6.1~6.4, R7.5
describe('캘린더 일정 API 통합 테스트', () => {
  let app;
  let project;
  let board;
  let editorUser;
  let viewerUser;
  let nonMemberUser;
  let editorToken;
  let viewerToken;
  let nonMemberToken;

  // 유효한 all-day 일정 입력 생성 헬퍼 (UTC 자정 경계)
  const buildAllDayValues = (overrides = {}) => ({
    name: 'All Day Event',
    eventKind: 'all_day',
    startAt: '2026-06-15T00:00:00.000Z',
    endAt: '2026-06-15T00:00:00.000Z',
    ...overrides,
  });

  // 유효한 time-based 일정 입력 생성 헬퍼
  const buildTimeBasedValues = (overrides = {}) => ({
    name: 'Time Based Event',
    eventKind: 'time_based',
    startAt: '2026-06-15T09:00:00.000Z',
    endAt: '2026-06-15T10:30:00.000Z',
    ...overrides,
  });

  before(async () => {
    app = sails.hooks.http.app;

    // 에디터 역할 멤버 사용자
    editorUser = await User.qm.createOne({
      email: 'calendar-editor@test.com',
      password: 'password123',
      name: 'Calendar Editor',
      role: User.Roles.BOARD_USER,
    });

    // 뷰어 역할 멤버 사용자
    viewerUser = await User.qm.createOne({
      email: 'calendar-viewer@test.com',
      password: 'password123',
      name: 'Calendar Viewer',
      role: User.Roles.BOARD_USER,
    });

    // 비멤버 사용자 (보드 멤버십 없음, 관리자 아님)
    nonMemberUser = await User.qm.createOne({
      email: 'calendar-non-member@test.com',
      password: 'password123',
      name: 'Calendar Non Member',
      role: User.Roles.BOARD_USER,
    });

    // 프로젝트/보드 생성
    project = await Project.create({
      name: 'Calendar Test Project',
    }).fetch();

    board = await Board.create({
      projectId: project.id,
      position: 65536,
      name: 'Calendar Test Board',
    }).fetch();

    // 에디터/뷰어 멤버십 생성 (비멤버는 멤버십 미생성)
    await BoardMembership.create({
      boardId: board.id,
      projectId: project.id,
      userId: editorUser.id,
      role: 'editor',
    });

    await BoardMembership.create({
      boardId: board.id,
      projectId: project.id,
      userId: viewerUser.id,
      role: 'viewer',
    });

    // 각 사용자별 JWT 토큰 + 세션 생성
    const editorTokenResult = sails.helpers.utils.createJwtToken(editorUser.id);
    editorToken = editorTokenResult.token;
    await sails.helpers.sessions.createOne.with({
      values: {
        accessToken: editorToken,
        userId: editorUser.id,
        remoteAddress: '127.0.0.1',
      },
    });

    const viewerTokenResult = sails.helpers.utils.createJwtToken(viewerUser.id);
    viewerToken = viewerTokenResult.token;
    await sails.helpers.sessions.createOne.with({
      values: {
        accessToken: viewerToken,
        userId: viewerUser.id,
        remoteAddress: '127.0.0.1',
      },
    });

    const nonMemberTokenResult = sails.helpers.utils.createJwtToken(nonMemberUser.id);
    nonMemberToken = nonMemberTokenResult.token;
    await sails.helpers.sessions.createOne.with({
      values: {
        accessToken: nonMemberToken,
        userId: nonMemberUser.id,
        remoteAddress: '127.0.0.1',
      },
    });
  });

  after(async () => {
    // 테스트 데이터 정리
    await CalendarEvent.destroy({ projectId: project.id });
    await BoardMembership.destroy({ boardId: board.id });
    await Board.destroyOne({ id: board.id });
    await Project.destroyOne({ id: project.id });
    await Session.destroy({ userId: editorUser.id });
    await Session.destroy({ userId: viewerUser.id });
    await Session.destroy({ userId: nonMemberUser.id });
    await User.destroyOne({ id: editorUser.id });
    await User.destroyOne({ id: viewerUser.id });
    await User.destroyOne({ id: nonMemberUser.id });
  });

  // =========================================================================
  // POST /api/projects/:projectId/calendar-events (생성) — R3.1~3.7, R7.5
  // =========================================================================
  describe('POST /api/projects/:projectId/calendar-events', () => {
    afterEach(async () => {
      await CalendarEvent.destroy({ projectId: project.id });
    });

    it('all-day 일정을 성공적으로 생성하고 { item }을 반환해야 함 (R3.1/3.2)', async () => {
      const res = await request(app)
        .post(`/api/projects/${project.id}/calendar-events`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send(buildAllDayValues({ name: 'Sprint Planning' }))
        .expect(200);

      expect(res.body).to.have.property('item');
      expect(res.body.item).to.have.property('id');
      expect(res.body.item.name).to.equal('Sprint Planning');
      expect(res.body.item.eventKind).to.equal('all_day');
      expect(res.body.item.projectId).to.equal(project.id);

      // DB에 영속되었는지 확인
      const found = await CalendarEvent.findOne({ id: res.body.item.id });
      expect(found).to.exist;
    });

    it('time-based 일정을 성공적으로 생성해야 함 (R3.3)', async () => {
      const res = await request(app)
        .post(`/api/projects/${project.id}/calendar-events`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send(buildTimeBasedValues({ name: 'Standup' }))
        .expect(200);

      expect(res.body.item.eventKind).to.equal('time_based');
      expect(res.body.item.name).to.equal('Standup');
      expect(new Date(res.body.item.endAt).getTime()).to.be.greaterThan(
        new Date(res.body.item.startAt).getTime(),
      );
    });

    it('제목(name) 누락 시 검증 오류(400)를 반환해야 함 (R3.4)', async () => {
      await request(app)
        .post(`/api/projects/${project.id}/calendar-events`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send(buildAllDayValues({ name: undefined }))
        .expect(400);
    });

    it('제목은 있으나 eventKind가 유효하지 않으면 검증 오류(400)를 반환해야 함 (R3.5)', async () => {
      await request(app)
        .post(`/api/projects/${project.id}/calendar-events`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send(buildAllDayValues({ eventKind: 'invalid_kind' }))
        .expect(400);
    });

    it('time-based 일정에서 endAt < startAt이면 422를 반환해야 함 (R3.6)', async () => {
      await request(app)
        .post(`/api/projects/${project.id}/calendar-events`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send(
          buildTimeBasedValues({
            startAt: '2026-06-15T10:00:00.000Z',
            endAt: '2026-06-15T09:00:00.000Z',
          }),
        )
        .expect(422);
    });

    it('all-day 일정에서 endAt 날짜 < startAt 날짜이면 422를 반환해야 함 (R3.7)', async () => {
      await request(app)
        .post(`/api/projects/${project.id}/calendar-events`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send(
          buildAllDayValues({
            startAt: '2026-06-16T00:00:00.000Z',
            endAt: '2026-06-15T00:00:00.000Z',
          }),
        )
        .expect(422);
    });

    it('인증 없이 요청하면 401을 반환해야 함', async () => {
      await request(app)
        .post(`/api/projects/${project.id}/calendar-events`)
        .send(buildAllDayValues())
        .expect(401);
    });
  });

  // =========================================================================
  // PATCH /api/calendar-events/:id (수정) — R4.1~4.5
  // =========================================================================
  describe('PATCH /api/calendar-events/:id', () => {
    let calendarEvent;

    beforeEach(async () => {
      calendarEvent = await CalendarEvent.qm.createOne({
        projectId: project.id,
        name: 'Original Event',
        eventKind: 'all_day',
        startAt: '2026-06-15T00:00:00.000Z',
        endAt: '2026-06-15T00:00:00.000Z',
        creatorUserId: editorUser.id,
      });
    });

    afterEach(async () => {
      await CalendarEvent.destroy({ projectId: project.id });
    });

    it('이름과 시간 범위를 성공적으로 수정해야 함 (R4.1)', async () => {
      const res = await request(app)
        .patch(`/api/calendar-events/${calendarEvent.id}`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({
          name: 'Updated Event',
          startAt: '2026-06-20T00:00:00.000Z',
          endAt: '2026-06-21T00:00:00.000Z',
        })
        .expect(200);

      expect(res.body).to.have.property('item');
      expect(res.body.item.name).to.equal('Updated Event');
    });

    it('일정 종류(all_day → time_based)를 전환할 수 있어야 함 (R4.2)', async () => {
      const res = await request(app)
        .patch(`/api/calendar-events/${calendarEvent.id}`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({
          eventKind: 'time_based',
          startAt: '2026-06-15T09:00:00.000Z',
          endAt: '2026-06-15T10:00:00.000Z',
        })
        .expect(200);

      expect(res.body.item.eventKind).to.equal('time_based');
    });

    it('수정 시 endAt < startAt이면 422를 반환해야 함 (R4.3)', async () => {
      await request(app)
        .patch(`/api/calendar-events/${calendarEvent.id}`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({
          startAt: '2026-06-15T10:00:00.000Z',
          endAt: '2026-06-15T09:00:00.000Z',
        })
        .expect(422);
    });

    it('존재하지 않는 일정에 검증 실패 입력을 보내면 not-found보다 검증 오류(400)를 먼저 반환해야 함 (R4.4)', async () => {
      await request(app)
        .patch('/api/calendar-events/999999999999999999')
        .set('Authorization', `Bearer ${editorToken}`)
        .send({ eventKind: 'invalid_kind' })
        .expect(400);
    });

    it('존재하지 않는 일정에 유효한 입력을 보내면 not-found(404)를 반환해야 함 (R4.5)', async () => {
      await request(app)
        .patch('/api/calendar-events/999999999999999999')
        .set('Authorization', `Bearer ${editorToken}`)
        .send({ name: 'Valid Update' })
        .expect(404);
    });

    it('인증 없이 요청하면 401을 반환해야 함', async () => {
      await request(app)
        .patch(`/api/calendar-events/${calendarEvent.id}`)
        .send({ name: 'No Auth' })
        .expect(401);
    });
  });

  // =========================================================================
  // DELETE /api/calendar-events/:id (삭제) — R5.1~5.3
  // =========================================================================
  describe('DELETE /api/calendar-events/:id', () => {
    let calendarEvent;

    beforeEach(async () => {
      calendarEvent = await CalendarEvent.qm.createOne({
        projectId: project.id,
        name: 'Delete Test Event',
        eventKind: 'all_day',
        startAt: '2026-06-15T00:00:00.000Z',
        endAt: '2026-06-15T00:00:00.000Z',
        creatorUserId: editorUser.id,
      });
    });

    afterEach(async () => {
      await CalendarEvent.destroy({ projectId: project.id });
    });

    it('일정을 성공적으로 삭제해야 함 (R5.1)', async () => {
      const res = await request(app)
        .delete(`/api/calendar-events/${calendarEvent.id}`)
        .set('Authorization', `Bearer ${editorToken}`)
        .expect(200);

      expect(res.body).to.have.property('item');
      expect(res.body.item.id).to.equal(calendarEvent.id);

      // DB에서 삭제 확인
      const found = await CalendarEvent.findOne({ id: calendarEvent.id });
      expect(found).to.be.undefined;
    });

    it('존재하지 않는 일정 삭제 시 not-found(404)를 반환해야 함 (R5.3)', async () => {
      await request(app)
        .delete('/api/calendar-events/999999999999999999')
        .set('Authorization', `Bearer ${editorToken}`)
        .expect(404);
    });

    it('인증 없이 요청하면 401을 반환해야 함', async () => {
      await request(app).delete(`/api/calendar-events/${calendarEvent.id}`).expect(401);
    });
  });

  // =========================================================================
  // 비멤버 접근 제어 — R6.2/6.3 (컨트롤러는 notFound(404)로 매핑하여 프로젝트 존재를 숨김)
  // =========================================================================
  describe('비멤버(Non_Member) 접근 제어', () => {
    let calendarEvent;

    beforeEach(async () => {
      calendarEvent = await CalendarEvent.qm.createOne({
        projectId: project.id,
        name: 'Member Only Event',
        eventKind: 'all_day',
        startAt: '2026-06-15T00:00:00.000Z',
        endAt: '2026-06-15T00:00:00.000Z',
        creatorUserId: editorUser.id,
      });
    });

    afterEach(async () => {
      await CalendarEvent.destroy({ projectId: project.id });
    });

    it('비멤버의 일정 생성은 거부되어야 함 (R6.3 → 404)', async () => {
      await request(app)
        .post(`/api/projects/${project.id}/calendar-events`)
        .set('Authorization', `Bearer ${nonMemberToken}`)
        .send(buildAllDayValues())
        .expect(404);
    });

    it('비멤버의 일정 수정은 거부되어야 함 (R6.3 → 404)', async () => {
      await request(app)
        .patch(`/api/calendar-events/${calendarEvent.id}`)
        .set('Authorization', `Bearer ${nonMemberToken}`)
        .send({ name: 'Hacked' })
        .expect(404);
    });

    it('비멤버의 일정 삭제는 거부되어야 함 (R6.3 → 404)', async () => {
      await request(app)
        .delete(`/api/calendar-events/${calendarEvent.id}`)
        .set('Authorization', `Bearer ${nonMemberToken}`)
        .expect(404);
    });

    it('비멤버의 프로젝트 일정 읽기(projects/show)는 거부되어야 함 (R6.2 → 404)', async () => {
      await request(app)
        .get(`/api/projects/${project.id}`)
        .set('Authorization', `Bearer ${nonMemberToken}`)
        .expect(404);
    });
  });

  // =========================================================================
  // VIEWER 역할 멤버 권한 — R6.4 (역할 무관, 멤버십만으로 CRUD 허용)
  // =========================================================================
  describe('VIEWER 역할 멤버의 일정 CRUD (R6.4)', () => {
    afterEach(async () => {
      await CalendarEvent.destroy({ projectId: project.id });
    });

    it('VIEWER 멤버도 일정을 생성할 수 있어야 함', async () => {
      const res = await request(app)
        .post(`/api/projects/${project.id}/calendar-events`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send(buildAllDayValues({ name: 'Viewer Created' }))
        .expect(200);

      expect(res.body.item.name).to.equal('Viewer Created');
    });

    it('VIEWER 멤버도 일정을 수정할 수 있어야 함', async () => {
      const event = await CalendarEvent.qm.createOne({
        projectId: project.id,
        name: 'Viewer Update Target',
        eventKind: 'all_day',
        startAt: '2026-06-15T00:00:00.000Z',
        endAt: '2026-06-15T00:00:00.000Z',
        creatorUserId: viewerUser.id,
      });

      const res = await request(app)
        .patch(`/api/calendar-events/${event.id}`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ name: 'Viewer Updated' })
        .expect(200);

      expect(res.body.item.name).to.equal('Viewer Updated');
    });

    it('VIEWER 멤버도 일정을 삭제할 수 있어야 함', async () => {
      const event = await CalendarEvent.qm.createOne({
        projectId: project.id,
        name: 'Viewer Delete Target',
        eventKind: 'all_day',
        startAt: '2026-06-15T00:00:00.000Z',
        endAt: '2026-06-15T00:00:00.000Z',
        creatorUserId: viewerUser.id,
      });

      await request(app)
        .delete(`/api/calendar-events/${event.id}`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(200);

      const found = await CalendarEvent.findOne({ id: event.id });
      expect(found).to.be.undefined;
    });
  });

  // =========================================================================
  // projects/show included.calendarEvents — R6.1
  // =========================================================================
  describe('GET /api/projects/:id 의 included.calendarEvents (R6.1)', () => {
    afterEach(async () => {
      await CalendarEvent.destroy({ projectId: project.id });
    });

    it('프로젝트 조회 응답에 해당 프로젝트의 모든 일정이 included.calendarEvents로 포함되어야 함', async () => {
      const created = await CalendarEvent.qm.createOne({
        projectId: project.id,
        name: 'Included Event',
        eventKind: 'all_day',
        startAt: '2026-06-15T00:00:00.000Z',
        endAt: '2026-06-15T00:00:00.000Z',
        creatorUserId: editorUser.id,
      });

      const res = await request(app)
        .get(`/api/projects/${project.id}`)
        .set('Authorization', `Bearer ${editorToken}`)
        .expect(200);

      expect(res.body).to.have.property('included');
      expect(res.body.included).to.have.property('calendarEvents');
      expect(res.body.included.calendarEvents).to.be.an('array');

      const ids = res.body.included.calendarEvents.map((event) => event.id);
      expect(ids).to.include(created.id);
    });
  });

  // =========================================================================
  // 타임존 경계 — R7.5 (all-day는 UTC 자정 경계로 저장, 날짜가 밀리지 않아야 함)
  // =========================================================================
  describe('all-day 일정 타임존 경계 (R7.5)', () => {
    afterEach(async () => {
      await CalendarEvent.destroy({ projectId: project.id });
    });

    it('저장된 start_at/end_at의 UTC date 성분이 입력 날짜와 일치해야 함', async () => {
      const startDate = '2026-03-15';
      const endDate = '2026-03-17';

      const res = await request(app)
        .post(`/api/projects/${project.id}/calendar-events`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send(
          buildAllDayValues({
            name: 'Multi Day All Day',
            startAt: `${startDate}T00:00:00.000Z`,
            endAt: `${endDate}T00:00:00.000Z`,
          }),
        )
        .expect(200);

      // 응답의 UTC date 성분 검증 (로컬 타임존과 무관하게 입력 날짜 유지)
      expect(new Date(res.body.item.startAt).toISOString().slice(0, 10)).to.equal(startDate);
      expect(new Date(res.body.item.endAt).toISOString().slice(0, 10)).to.equal(endDate);

      // DB에 저장된 값도 동일한 UTC date 성분을 가져야 함
      const stored = await CalendarEvent.findOne({ id: res.body.item.id });
      expect(new Date(stored.startAt).toISOString().slice(0, 10)).to.equal(startDate);
      expect(new Date(stored.endAt).toISOString().slice(0, 10)).to.equal(endDate);
    });
  });
});
