const { expect } = require('chai');
const request = require('supertest');

// 공휴일 연동 통합 테스트 — 프로젝트 단위 endpoint
// - 외부 fetch 모킹: endpoint 미설정 → [], 실패/타임아웃 → [], 파싱불가 → [], 정상 정규화
// - endpoint 저장 권한: 비-매니저 멤버 거부, project manager 저장/clear 성공, 비-http/https 스킴 거부
//
// sinon 미사용(devDependencies 부재) — 외부 HTTP 호출은 global fetch 를 직접 스텁하여
// 실제 fetch-holidays 헬퍼 + adapt-holidays 어댑터 경로를 결정론적으로 검증한다.
describe('공휴일 연동 통합 테스트', () => {
  let app;
  let project;
  let board;
  let managerUser; // 프로젝트 관리자(holidayApiEndpoint 설정 가능)
  let viewerUser; // 일반 보드 멤버(설정 변경 불가, 조회는 가능)
  let managerToken;
  let viewerToken;

  // 원본 global fetch 보관 — 각 테스트에서 스텁 후 복원
  const originalFetch = global.fetch;

  // 스트리밍 응답을 흉내내는 가짜 fetch Response 빌더.
  // fetch-holidays 헬퍼는 response.ok 와 response.body.getReader() 를 사용한다.
  const makeFetchResponse = (bodyString, { ok = true } = {}) => ({
    ok,
    body: {
      getReader() {
        let sent = false;
        return {
          read() {
            if (sent) {
              return Promise.resolve({ done: true, value: undefined });
            }
            sent = true;
            return Promise.resolve({ done: false, value: Buffer.from(bodyString) });
          },
          cancel() {},
        };
      },
    },
  });

  // project.holidayApiEndpoint 값을 설정/해제하는 헬퍼
  const setProjectEndpoint = (value) =>
    Project.updateOne({ id: project.id }).set({ holidayApiEndpoint: value });

  before(async () => {
    app = sails.hooks.http.app;

    managerUser = await User.qm.createOne({
      email: 'calendar-holiday-manager@test.com',
      password: 'password123',
      name: 'Calendar Holiday Manager',
    });

    viewerUser = await User.qm.createOne({
      email: 'calendar-holiday-viewer@test.com',
      password: 'password123',
      name: 'Calendar Holiday Viewer',
    });

    project = await Project.create({
      name: 'Calendar Holiday Test Project',
    }).fetch();

    board = await Board.create({
      projectId: project.id,
      position: 65536,
      name: 'Calendar Holiday Test Board',
    }).fetch();

    // managerUser 를 프로젝트 관리자로 등록 → projects/update 에서 holidayApiEndpoint 설정 허용
    await ProjectManager.qm.createOne({
      projectId: project.id,
      userId: managerUser.id,
    });

    // 두 사용자 모두 보드 멤버십 보유 → 공휴일 GET 조회 가능
    await BoardMembership.create({
      boardId: board.id,
      projectId: project.id,
      userId: managerUser.id,
      role: 'editor',
    });

    await BoardMembership.create({
      boardId: board.id,
      projectId: project.id,
      userId: viewerUser.id,
      role: 'viewer',
    });

    const managerTokenResult = sails.helpers.utils.createJwtToken(managerUser.id);
    managerToken = managerTokenResult.token;
    await sails.helpers.sessions.createOne.with({
      values: {
        accessToken: managerToken,
        userId: managerUser.id,
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
  });

  after(async () => {
    global.fetch = originalFetch;

    await BoardMembership.destroy({ boardId: board.id });
    await ProjectManager.destroy({ projectId: project.id });
    await Board.destroyOne({ id: board.id });
    await Project.destroyOne({ id: project.id });
    await Session.destroy({ userId: managerUser.id });
    await Session.destroy({ userId: viewerUser.id });
    await User.destroyOne({ id: managerUser.id });
    await User.destroyOne({ id: viewerUser.id });
  });

  // =========================================================================
  // GET /api/projects/:projectId/holidays (외부 fetch 모킹)
  // =========================================================================
  describe('GET /api/projects/:projectId/holidays', () => {
    afterEach(async () => {
      // fetch 스텁 복원 및 endpoint 초기화(다음 테스트 격리)
      global.fetch = originalFetch;
      await setProjectEndpoint(null);
    });

    it('endpoint 미설정이면 외부 호출 없이 빈 배열을 반환해야 함 (R10.4)', async () => {
      await setProjectEndpoint(null);

      // endpoint 가 없으면 헬퍼가 fetch 이전에 [] 를 반환하므로 외부 호출이 일어나면 안 됨
      let fetchCalled = false;
      global.fetch = () => {
        fetchCalled = true;
        return Promise.reject(new Error('should not be called'));
      };

      const res = await request(app)
        .get(`/api/projects/${project.id}/holidays`)
        .query({ year: 2026, month: 6 })
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(200);

      expect(res.body).to.have.property('items');
      expect(res.body.items).to.be.an('array').that.is.empty;
      expect(fetchCalled).to.equal(false);
    });

    it('외부 fetch 실패/타임아웃 시 빈 배열을 반환해야 함 (R11.1)', async () => {
      await setProjectEndpoint('https://holidays.example.com/api');

      // 네트워크 오류/타임아웃(AbortError) 모사: fetch 가 reject
      global.fetch = () => Promise.reject(new Error('network failure'));

      const res = await request(app)
        .get(`/api/projects/${project.id}/holidays`)
        .query({ year: 2026, month: 6 })
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(200);

      expect(res.body.items).to.be.an('array').that.is.empty;
    });

    it('비-OK 응답이면 빈 배열을 반환해야 함 (R11.1)', async () => {
      await setProjectEndpoint('https://holidays.example.com/api');

      global.fetch = () => Promise.resolve(makeFetchResponse('Server Error', { ok: false }));

      const res = await request(app)
        .get(`/api/projects/${project.id}/holidays`)
        .query({ year: 2026, month: 6 })
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(200);

      expect(res.body.items).to.be.an('array').that.is.empty;
    });

    it('JSON 파싱 불가 응답이면 빈 배열을 반환해야 함 (R11.4)', async () => {
      await setProjectEndpoint('https://holidays.example.com/api');

      // 유효하지 않은 JSON → JSON.parse 실패 → []
      global.fetch = () => Promise.resolve(makeFetchResponse('<<<not json>>>'));

      const res = await request(app)
        .get(`/api/projects/${project.id}/holidays`)
        .query({ year: 2026, month: 6 })
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(200);

      expect(res.body.items).to.be.an('array').that.is.empty;
    });

    it('인식할 수 없는 응답 형태이면 빈 배열을 반환해야 함 (R11.4)', async () => {
      await setProjectEndpoint('https://holidays.example.com/api');

      // 유효한 JSON 이지만 어댑터가 인식하지 못하는 형태 → []
      global.fetch = () =>
        Promise.resolve(makeFetchResponse(JSON.stringify({ data: { foo: 'bar' } })));

      const res = await request(app)
        .get(`/api/projects/${project.id}/holidays`)
        .query({ year: 2026, month: 6 })
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(200);

      expect(res.body.items).to.be.an('array').that.is.empty;
    });

    it('정상 응답을 [{date, name}] 형태로 정규화하여 반환해야 함', async () => {
      await setProjectEndpoint('https://holidays.example.com/api');

      // 배열/대체 키/ISO 타임스탬프가 섞인 응답을 정규화
      const payload = [
        { date: '2026-06-06', name: 'Memorial Day' },
        { localDate: '2026-06-15T00:00:00.000Z', localName: '  Custom Holiday  ' },
        { date: 'invalid', name: 'Dropped' }, // 날짜 인식 불가 → 제외
      ];
      global.fetch = () => Promise.resolve(makeFetchResponse(JSON.stringify(payload)));

      const res = await request(app)
        .get(`/api/projects/${project.id}/holidays`)
        .query({ year: 2026, month: 6 })
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(200);

      expect(res.body.items).to.deep.equal([
        { date: '2026-06-06', name: 'Memorial Day' },
        { date: '2026-06-15', name: 'Custom Holiday' },
      ]);
    });

    it('{ items: [...] } 래핑 응답도 정규화해야 함', async () => {
      await setProjectEndpoint('https://holidays.example.com/api');

      global.fetch = () =>
        Promise.resolve(
          makeFetchResponse(
            JSON.stringify({ items: [{ date: '2026-06-06', title: 'Memorial Day' }] }),
          ),
        );

      const res = await request(app)
        .get(`/api/projects/${project.id}/holidays`)
        .query({ year: 2026, month: 6 })
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(200);

      expect(res.body.items).to.deep.equal([{ date: '2026-06-06', name: 'Memorial Day' }]);
    });

    it('비멤버는 404를 반환해야 함 (R6.2/13.4)', async () => {
      await setProjectEndpoint('https://holidays.example.com/api');

      // 보드 멤버십이 없는 사용자
      const outsider = await User.qm.createOne({
        email: 'calendar-holiday-outsider@test.com',
        password: 'password123',
        name: 'Calendar Holiday Outsider',
      });
      const outsiderTokenResult = sails.helpers.utils.createJwtToken(outsider.id);
      await sails.helpers.sessions.createOne.with({
        values: {
          accessToken: outsiderTokenResult.token,
          userId: outsider.id,
          remoteAddress: '127.0.0.1',
        },
      });

      await request(app)
        .get(`/api/projects/${project.id}/holidays`)
        .query({ year: 2026, month: 6 })
        .set('Authorization', `Bearer ${outsiderTokenResult.token}`)
        .expect(404);

      await Session.destroy({ userId: outsider.id });
      await User.destroyOne({ id: outsider.id });
    });

    it('인증 없이 요청하면 401을 반환해야 함', async () => {
      await request(app)
        .get(`/api/projects/${project.id}/holidays`)
        .query({ year: 2026, month: 6 })
        .expect(401);
    });
  });

  // =========================================================================
  // PATCH /api/projects/:id (holidayApiEndpoint 저장 권한 / 스킴 검증)
  // =========================================================================
  describe('PATCH /api/projects/:id (holidayApiEndpoint)', () => {
    afterEach(async () => {
      await setProjectEndpoint(null);
    });

    it('비-매니저 멤버의 holidayApiEndpoint 변경은 거부되어야 함 (R9.6)', async () => {
      // 유효한 https URL 이므로 입력 검증은 통과하지만 권한 게이트에서 거부됨
      await request(app)
        .patch(`/api/projects/${project.id}`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ holidayApiEndpoint: 'https://holidays.example.com/api' })
        .expect(403);

      // DB 가 변경되지 않았는지 확인
      const found = await Project.findOne({ id: project.id });
      expect(found.holidayApiEndpoint).to.not.equal('https://holidays.example.com/api');
    });

    it('프로젝트 관리자는 유효한 https endpoint 를 저장할 수 있어야 함 (R9.2/9.6)', async () => {
      const endpoint = 'https://holidays.example.com/api';

      const res = await request(app)
        .patch(`/api/projects/${project.id}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ holidayApiEndpoint: endpoint })
        .expect(200);

      expect(res.body).to.have.property('item');
      expect(res.body.item.holidayApiEndpoint).to.equal(endpoint);

      const found = await Project.findOne({ id: project.id });
      expect(found.holidayApiEndpoint).to.equal(endpoint);
    });

    it('프로젝트 관리자는 http endpoint 도 저장할 수 있어야 함 (R9.7)', async () => {
      const endpoint = 'http://holidays.example.com:8010/holidays';

      const res = await request(app)
        .patch(`/api/projects/${project.id}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ holidayApiEndpoint: endpoint })
        .expect(200);

      expect(res.body.item.holidayApiEndpoint).to.equal(endpoint);
    });

    it('프로젝트 관리자는 빈 문자열로 endpoint 를 해제할 수 있어야 함 (R9.5)', async () => {
      // 먼저 값 설정
      await setProjectEndpoint('https://holidays.example.com/api');

      const res = await request(app)
        .patch(`/api/projects/${project.id}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ holidayApiEndpoint: '' })
        .expect(200);

      // 빈 값으로 해제됨(빈 문자열 또는 null)
      expect(res.body.item.holidayApiEndpoint || '').to.equal('');
    });

    it('비-http/https 스킴(ftp)은 검증 오류로 거부되어야 함 (R9.7)', async () => {
      await request(app)
        .patch(`/api/projects/${project.id}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ holidayApiEndpoint: 'ftp://holidays.example.com/api' })
        .expect(400);
    });

    it('구문상 유효하지 않은 URL 은 검증 오류로 거부되어야 함 (R9.4)', async () => {
      await request(app)
        .patch(`/api/projects/${project.id}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ holidayApiEndpoint: 'not a valid url' })
        .expect(400);
    });
  });
});
