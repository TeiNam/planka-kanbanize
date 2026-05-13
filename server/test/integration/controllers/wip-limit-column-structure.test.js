const request = require('supertest');
const { expect } = require('chai');

describe('WIP 제한 및 컬럼 구조 컨트롤러 통합 테스트', () => {
  let app;
  let user;
  let project;
  let board;
  let list;
  let accessToken;

  before(async () => {
    app = sails.hooks.http.app;

    // 테스트용 사용자 생성
    user = await User.qm.createOne({
      email: 'wip-controller-test@test.com',
      password: 'password123',
      name: 'WIP Controller Test User',
    });

    // 테스트용 프로젝트 생성
    project = await Project.create({
      name: 'WIP Controller Test Project',
    }).fetch();

    // 프로젝트 매니저 등록 (보드 업데이트 권한 필요)
    await ProjectManager.create({
      projectId: project.id,
      userId: user.id,
    });

    // 테스트용 보드 생성
    board = await Board.create({
      projectId: project.id,
      position: 65536,
      name: 'WIP Controller Test Board',
    }).fetch();

    // 보드 멤버십 생성 (에디터 권한)
    await BoardMembership.create({
      boardId: board.id,
      userId: user.id,
      role: 'editor',
    });

    // JWT 토큰 생성
    const { token } = sails.helpers.utils.createJwtToken(user.id);
    accessToken = token;

    // 세션 생성
    await Session.create({
      accessToken,
      userId: user.id,
      remoteAddress: '127.0.0.1',
    }).fetch();
  });

  beforeEach(async () => {
    // 각 테스트 전 리스트 생성
    list = await List.qm.createOne({
      boardId: board.id,
      type: 'active',
      position: 65536,
      name: 'Test List',
    });
  });

  afterEach(async () => {
    // 테스트 후 정리
    await Card.destroy({ boardId: board.id });
    await List.destroy({ boardId: board.id });
  });

  after(async () => {
    await Session.destroy({ userId: user.id });
    await BoardMembership.destroy({ boardId: board.id });
    await Board.destroyOne({ id: board.id });
    await ProjectManager.destroy({ projectId: project.id });
    await Project.destroyOne({ id: project.id });
    await User.destroyOne({ id: user.id });
  });

  // =========================================================================
  // 1. WIP Limit on Lists
  // =========================================================================
  describe('WIP Limit on Lists (Requirements 2.1~2.7)', () => {
    it('PATCH /api/lists/:id - wipLimit=5 설정 시 리스트가 업데이트되어야 함', async () => {
      const res = await request(app)
        .patch(`/api/lists/${list.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ wipLimit: 5 })
        .expect(200);

      expect(res.body.item).to.exist;
      expect(res.body.item.wipLimit).to.equal(5);
    });

    it('PATCH /api/lists/:id - wipLimit=null 설정 시 WIP 제한이 해제되어야 함', async () => {
      // 먼저 WIP 제한 설정
      await request(app)
        .patch(`/api/lists/${list.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ wipLimit: 10 })
        .expect(200);

      // WIP 제한 해제
      const res = await request(app)
        .patch(`/api/lists/${list.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ wipLimit: null })
        .expect(200);

      expect(res.body.item).to.exist;
      expect(res.body.item.wipLimit).to.be.null;
    });

    it('PATCH /api/lists/:id - wipLimit=0 설정 시 검증 에러가 발생해야 함', async () => {
      const res = await request(app)
        .patch(`/api/lists/${list.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ wipLimit: 0 })
        .expect(400);

      expect(res.body).to.exist;
    });

    it('PATCH /api/lists/:id - wipLimit=101 설정 시 검증 에러가 발생해야 함', async () => {
      const res = await request(app)
        .patch(`/api/lists/${list.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ wipLimit: 101 })
        .expect(400);

      expect(res.body).to.exist;
    });

    it('PATCH /api/lists/:id - wipLimit=1 (최소값) 설정이 성공해야 함', async () => {
      const res = await request(app)
        .patch(`/api/lists/${list.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ wipLimit: 1 })
        .expect(200);

      expect(res.body.item.wipLimit).to.equal(1);
    });

    it('PATCH /api/lists/:id - wipLimit=100 (최대값) 설정이 성공해야 함', async () => {
      const res = await request(app)
        .patch(`/api/lists/${list.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ wipLimit: 100 })
        .expect(200);

      expect(res.body.item.wipLimit).to.equal(100);
    });
  });

  // =========================================================================
  // 2. Sub-columns
  // =========================================================================
  describe('서브컬럼 (Requirements 7.1~7.7)', () => {
    it('PATCH /api/lists/:id - enableSubColumns=true 시 Active/Done 서브리스트 생성', async () => {
      const res = await request(app)
        .patch(`/api/lists/${list.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ enableSubColumns: true })
        .expect(200);

      expect(res.body.item).to.exist;

      // 서브컬럼 확인
      const allLists = await List.qm.getByBoardId(board.id);
      const childLists = allLists.filter((l) => l.parentListId === list.id);

      expect(childLists).to.have.lengthOf(2);

      const activeChild = childLists.find((l) => l.subColumnType === 'active');
      const doneChild = childLists.find((l) => l.subColumnType === 'done');

      expect(activeChild).to.exist;
      expect(activeChild.name).to.equal('Active');
      expect(doneChild).to.exist;
      expect(doneChild.name).to.equal('Done');
    });

    it('서브컬럼 활성화 시 기존 카드가 Active 서브컬럼으로 이동해야 함', async () => {
      // 카드 생성
      await Card.create({
        boardId: board.id,
        listId: list.id,
        position: 65536,
        name: 'Card A',
        type: 'card',
      });

      await Card.create({
        boardId: board.id,
        listId: list.id,
        position: 131072,
        name: 'Card B',
        type: 'card',
      });

      // 서브컬럼 활성화
      await request(app)
        .patch(`/api/lists/${list.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ enableSubColumns: true })
        .expect(200);

      // 부모 리스트에 카드가 없어야 함
      const parentCards = await Card.qm.getByListId(list.id);
      expect(parentCards).to.have.lengthOf(0);

      // Active 서브컬럼에 카드가 있어야 함
      const allLists = await List.qm.getByBoardId(board.id);
      const activeChild = allLists.find(
        (l) => l.parentListId === list.id && l.subColumnType === 'active',
      );

      const activeCards = await Card.qm.getByListId(activeChild.id);
      expect(activeCards).to.have.lengthOf(2);
    });

    it('서브컬럼 비활성화 시 카드 병합 (Active 먼저, Done 뒤에)', async () => {
      // 서브컬럼 활성화
      await request(app)
        .patch(`/api/lists/${list.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ enableSubColumns: true })
        .expect(200);

      // 서브컬럼에 카드 추가
      const allLists = await List.qm.getByBoardId(board.id);
      const activeChild = allLists.find(
        (l) => l.parentListId === list.id && l.subColumnType === 'active',
      );
      const doneChild = allLists.find(
        (l) => l.parentListId === list.id && l.subColumnType === 'done',
      );

      await Card.create({
        boardId: board.id,
        listId: activeChild.id,
        position: 65536,
        name: 'Active Card 1',
        type: 'card',
      });

      await Card.create({
        boardId: board.id,
        listId: doneChild.id,
        position: 65536,
        name: 'Done Card 1',
        type: 'card',
      });

      await Card.create({
        boardId: board.id,
        listId: activeChild.id,
        position: 131072,
        name: 'Active Card 2',
        type: 'card',
      });

      // 서브컬럼 비활성화
      await request(app)
        .patch(`/api/lists/${list.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ enableSubColumns: false })
        .expect(200);

      // 부모 리스트에 모든 카드가 병합되어야 함
      const parentCards = await Card.qm.getByListId(list.id);
      expect(parentCards).to.have.lengthOf(3);

      // Active 카드가 Done 카드보다 앞에 위치해야 함
      const sortedCards = _.sortBy(parentCards, ['position']);
      expect(sortedCards[0].name).to.equal('Active Card 1');
      expect(sortedCards[1].name).to.equal('Active Card 2');
      expect(sortedCards[2].name).to.equal('Done Card 1');
    });

    it('서브컬럼 비활성화 후 서브컬럼 리스트가 삭제되어야 함', async () => {
      // 서브컬럼 활성화
      await request(app)
        .patch(`/api/lists/${list.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ enableSubColumns: true })
        .expect(200);

      // 서브컬럼 비활성화
      await request(app)
        .patch(`/api/lists/${list.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ enableSubColumns: false })
        .expect(200);

      // 서브컬럼 리스트가 삭제되어야 함
      const allLists = await List.qm.getByBoardId(board.id);
      const childLists = allLists.filter((l) => l.parentListId === list.id);
      expect(childLists).to.have.lengthOf(0);
    });
  });

  // =========================================================================
  // 3. Buffer Column
  // =========================================================================
  describe('버퍼 컬럼 (Requirements 7.3)', () => {
    it('PATCH /api/lists/:id - isBuffer=true 설정 시 버퍼 컬럼으로 표시', async () => {
      const res = await request(app)
        .patch(`/api/lists/${list.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ isBuffer: true })
        .expect(200);

      expect(res.body.item).to.exist;
      expect(res.body.item.isBuffer).to.equal(true);
    });

    it('PATCH /api/lists/:id - isBuffer=false 설정 시 버퍼 플래그 해제', async () => {
      // 먼저 버퍼 설정
      await request(app)
        .patch(`/api/lists/${list.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ isBuffer: true })
        .expect(200);

      // 버퍼 해제
      const res = await request(app)
        .patch(`/api/lists/${list.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ isBuffer: false })
        .expect(200);

      expect(res.body.item).to.exist;
      expect(res.body.item.isBuffer).to.equal(false);
    });
  });

  // =========================================================================
  // 4. Pull Criteria & Policy
  // =========================================================================
  describe('Pull Criteria & Policy (Requirements 7.4, 7.5)', () => {
    it('PATCH /api/lists/:id - pullCriteria 텍스트 저장', async () => {
      const criteria = 'Code review 완료, 단위 테스트 통과, QA 승인';

      const res = await request(app)
        .patch(`/api/lists/${list.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ pullCriteria: criteria })
        .expect(200);

      expect(res.body.item).to.exist;
      expect(res.body.item.pullCriteria).to.equal(criteria);
    });

    it('PATCH /api/lists/:id - policy 텍스트 저장', async () => {
      const policyText = '모든 작업은 페어 프로그래밍으로 진행하며, PR 리뷰 필수';

      const res = await request(app)
        .patch(`/api/lists/${list.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ policy: policyText })
        .expect(200);

      expect(res.body.item).to.exist;
      expect(res.body.item.policy).to.equal(policyText);
    });

    it('PATCH /api/lists/:id - pullCriteria 500자 초과 시 검증 에러', async () => {
      const longText = 'a'.repeat(501);

      await request(app)
        .patch(`/api/lists/${list.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ pullCriteria: longText })
        .expect(400);
    });

    it('PATCH /api/lists/:id - policy 500자 초과 시 검증 에러', async () => {
      const longText = 'b'.repeat(501);

      await request(app)
        .patch(`/api/lists/${list.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ policy: longText })
        .expect(400);
    });

    it('PATCH /api/lists/:id - pullCriteria 500자 (경계값) 설정 성공', async () => {
      const maxText = 'c'.repeat(500);

      const res = await request(app)
        .patch(`/api/lists/${list.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ pullCriteria: maxText })
        .expect(200);

      expect(res.body.item.pullCriteria).to.equal(maxText);
    });

    it('PATCH /api/lists/:id - pullCriteria를 null로 설정하여 제거', async () => {
      // 먼저 설정
      await request(app)
        .patch(`/api/lists/${list.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ pullCriteria: 'some criteria' })
        .expect(200);

      // null로 제거
      const res = await request(app)
        .patch(`/api/lists/${list.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ pullCriteria: null })
        .expect(200);

      expect(res.body.item.pullCriteria).to.be.null;
    });
  });

  // =========================================================================
  // 5. System WIP Limit on Board
  // =========================================================================
  describe('시스템 WIP 제한 (Requirements 2.3)', () => {
    it('PATCH /api/boards/:id - systemWipLimit=24 설정 시 보드 업데이트', async () => {
      const res = await request(app)
        .patch(`/api/boards/${board.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ systemWipLimit: 24 })
        .expect(200);

      expect(res.body.item).to.exist;
      expect(res.body.item.systemWipLimit).to.equal(24);
    });

    it('PATCH /api/boards/:id - systemWipLimit=null 설정 시 제한 해제', async () => {
      // 먼저 설정
      await request(app)
        .patch(`/api/boards/${board.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ systemWipLimit: 10 })
        .expect(200);

      // 해제
      const res = await request(app)
        .patch(`/api/boards/${board.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ systemWipLimit: null })
        .expect(200);

      expect(res.body.item).to.exist;
      expect(res.body.item.systemWipLimit).to.be.null;
    });

    it('PATCH /api/boards/:id - systemWipLimit=1 (최소값) 설정 성공', async () => {
      const res = await request(app)
        .patch(`/api/boards/${board.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ systemWipLimit: 1 })
        .expect(200);

      expect(res.body.item.systemWipLimit).to.equal(1);
    });

    it('PATCH /api/boards/:id - systemWipLimit=100 (최대값) 설정 성공', async () => {
      const res = await request(app)
        .patch(`/api/boards/${board.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ systemWipLimit: 100 })
        .expect(200);

      expect(res.body.item.systemWipLimit).to.equal(100);
    });
  });

  // =========================================================================
  // 인증 및 권한 검증
  // =========================================================================
  describe('인증 및 권한 검증', () => {
    it('인증 없이 리스트 업데이트 시 401 에러', async () => {
      await request(app).patch(`/api/lists/${list.id}`).send({ wipLimit: 5 }).expect(401);
    });

    it('인증 없이 보드 업데이트 시 401 에러', async () => {
      await request(app).patch(`/api/boards/${board.id}`).send({ systemWipLimit: 10 }).expect(401);
    });
  });
});
