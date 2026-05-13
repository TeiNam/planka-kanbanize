const request = require('supertest');
const { expect } = require('chai');

describe('Metrics API (controllers)', () => {
  let project;
  let board;
  let user;
  let nonMemberUser;
  let accessToken;
  let nonMemberToken;
  let listBacklog;
  let listDev;
  let listTest;
  let listDone;
  let commitmentPoint;
  let deliveryPoint; // eslint-disable-line no-unused-vars

  before(async () => {
    // 테스트용 사용자 생성
    user = await User.qm.createOne({
      email: 'metrics-test@test.com',
      password: 'password123',
      name: 'Metrics Test User',
    });

    nonMemberUser = await User.qm.createOne({
      email: 'metrics-nonmember@test.com',
      password: 'password123',
      name: 'Non Member User',
    });

    // 테스트용 프로젝트 생성
    project = await Project.create({
      name: 'Metrics Test Project',
    }).fetch();

    // 테스트용 보드 생성
    board = await Board.create({
      projectId: project.id,
      position: 65536,
      name: 'Metrics Test Board',
    }).fetch();

    // 보드 멤버십 생성 (viewer 권한 — 메트릭은 뷰어도 접근 가능)
    await BoardMembership.create({
      boardId: board.id,
      userId: user.id,
      role: 'viewer',
    });

    // 리스트 4개 생성
    listBacklog = await List.qm.createOne({
      boardId: board.id,
      type: 'active',
      position: 65536,
      name: 'Backlog',
    });

    listDev = await List.qm.createOne({
      boardId: board.id,
      type: 'active',
      position: 131072,
      name: 'Dev',
    });

    listTest = await List.qm.createOne({
      boardId: board.id,
      type: 'active',
      position: 196608,
      name: 'Test',
    });

    listDone = await List.qm.createOne({
      boardId: board.id,
      type: 'active',
      position: 262144,
      name: 'Done',
    });

    // Commitment Point: Backlog | Dev
    commitmentPoint = await CommitmentPoint.qm.createOne({
      boardId: board.id,
      leftListId: listBacklog.id,
      rightListId: listDev.id,
      position: 65536,
      type: 'commitment',
    });

    // Delivery Point: Test | Done
    deliveryPoint = await CommitmentPoint.qm.createOne({
      boardId: board.id,
      leftListId: listTest.id,
      rightListId: listDone.id,
      position: 131072,
      type: 'delivery',
    });

    // 인증 토큰 획득
    const res = await request(sails.hooks.http.app)
      .post('/api/access-tokens')
      .send({ emailOrUsername: 'metrics-test@test.com', password: 'password123' });
    accessToken = res.body.item;

    const res2 = await request(sails.hooks.http.app)
      .post('/api/access-tokens')
      .send({ emailOrUsername: 'metrics-nonmember@test.com', password: 'password123' });
    nonMemberToken = res2.body.item;
  });

  after(async () => {
    await BoardDailySnapshot.destroy({ boardId: board.id });
    await CardCommitmentLog.destroy({});
    await CardMovementLog.destroy({ boardId: board.id });
    await Card.destroy({ boardId: board.id });
    await CommitmentPoint.destroy({ boardId: board.id });
    await List.destroy({ boardId: board.id });
    await BoardMembership.destroy({ boardId: board.id });
    await Board.destroyOne({ id: board.id });
    await Project.destroyOne({ id: project.id });
    await User.destroyOne({ id: user.id });
    await User.destroyOne({ id: nonMemberUser.id });
  });

  // ─── CFD ────────────────────────────────────────────────────────────────────

  describe('GET /api/boards/:boardId/metrics/cfd', () => {
    afterEach(async () => {
      await BoardDailySnapshot.destroy({ boardId: board.id });
    });

    it('스냅샷 데이터가 있을 때 CFD 데이터를 반환해야 함', async () => {
      // 스냅샷 데이터 생성 (3일치)
      const dates = ['2025-01-10', '2025-01-11', '2025-01-12'];
      await Promise.all(
        dates.map(async (date) => {
          await BoardDailySnapshot.qm.createOne({
            boardId: board.id,
            listId: listBacklog.id,
            cardCount: 5,
            snapshotDate: date,
          });
          await BoardDailySnapshot.qm.createOne({
            boardId: board.id,
            listId: listDev.id,
            cardCount: 3,
            snapshotDate: date,
          });
        }),
      );

      const res = await request(sails.hooks.http.app)
        .get(`/api/boards/${board.id}/metrics/cfd`)
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ startDate: '2025-01-10', endDate: '2025-01-12' })
        .expect(200);

      expect(res.body.item).to.exist;
      expect(res.body.item.dates).to.be.an('array').with.lengthOf(3);
      expect(res.body.item.lists).to.be.an('array');
      expect(res.body.item.lists.length).to.be.greaterThan(0);

      // 각 리스트에 counts 배열이 있어야 함
      const backlogList = res.body.item.lists.find((l) => l.listId === listBacklog.id);
      expect(backlogList).to.exist;
      expect(backlogList.counts).to.be.an('array').with.lengthOf(3);
      expect(backlogList.counts[0]).to.equal(5);
    });

    it('기본 날짜 범위는 30일이어야 함', async () => {
      const res = await request(sails.hooks.http.app)
        .get(`/api/boards/${board.id}/metrics/cfd`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.item).to.exist;
      expect(res.body.item.dates).to.be.an('array');
      expect(res.body.item.lists).to.be.an('array');
    });

    it('스냅샷이 없을 때 빈 데이터를 반환해야 함', async () => {
      const res = await request(sails.hooks.http.app)
        .get(`/api/boards/${board.id}/metrics/cfd`)
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ startDate: '2020-01-01', endDate: '2020-01-10' })
        .expect(200);

      expect(res.body.item).to.exist;
      expect(res.body.item.dates).to.be.an('array').with.lengthOf(0);
    });

    it('날짜 범위가 365일을 초과하면 400을 반환해야 함', async () => {
      await request(sails.hooks.http.app)
        .get(`/api/boards/${board.id}/metrics/cfd`)
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ startDate: '2023-01-01', endDate: '2024-06-01' })
        .expect(400);
    });

    it('날짜 범위가 1일 미만이면 400을 반환해야 함', async () => {
      await request(sails.hooks.http.app)
        .get(`/api/boards/${board.id}/metrics/cfd`)
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ startDate: '2025-01-10', endDate: '2025-01-10' })
        .expect(400);
    });
  });

  // ─── Lead Time ──────────────────────────────────────────────────────────────

  describe('GET /api/boards/:boardId/metrics/lead-time', () => {
    afterEach(async () => {
      await CardCommitmentLog.destroy({});
      await Card.destroy({ boardId: board.id });
    });

    it('완료된 카드가 있을 때 Lead Time 분포를 반환해야 함', async () => {
      // 완료된 카드 생성 (commitment log 포함)
      const card = await Card.qm.createOne({
        boardId: board.id,
        listId: listDone.id,
        position: 65536,
        name: 'Completed Card',
        type: 'card',
        completedAt: new Date().toISOString(),
      });

      await CardCommitmentLog.create({
        cardId: card.id,
        commitmentPointId: commitmentPoint.id,
        direction: 'forward',
        passedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      });

      const res = await request(sails.hooks.http.app)
        .get(`/api/boards/${board.id}/metrics/lead-time`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.item).to.exist;
      expect(res.body.item.values).to.be.an('array').with.lengthOf(1);
      expect(res.body.item.percentile85).to.be.a('number');
      expect(res.body.item.average).to.be.a('number');
      expect(res.body.item.median).to.be.a('number');
    });

    it('classOfServiceId로 필터링할 수 있어야 함', async () => {
      // CoS 생성
      const cos = await ClassOfService.qm.createOne({
        boardId: board.id,
        name: 'Standard',
        type: 'standard',
        color: 'blue',
        position: 65536,
      });

      // CoS가 할당된 완료 카드
      const card = await Card.qm.createOne({
        boardId: board.id,
        listId: listDone.id,
        position: 65536,
        name: 'CoS Card',
        type: 'card',
        completedAt: new Date().toISOString(),
        classOfServiceId: cos.id,
      });

      await CardCommitmentLog.create({
        cardId: card.id,
        commitmentPointId: commitmentPoint.id,
        direction: 'forward',
        passedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      });

      // CoS가 없는 완료 카드
      const card2 = await Card.qm.createOne({
        boardId: board.id,
        listId: listDone.id,
        position: 131072,
        name: 'No CoS Card',
        type: 'card',
        completedAt: new Date().toISOString(),
      });

      await CardCommitmentLog.create({
        cardId: card2.id,
        commitmentPointId: commitmentPoint.id,
        direction: 'forward',
        passedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

      // CoS 필터 적용
      const res = await request(sails.hooks.http.app)
        .get(`/api/boards/${board.id}/metrics/lead-time`)
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ classOfServiceId: cos.id })
        .expect(200);

      expect(res.body.item.values).to.have.lengthOf(1);

      // 정리
      await ClassOfService.destroyOne({ id: cos.id });
    });

    it('완료된 카드가 없을 때 빈 결과를 반환해야 함', async () => {
      const res = await request(sails.hooks.http.app)
        .get(`/api/boards/${board.id}/metrics/lead-time`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.item.values).to.be.an('array').with.lengthOf(0);
      expect(res.body.item.percentile85).to.equal(0);
      expect(res.body.item.average).to.equal(0);
      expect(res.body.item.median).to.equal(0);
    });
  });

  // ─── Throughput ─────────────────────────────────────────────────────────────

  describe('GET /api/boards/:boardId/metrics/throughput', () => {
    afterEach(async () => {
      await Card.destroy({ boardId: board.id });
    });

    it('완료된 카드가 있을 때 주 단위 Throughput을 반환해야 함', async () => {
      // 같은 주에 완료된 카드 2개 생성
      const now = new Date();
      await Card.qm.createOne({
        boardId: board.id,
        listId: listDone.id,
        position: 65536,
        name: 'Done Card 1',
        type: 'card',
        completedAt: now.toISOString(),
      });
      await Card.qm.createOne({
        boardId: board.id,
        listId: listDone.id,
        position: 131072,
        name: 'Done Card 2',
        type: 'card',
        completedAt: now.toISOString(),
      });

      const res = await request(sails.hooks.http.app)
        .get(`/api/boards/${board.id}/metrics/throughput`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.item).to.exist;
      expect(res.body.item.weeks).to.be.an('array').with.lengthOf(1);
      expect(res.body.item.weeks[0].count).to.equal(2);
      expect(res.body.item.average).to.be.a('number');
      expect(res.body.item.average).to.equal(2);
    });

    it('classOfServiceId로 필터링할 수 있어야 함', async () => {
      const cos = await ClassOfService.qm.createOne({
        boardId: board.id,
        name: 'Expedite',
        type: 'expedite',
        color: 'red',
        position: 65536,
      });

      await Card.qm.createOne({
        boardId: board.id,
        listId: listDone.id,
        position: 65536,
        name: 'Expedite Card',
        type: 'card',
        completedAt: new Date().toISOString(),
        classOfServiceId: cos.id,
      });

      await Card.qm.createOne({
        boardId: board.id,
        listId: listDone.id,
        position: 131072,
        name: 'Normal Card',
        type: 'card',
        completedAt: new Date().toISOString(),
      });

      const res = await request(sails.hooks.http.app)
        .get(`/api/boards/${board.id}/metrics/throughput`)
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ classOfServiceId: cos.id })
        .expect(200);

      expect(res.body.item.weeks).to.have.lengthOf(1);
      expect(res.body.item.weeks[0].count).to.equal(1);

      await ClassOfService.destroyOne({ id: cos.id });
    });

    it('완료된 카드가 없을 때 빈 결과를 반환해야 함', async () => {
      const res = await request(sails.hooks.http.app)
        .get(`/api/boards/${board.id}/metrics/throughput`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.item.weeks).to.be.an('array').with.lengthOf(0);
      expect(res.body.item.average).to.equal(0);
    });
  });

  // ─── WIP Aging ──────────────────────────────────────────────────────────────

  describe('GET /api/boards/:boardId/metrics/wip-aging', () => {
    afterEach(async () => {
      await CardMovementLog.destroy({ boardId: board.id });
      await Card.destroy({ boardId: board.id });
    });

    it('진행 중 카드의 컬럼별 체류 일수를 반환해야 함', async () => {
      // Dev 컬럼에 카드 생성 (2일 전 생성)
      await Card.qm.createOne({
        boardId: board.id,
        listId: listDev.id,
        position: 65536,
        name: 'In Progress Card',
        type: 'card',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      });

      const res = await request(sails.hooks.http.app)
        .get(`/api/boards/${board.id}/metrics/wip-aging`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.item).to.exist;
      expect(res.body.item.lists).to.be.an('array');

      // Dev 리스트에 카드가 있어야 함
      const devList = res.body.item.lists.find((l) => l.listId === listDev.id);
      expect(devList).to.exist;
      expect(devList.cards).to.be.an('array').with.lengthOf(1);
      expect(devList.cards[0].age).to.be.at.least(1);
    });

    it('classOfServiceId로 필터링할 수 있어야 함', async () => {
      const cos = await ClassOfService.qm.createOne({
        boardId: board.id,
        name: 'Standard Filter',
        type: 'standard',
        color: 'green',
        position: 65536,
      });

      await Card.qm.createOne({
        boardId: board.id,
        listId: listDev.id,
        position: 65536,
        name: 'CoS Card',
        type: 'card',
        classOfServiceId: cos.id,
      });

      await Card.qm.createOne({
        boardId: board.id,
        listId: listDev.id,
        position: 131072,
        name: 'No CoS Card',
        type: 'card',
      });

      const res = await request(sails.hooks.http.app)
        .get(`/api/boards/${board.id}/metrics/wip-aging`)
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ classOfServiceId: cos.id })
        .expect(200);

      // CoS 필터 적용 시 해당 카드만 반환
      const devList = res.body.item.lists.find((l) => l.listId === listDev.id);
      if (devList) {
        expect(devList.cards).to.have.lengthOf(1);
        expect(devList.cards[0].name).to.equal('CoS Card');
      }

      await ClassOfService.destroyOne({ id: cos.id });
    });
  });

  // ─── Summary (Little's Law) ─────────────────────────────────────────────────

  describe('GET /api/boards/:boardId/metrics/summary', () => {
    afterEach(async () => {
      await BoardDailySnapshot.destroy({ boardId: board.id });
      await Card.destroy({ boardId: board.id });
    });

    it("Little's Law 요약을 반환해야 함", async () => {
      // 스냅샷 데이터 생성 (Dev, Test 컬럼 — 진행 중 컬럼)
      const today = new Date().toISOString().split('T')[0];
      await BoardDailySnapshot.qm.createOne({
        boardId: board.id,
        listId: listDev.id,
        cardCount: 4,
        snapshotDate: today,
      });
      await BoardDailySnapshot.qm.createOne({
        boardId: board.id,
        listId: listTest.id,
        cardCount: 2,
        snapshotDate: today,
      });

      // 완료된 카드 생성 (delivery rate 계산용)
      await Card.qm.createOne({
        boardId: board.id,
        listId: listDone.id,
        position: 65536,
        name: 'Completed 1',
        type: 'card',
        completedAt: new Date().toISOString(),
      });

      const res = await request(sails.hooks.http.app)
        .get(`/api/boards/${board.id}/metrics/summary`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body).to.have.property('averageWip');
      expect(res.body).to.have.property('deliveryRate');
      expect(res.body).to.have.property('expectedLeadTime');
      expect(res.body.averageWip).to.be.a('number');
      expect(res.body.deliveryRate).to.be.a('number');
      expect(res.body.expectedLeadTime).to.be.a('number');
    });

    it('데이터가 없을 때 0을 반환해야 함', async () => {
      const res = await request(sails.hooks.http.app)
        .get(`/api/boards/${board.id}/metrics/summary`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.averageWip).to.equal(0);
      expect(res.body.deliveryRate).to.be.a('number');
      expect(res.body.expectedLeadTime).to.equal(0);
    });
  });

  // ─── Auth & Validation ──────────────────────────────────────────────────────

  describe('인증 및 권한 검증', () => {
    it('보드 멤버(viewer)가 메트릭에 접근할 수 있어야 함', async () => {
      await request(sails.hooks.http.app)
        .get(`/api/boards/${board.id}/metrics/cfd`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });

    it('비멤버가 메트릭에 접근하면 404를 반환해야 함', async () => {
      await request(sails.hooks.http.app)
        .get(`/api/boards/${board.id}/metrics/cfd`)
        .set('Authorization', `Bearer ${nonMemberToken}`)
        .expect(404);
    });

    it('인증 없이 메트릭에 접근하면 401을 반환해야 함', async () => {
      await request(sails.hooks.http.app).get(`/api/boards/${board.id}/metrics/cfd`).expect(401);
    });

    it('잘못된 날짜 범위(365일 초과)로 요청 시 400을 반환해야 함', async () => {
      await request(sails.hooks.http.app)
        .get(`/api/boards/${board.id}/metrics/lead-time`)
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ startDate: '2022-01-01', endDate: '2024-01-01' })
        .expect(400);
    });

    it('잘못된 날짜 범위(1일 미만)로 throughput 요청 시 400을 반환해야 함', async () => {
      await request(sails.hooks.http.app)
        .get(`/api/boards/${board.id}/metrics/throughput`)
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ startDate: '2025-01-15', endDate: '2025-01-15' })
        .expect(400);
    });
  });

  // ─── generate-daily-snapshot 헬퍼 ──────────────────────────────────────────

  describe('generate-daily-snapshot 헬퍼', () => {
    afterEach(async () => {
      await BoardDailySnapshot.destroy({ boardId: board.id });
      await Card.destroy({ boardId: board.id });
    });

    it('모든 보드의 컬럼별 카드 수를 스냅샷으로 기록해야 함', async () => {
      // 카드 생성
      await Card.qm.createOne({
        boardId: board.id,
        listId: listBacklog.id,
        position: 65536,
        name: 'Snapshot Card 1',
        type: 'card',
      });
      await Card.qm.createOne({
        boardId: board.id,
        listId: listBacklog.id,
        position: 131072,
        name: 'Snapshot Card 2',
        type: 'card',
      });
      await Card.qm.createOne({
        boardId: board.id,
        listId: listDev.id,
        position: 65536,
        name: 'Snapshot Card 3',
        type: 'card',
      });

      // 스냅샷 생성 실행
      await sails.helpers.metrics.generateDailySnapshot();

      // 스냅샷 확인
      const today = new Date().toISOString().split('T')[0];
      const snapshots = await BoardDailySnapshot.find({
        boardId: board.id,
        snapshotDate: today,
      });

      expect(snapshots.length).to.be.greaterThan(0);

      const backlogSnapshot = snapshots.find((s) => s.listId === listBacklog.id);
      expect(backlogSnapshot).to.exist;
      expect(backlogSnapshot.cardCount).to.equal(2);

      const devSnapshot = snapshots.find((s) => s.listId === listDev.id);
      expect(devSnapshot).to.exist;
      expect(devSnapshot.cardCount).to.equal(1);
    });

    it('동일 날짜에 재실행 시 기존 스냅샷을 업데이트해야 함 (upsert)', async () => {
      // 카드 1개 생성
      await Card.qm.createOne({
        boardId: board.id,
        listId: listBacklog.id,
        position: 65536,
        name: 'Upsert Card',
        type: 'card',
      });

      // 첫 번째 스냅샷 생성
      await sails.helpers.metrics.generateDailySnapshot();

      const today = new Date().toISOString().split('T')[0];
      let snapshot = await BoardDailySnapshot.findOne({
        boardId: board.id,
        listId: listBacklog.id,
        snapshotDate: today,
      });
      expect(snapshot.cardCount).to.equal(1);

      // 카드 추가 후 재실행
      await Card.qm.createOne({
        boardId: board.id,
        listId: listBacklog.id,
        position: 131072,
        name: 'Upsert Card 2',
        type: 'card',
      });

      await sails.helpers.metrics.generateDailySnapshot();

      // 업데이트 확인
      snapshot = await BoardDailySnapshot.findOne({
        boardId: board.id,
        listId: listBacklog.id,
        snapshotDate: today,
      });
      expect(snapshot.cardCount).to.equal(2);

      // 스냅샷이 중복 생성되지 않았는지 확인
      const allSnapshots = await BoardDailySnapshot.find({
        boardId: board.id,
        listId: listBacklog.id,
        snapshotDate: today,
      });
      expect(allSnapshots).to.have.lengthOf(1);
    });
  });
});
