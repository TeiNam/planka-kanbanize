const { expect } = require('chai');
const request = require('supertest');

describe('스윔레인 API 통합 테스트', () => {
  let app;
  let project;
  let board;
  let editorUser;
  let viewerUser;
  let editorToken;
  let viewerToken;

  before(async () => {
    app = sails.hooks.http.app;

    // 에디터 사용자 생성
    editorUser = await User.qm.createOne({
      email: 'swim-lane-editor@test.com',
      password: 'password123',
      name: 'Swim Lane Editor',
    });

    // 뷰어 사용자 생성
    viewerUser = await User.qm.createOne({
      email: 'swim-lane-viewer@test.com',
      password: 'password123',
      name: 'Swim Lane Viewer',
    });

    // 프로젝트 생성
    project = await Project.create({
      name: 'Swim Lane Test Project',
    }).fetch();

    // 보드 생성
    board = await Board.create({
      projectId: project.id,
      position: 65536,
      name: 'Swim Lane Test Board',
    }).fetch();

    // 에디터 멤버십 생성
    await BoardMembership.create({
      boardId: board.id,
      userId: editorUser.id,
      role: 'editor',
    });

    // 뷰어 멤버십 생성
    await BoardMembership.create({
      boardId: board.id,
      userId: viewerUser.id,
      role: 'viewer',
    });

    // 에디터 JWT 토큰 생성
    const editorTokenResult = sails.helpers.utils.createJwtToken(editorUser.id);
    editorToken = editorTokenResult.token;
    await sails.helpers.sessions.createOne.with({
      values: {
        accessToken: editorToken,
        userId: editorUser.id,
        remoteAddress: '127.0.0.1',
      },
    });

    // 뷰어 JWT 토큰 생성
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
    // 테스트 데이터 정리
    await SwimLane.destroy({ boardId: board.id });
    await Card.destroy({ boardId: board.id });
    await BoardMembership.destroy({ boardId: board.id });
    await Board.destroyOne({ id: board.id });
    await Project.destroyOne({ id: project.id });
    await Session.destroy({ userId: editorUser.id });
    await Session.destroy({ userId: viewerUser.id });
    await User.destroyOne({ id: editorUser.id });
    await User.destroyOne({ id: viewerUser.id });
  });

  // =========================================================================
  // POST /api/boards/:boardId/swim-lanes (생성)
  // =========================================================================
  describe('POST /api/boards/:boardId/swim-lanes', () => {
    afterEach(async () => {
      await SwimLane.destroy({ boardId: board.id });
    });

    it('유효한 데이터로 스윔레인을 성공적으로 생성해야 함', async () => {
      const res = await request(app)
        .post(`/api/boards/${board.id}/swim-lanes`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({
          name: 'Feature Development',
          position: 65536,
          category: 'work_item_type',
          type: 'standard',
          wipLimit: 5,
          color: 'lagoon-blue',
        })
        .expect(200);

      expect(res.body).to.have.property('item');
      expect(res.body.item).to.have.property('id');
      expect(res.body.item.name).to.equal('Feature Development');
      expect(res.body.item.category).to.equal('work_item_type');
      expect(res.body.item.type).to.equal('standard');
      expect(res.body.item.wipLimit).to.equal(5);
      expect(res.body.item.color).to.equal('lagoon-blue');
      expect(res.body.item.boardId).to.equal(board.id);
    });

    it('이름이 50자를 초과하면 400을 반환해야 함', async () => {
      const longName = 'a'.repeat(51);

      await request(app)
        .post(`/api/boards/${board.id}/swim-lanes`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({
          name: longName,
          position: 65536,
        })
        .expect(400);
    });

    it('wipLimit이 100을 초과하면 400을 반환해야 함', async () => {
      await request(app)
        .post(`/api/boards/${board.id}/swim-lanes`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({
          name: 'Test Lane',
          position: 65536,
          wipLimit: 101,
        })
        .expect(400);
    });

    it('wipLimit이 1 미만이면 400을 반환해야 함', async () => {
      await request(app)
        .post(`/api/boards/${board.id}/swim-lanes`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({
          name: 'Test Lane',
          position: 65536,
          wipLimit: 0,
        })
        .expect(400);
    });

    it('Expedite 타입은 position을 최상단으로 설정하고 wipLimit 기본값을 1로 설정해야 함', async () => {
      // 먼저 일반 스윔레인 생성
      await request(app)
        .post(`/api/boards/${board.id}/swim-lanes`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({
          name: 'Standard Lane',
          position: 65536,
          type: 'standard',
        })
        .expect(200);

      // Expedite 스윔레인 생성
      const res = await request(app)
        .post(`/api/boards/${board.id}/swim-lanes`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({
          name: 'Expedite Lane',
          position: 131072,
          type: 'expedite',
        })
        .expect(200);

      expect(res.body.item.type).to.equal('expedite');
      expect(res.body.item.wipLimit).to.equal(1);
      // Expedite는 position이 0(최상단)으로 설정됨
      expect(res.body.item.position).to.equal(0);
    });

    it('비에디터 멤버(뷰어)는 403을 반환해야 함', async () => {
      await request(app)
        .post(`/api/boards/${board.id}/swim-lanes`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          name: 'Unauthorized Lane',
          position: 65536,
        })
        .expect(403);
    });

    it('인증 없이 요청하면 401을 반환해야 함', async () => {
      await request(app)
        .post(`/api/boards/${board.id}/swim-lanes`)
        .send({
          name: 'No Auth Lane',
          position: 65536,
        })
        .expect(401);
    });

    it('빈 이름으로 요청하면 400을 반환해야 함', async () => {
      await request(app)
        .post(`/api/boards/${board.id}/swim-lanes`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({
          name: '',
          position: 65536,
        })
        .expect(400);
    });
  });

  // =========================================================================
  // PATCH /api/swim-lanes/:id (수정)
  // =========================================================================
  describe('PATCH /api/swim-lanes/:id', () => {
    let swimLane;

    beforeEach(async () => {
      swimLane = await SwimLane.qm.createOne({
        boardId: board.id,
        position: 65536,
        name: 'Original Name',
        type: 'standard',
        wipLimit: 3,
        color: 'blue',
      });
    });

    afterEach(async () => {
      await SwimLane.destroy({ boardId: board.id });
    });

    it('이름, wipLimit, color를 성공적으로 수정해야 함', async () => {
      const res = await request(app)
        .patch(`/api/swim-lanes/${swimLane.id}`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({
          name: 'Updated Name',
          wipLimit: 10,
          color: 'red',
        })
        .expect(200);

      expect(res.body).to.have.property('item');
      expect(res.body.item.name).to.equal('Updated Name');
      expect(res.body.item.wipLimit).to.equal(10);
      expect(res.body.item.color).to.equal('red');
    });

    it('wipLimit을 null로 설정하여 제한을 해제할 수 있어야 함', async () => {
      const res = await request(app)
        .patch(`/api/swim-lanes/${swimLane.id}`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({
          wipLimit: null,
        })
        .expect(200);

      expect(res.body.item.wipLimit).to.be.null;
    });

    it('유효하지 않은 wipLimit(101)으로 수정하면 400을 반환해야 함', async () => {
      await request(app)
        .patch(`/api/swim-lanes/${swimLane.id}`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({
          wipLimit: 101,
        })
        .expect(400);
    });

    it('유효하지 않은 wipLimit(0)으로 수정하면 400을 반환해야 함', async () => {
      await request(app)
        .patch(`/api/swim-lanes/${swimLane.id}`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({
          wipLimit: 0,
        })
        .expect(400);
    });

    it('존재하지 않는 스윔레인 수정 시 404를 반환해야 함', async () => {
      await request(app)
        .patch('/api/swim-lanes/999999999999999999')
        .set('Authorization', `Bearer ${editorToken}`)
        .send({
          name: 'Not Found',
        })
        .expect(404);
    });

    it('비에디터 멤버(뷰어)는 403을 반환해야 함', async () => {
      await request(app)
        .patch(`/api/swim-lanes/${swimLane.id}`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          name: 'Unauthorized Update',
        })
        .expect(403);
    });
  });

  // =========================================================================
  // DELETE /api/swim-lanes/:id (삭제)
  // =========================================================================
  describe('DELETE /api/swim-lanes/:id', () => {
    let swimLane;

    beforeEach(async () => {
      swimLane = await SwimLane.qm.createOne({
        boardId: board.id,
        position: 65536,
        name: 'Delete Test Lane',
        type: 'standard',
      });
    });

    afterEach(async () => {
      await Card.destroy({ boardId: board.id });
      await List.destroy({ boardId: board.id });
      await SwimLane.destroy({ boardId: board.id });
    });

    it('카드가 없는 스윔레인을 성공적으로 삭제해야 함', async () => {
      const res = await request(app)
        .delete(`/api/swim-lanes/${swimLane.id}`)
        .set('Authorization', `Bearer ${editorToken}`)
        .expect(200);

      expect(res.body).to.have.property('item');
      expect(res.body.item.id).to.equal(swimLane.id);

      // DB에서 삭제 확인
      const found = await SwimLane.findOne({ id: swimLane.id });
      expect(found).to.be.undefined;
    });

    it('카드가 존재하는 스윔레인 삭제 시 409를 반환해야 함 (swimLaneHasCards)', async () => {
      // 리스트 생성
      const list = await List.qm.createOne({
        boardId: board.id,
        type: 'active',
        position: 65536,
        name: 'Test List',
      });

      // 스윔레인에 카드 추가
      await Card.qm.createOne({
        boardId: board.id,
        listId: list.id,
        swimLaneId: swimLane.id,
        position: 65536,
        name: 'Blocking Card',
        type: 'card',
      });

      const res = await request(app)
        .delete(`/api/swim-lanes/${swimLane.id}`)
        .set('Authorization', `Bearer ${editorToken}`)
        .expect(409);

      expect(res.body).to.have.property('swimLaneHasCards');

      // 스윔레인이 여전히 존재하는지 확인
      const found = await SwimLane.findOne({ id: swimLane.id });
      expect(found).to.exist;
    });

    it('비에디터 멤버(뷰어)는 403을 반환해야 함', async () => {
      await request(app)
        .delete(`/api/swim-lanes/${swimLane.id}`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(403);
    });

    it('존재하지 않는 스윔레인 삭제 시 404를 반환해야 함', async () => {
      await request(app)
        .delete('/api/swim-lanes/999999999999999999')
        .set('Authorization', `Bearer ${editorToken}`)
        .expect(404);
    });
  });

  // =========================================================================
  // POST /api/boards/:boardId/swim-lanes/sort (정렬)
  // =========================================================================
  describe('POST /api/boards/:boardId/swim-lanes/sort', () => {
    let swimLane1;
    let swimLane2;
    let swimLane3;

    beforeEach(async () => {
      swimLane1 = await SwimLane.qm.createOne({
        boardId: board.id,
        position: 65536,
        name: 'Lane A',
        type: 'standard',
      });

      swimLane2 = await SwimLane.qm.createOne({
        boardId: board.id,
        position: 131072,
        name: 'Lane B',
        type: 'standard',
      });

      swimLane3 = await SwimLane.qm.createOne({
        boardId: board.id,
        position: 196608,
        name: 'Lane C',
        type: 'standard',
      });
    });

    afterEach(async () => {
      await SwimLane.destroy({ boardId: board.id });
    });

    it('스윔레인 순서를 성공적으로 변경해야 함', async () => {
      // 순서를 C, A, B로 변경
      const res = await request(app)
        .post(`/api/boards/${board.id}/swim-lanes/sort`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({
          swimLaneIds: [swimLane3.id, swimLane1.id, swimLane2.id],
        })
        .expect(200);

      expect(res.body).to.have.property('items');
      expect(res.body.items).to.have.lengthOf(3);

      // position이 순서대로 재배치되었는지 확인
      const sorted = await SwimLane.find({ boardId: board.id }).sort('position ASC');
      expect(sorted[0].id).to.equal(swimLane3.id);
      expect(sorted[1].id).to.equal(swimLane1.id);
      expect(sorted[2].id).to.equal(swimLane2.id);
    });

    it('비에디터 멤버(뷰어)는 403을 반환해야 함', async () => {
      await request(app)
        .post(`/api/boards/${board.id}/swim-lanes/sort`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          swimLaneIds: [swimLane1.id, swimLane2.id, swimLane3.id],
        })
        .expect(403);
    });

    it('인증 없이 요청하면 401을 반환해야 함', async () => {
      await request(app)
        .post(`/api/boards/${board.id}/swim-lanes/sort`)
        .send({
          swimLaneIds: [swimLane1.id, swimLane2.id, swimLane3.id],
        })
        .expect(401);
    });
  });
});
