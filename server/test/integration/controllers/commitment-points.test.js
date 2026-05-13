const request = require('supertest');
const { expect } = require('chai');

describe('Commitment Points API (controllers)', () => {
  let project;
  let board;
  let user;
  let accessToken;
  let listBacklog;
  let listDev;
  let listTest;
  let listDone;

  before(async () => {
    // 테스트용 사용자 생성
    user = await User.qm.createOne({
      email: 'cp-controller-test@test.com',
      password: 'password123',
      name: 'CP Controller Test User',
    });

    // 테스트용 프로젝트 생성
    project = await Project.create({
      name: 'CP Controller Test Project',
    }).fetch();

    // 테스트용 보드 생성
    board = await Board.create({
      projectId: project.id,
      position: 65536,
      name: 'CP Controller Test Board',
    }).fetch();

    // 보드 멤버십 생성 (editor 권한)
    await BoardMembership.create({
      boardId: board.id,
      userId: user.id,
      role: 'editor',
    });

    // 리스트 4개 생성 (Backlog → Dev → Test → Done)
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

    // 인증 토큰 획득
    const res = await request(sails.hooks.http.app)
      .post('/api/access-tokens')
      .send({ emailOrUsername: 'cp-controller-test@test.com', password: 'password123' });

    accessToken = res.body.item;
  });

  after(async () => {
    await CardCommitmentLog.destroy({});
    await CommitmentPoint.destroy({ boardId: board.id });
    await Card.destroy({ boardId: board.id });
    await List.destroy({ boardId: board.id });
    await BoardMembership.destroy({ boardId: board.id });
    await Board.destroyOne({ id: board.id });
    await Project.destroyOne({ id: project.id });
    await User.destroyOne({ id: user.id });
  });

  describe('POST /api/boards/:boardId/commitment-points (생성)', () => {
    afterEach(async () => {
      // 각 테스트 후 commitment point 정리
      await CommitmentPoint.destroy({ boardId: board.id });
    });

    it('두 리스트 사이에 Commitment Point를 성공적으로 생성해야 함', async () => {
      const res = await request(sails.hooks.http.app)
        .post(`/api/boards/${board.id}/commitment-points`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          leftListId: listBacklog.id,
          rightListId: listDev.id,
          position: 65536,
          label: 'Commitment',
          type: 'commitment',
        })
        .expect(200);

      expect(res.body.item).to.exist;
      expect(res.body.item.boardId).to.equal(board.id);
      expect(res.body.item.leftListId).to.equal(listBacklog.id);
      expect(res.body.item.rightListId).to.equal(listDev.id);
      expect(res.body.item.label).to.equal('Commitment');
      expect(res.body.item.type).to.equal('commitment');
    });

    it('보드에 이미 5개의 Commitment Point가 있으면 409를 반환해야 함', async () => {
      // 5개 생성
      await CommitmentPoint.qm.createOne({
        boardId: board.id,
        leftListId: listBacklog.id,
        rightListId: listDev.id,
        position: 65536,
        type: 'commitment',
      });
      await CommitmentPoint.qm.createOne({
        boardId: board.id,
        leftListId: listDev.id,
        rightListId: listTest.id,
        position: 131072,
        type: 'commitment',
      });
      await CommitmentPoint.qm.createOne({
        boardId: board.id,
        leftListId: listTest.id,
        rightListId: listDone.id,
        position: 196608,
        type: 'delivery',
      });
      await CommitmentPoint.qm.createOne({
        boardId: board.id,
        leftListId: listBacklog.id,
        rightListId: listTest.id,
        position: 262144,
        type: 'commitment',
      });
      await CommitmentPoint.qm.createOne({
        boardId: board.id,
        leftListId: listDev.id,
        rightListId: listDone.id,
        position: 327680,
        type: 'commitment',
      });

      // 6번째 생성 시도 → 409
      await request(sails.hooks.http.app)
        .post(`/api/boards/${board.id}/commitment-points`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          leftListId: listBacklog.id,
          rightListId: listDone.id,
          position: 393216,
          type: 'commitment',
        })
        .expect(409);
    });

    it('존재하지 않는 leftListId로 요청 시 404를 반환해야 함', async () => {
      await request(sails.hooks.http.app)
        .post(`/api/boards/${board.id}/commitment-points`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          leftListId: '99999999999999999',
          rightListId: listDev.id,
          position: 65536,
          type: 'commitment',
        })
        .expect(404);
    });

    it('존재하지 않는 rightListId로 요청 시 404를 반환해야 함', async () => {
      await request(sails.hooks.http.app)
        .post(`/api/boards/${board.id}/commitment-points`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          leftListId: listBacklog.id,
          rightListId: '99999999999999999',
          position: 65536,
          type: 'commitment',
        })
        .expect(404);
    });

    it('leftList position >= rightList position이면 422를 반환해야 함', async () => {
      await request(sails.hooks.http.app)
        .post(`/api/boards/${board.id}/commitment-points`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          leftListId: listDev.id,
          rightListId: listBacklog.id,
          position: 65536,
          type: 'commitment',
        })
        .expect(422);
    });

    it('label이 50자를 초과하면 요청이 거부되어야 함', async () => {
      const longLabel = 'a'.repeat(51);

      await request(sails.hooks.http.app)
        .post(`/api/boards/${board.id}/commitment-points`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          leftListId: listBacklog.id,
          rightListId: listDev.id,
          position: 65536,
          label: longLabel,
          type: 'commitment',
        })
        .expect(400);
    });
  });

  describe('PATCH /api/commitment-points/:id (수정)', () => {
    let commitmentPoint;

    beforeEach(async () => {
      commitmentPoint = await CommitmentPoint.qm.createOne({
        boardId: board.id,
        leftListId: listBacklog.id,
        rightListId: listDev.id,
        position: 65536,
        label: 'Original Label',
        type: 'commitment',
      });
    });

    afterEach(async () => {
      await CommitmentPoint.destroy({ boardId: board.id });
    });

    it('label과 type을 성공적으로 수정해야 함', async () => {
      const res = await request(sails.hooks.http.app)
        .patch(`/api/commitment-points/${commitmentPoint.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          label: 'Updated Label',
          type: 'delivery',
        })
        .expect(200);

      expect(res.body.item.label).to.equal('Updated Label');
      expect(res.body.item.type).to.equal('delivery');
    });

    it('position을 성공적으로 수정해야 함 (순서 변경)', async () => {
      const res = await request(sails.hooks.http.app)
        .patch(`/api/commitment-points/${commitmentPoint.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          position: 131072,
        })
        .expect(200);

      expect(res.body.item.position).to.be.a('number');
    });
  });

  describe('DELETE /api/commitment-points/:id (삭제)', () => {
    it('Commitment Point를 성공적으로 삭제해야 함', async () => {
      const cp = await CommitmentPoint.qm.createOne({
        boardId: board.id,
        leftListId: listBacklog.id,
        rightListId: listDev.id,
        position: 65536,
        type: 'commitment',
      });

      const res = await request(sails.hooks.http.app)
        .delete(`/api/commitment-points/${cp.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.item.id).to.equal(cp.id);

      // DB에서 삭제 확인
      const deleted = await CommitmentPoint.findOne({ id: cp.id });
      expect(deleted).to.be.undefined;
    });

    it('삭제 후에도 기존 card_commitment_log 기록이 보존되어야 함', async () => {
      const cp = await CommitmentPoint.qm.createOne({
        boardId: board.id,
        leftListId: listBacklog.id,
        rightListId: listDev.id,
        position: 65536,
        type: 'commitment',
      });

      // 카드 생성 및 통과 기록 생성
      const card = await Card.qm.createOne({
        boardId: board.id,
        listId: listDev.id,
        position: 65536,
        name: 'Log Preservation Test Card',
        type: 'card',
      });

      await CardCommitmentLog.create({
        cardId: card.id,
        commitmentPointId: cp.id,
        direction: 'forward',
        passedAt: new Date().toISOString(),
      });

      // Commitment Point 삭제
      await request(sails.hooks.http.app)
        .delete(`/api/commitment-points/${cp.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // 로그 기록이 보존되었는지 확인
      const logs = await CardCommitmentLog.find({ cardId: card.id });
      expect(logs).to.have.lengthOf(1);
      expect(logs[0].direction).to.equal('forward');

      // 정리
      await CardCommitmentLog.destroy({ cardId: card.id });
      await Card.destroyOne({ id: card.id });
    });
  });

  describe('Commitment Point 통과 (카드 이동 통합)', () => {
    let commitmentPointCP;
    let card;

    beforeEach(async () => {
      // Commitment Point: Backlog | Dev
      commitmentPointCP = await CommitmentPoint.qm.createOne({
        boardId: board.id,
        leftListId: listBacklog.id,
        rightListId: listDev.id,
        position: 65536,
        type: 'commitment',
      });

      // Delivery Point: Test | Done
      await CommitmentPoint.qm.createOne({
        boardId: board.id,
        leftListId: listTest.id,
        rightListId: listDone.id,
        position: 131072,
        type: 'delivery',
      });

      // 카드 생성 (Backlog에 위치)
      card = await Card.qm.createOne({
        boardId: board.id,
        listId: listBacklog.id,
        position: 65536,
        name: 'Crossing Test Card',
        type: 'card',
      });
    });

    afterEach(async () => {
      await CardCommitmentLog.destroy({ cardId: card.id });
      await Card.destroyOne({ id: card.id });
      await CommitmentPoint.destroy({ boardId: board.id });
    });

    it('CP 이전에서 이후로 카드 이동 시 forward 기록이 생성되어야 함', async () => {
      // Backlog → Dev (CP 통과)
      await request(sails.hooks.http.app)
        .patch(`/api/cards/${card.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          listId: listDev.id,
          position: 65536,
        })
        .expect(200);

      const logs = await CardCommitmentLog.find({ cardId: card.id });
      expect(logs).to.have.lengthOf(1);
      expect(logs[0].direction).to.equal('forward');
      expect(logs[0].commitmentPointId).to.equal(commitmentPointCP.id);
      expect(logs[0].passedAt).to.exist;
    });

    it('CP 이후에서 이전으로 카드 이동 시 backward 기록이 생성되어야 함', async () => {
      // 먼저 카드를 Dev로 이동
      await Card.updateOne({ id: card.id }).set({ listId: listDev.id });

      // Dev → Backlog (역방향 CP 통과)
      await request(sails.hooks.http.app)
        .patch(`/api/cards/${card.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          listId: listBacklog.id,
          position: 65536,
        })
        .expect(200);

      const logs = await CardCommitmentLog.find({
        cardId: card.id,
        direction: 'backward',
      });
      expect(logs).to.have.lengthOf(1);
      expect(logs[0].commitmentPointId).to.equal(commitmentPointCP.id);
    });

    it('같은 쪽 리스트 간 이동 시 기록이 생성되지 않아야 함', async () => {
      // 먼저 카드를 Dev로 이동 (CP 통과)
      await Card.updateOne({ id: card.id }).set({ listId: listDev.id });

      // 기존 로그 정리
      await CardCommitmentLog.destroy({ cardId: card.id });

      // Dev → Test (둘 다 CP 이후, DP 이전 → 기록 없음)
      await request(sails.hooks.http.app)
        .patch(`/api/cards/${card.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          listId: listTest.id,
          position: 65536,
        })
        .expect(200);

      const logs = await CardCommitmentLog.find({ cardId: card.id });
      expect(logs).to.have.lengthOf(0);
    });

    it('Delivery Point 정방향 통과 시 card.completedAt이 설정되어야 함', async () => {
      // 카드를 Test로 이동 (DP 이전)
      await Card.updateOne({ id: card.id }).set({ listId: listTest.id });

      // Test → Done (DP 통과)
      await request(sails.hooks.http.app)
        .patch(`/api/cards/${card.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          listId: listDone.id,
          position: 65536,
        })
        .expect(200);

      const updatedCard = await Card.findOne({ id: card.id });
      expect(updatedCard.completedAt).to.exist;
      expect(updatedCard.completedAt).to.not.be.null;
    });

    it('Delivery Point 역방향 통과 시 card.completedAt이 null로 초기화되어야 함', async () => {
      // 카드를 Done으로 이동하고 completedAt 설정
      await Card.updateOne({ id: card.id }).set({
        listId: listDone.id,
        completedAt: new Date().toISOString(),
      });

      // Done → Test (DP 역방향 통과)
      await request(sails.hooks.http.app)
        .patch(`/api/cards/${card.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          listId: listTest.id,
          position: 65536,
        })
        .expect(200);

      const updatedCard = await Card.findOne({ id: card.id });
      expect(updatedCard.completedAt).to.be.null;
    });
  });
});
