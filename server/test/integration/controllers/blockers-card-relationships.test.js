const { expect } = require('chai');
const request = require('supertest');

describe('블로커 및 하위 티켓 API 통합 테스트', () => {
  let app;
  let project;
  let board;
  let user;
  let accessToken;
  let listBacklog;
  let listDev;
  let card;

  before(async () => {
    app = sails.hooks.http.app;

    // 테스트용 사용자 생성
    user = await User.qm.createOne({
      email: 'blocker-rel-test@test.com',
      password: '$2b$10$K1Q1Q1Q1Q1Q1Q1Q1Q1Q1Q.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      name: 'Blocker Rel Test User',
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

    // 테스트용 프로젝트 생성
    project = await Project.create({
      name: 'Blocker Rel Test Project',
    }).fetch();

    // 테스트용 보드 생성
    board = await Board.create({
      projectId: project.id,
      position: 65536,
      name: 'Blocker Rel Test Board',
    }).fetch();

    // 보드 멤버십 생성
    await BoardMembership.create({
      boardId: board.id,
      userId: user.id,
      role: 'editor',
    });

    // 리스트 생성 (Backlog → Dev → Done)
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

    await List.qm.createOne({
      boardId: board.id,
      type: 'active',
      position: 196608,
      name: 'Done',
    });
  });

  after(async () => {
    await CardRelationship.destroy({});
    await Blocker.destroy({});
    await Card.destroy({ boardId: board.id });
    await List.destroy({ boardId: board.id });
    await BoardMembership.destroy({ boardId: board.id });
    await Board.destroyOne({ id: board.id });
    await Project.destroyOne({ id: project.id });
    await Session.destroy({ userId: user.id });
    await User.destroyOne({ id: user.id });
  });

  // ============================================================
  // 블로커 (Blockers) 테스트
  // ============================================================
  describe('블로커 API', () => {
    beforeEach(async () => {
      card = await Card.qm.createOne({
        boardId: board.id,
        listId: listDev.id,
        position: 65536,
        name: 'Blocker Test Card',
        type: 'card',
      });
    });

    afterEach(async () => {
      await Blocker.destroy({ cardId: card.id });
      await Card.destroy({ boardId: board.id });
    });

    describe('POST /api/cards/:cardId/blockers', () => {
      it('블로커를 생성해야 함 (reason 최대 200자)', async () => {
        const reason = '이 작업은 외부 API 의존성으로 인해 차단됨';

        const res = await request(app)
          .post(`/api/cards/${card.id}/blockers`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ reason })
          .expect(200);

        expect(res.body.item).to.exist;
        expect(res.body.item.reason).to.equal(reason);
        expect(res.body.item.status).to.equal('active');
        expect(res.body.item.cardId).to.equal(card.id);
        expect(res.body.item.resolvedAt).to.be.null;
      });

      it('reason이 200자를 초과하면 400 에러를 반환해야 함', async () => {
        const reason = 'A'.repeat(201);

        await request(app)
          .post(`/api/cards/${card.id}/blockers`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ reason })
          .expect(400);
      });

      it('reason이 비어있으면 400 에러를 반환해야 함', async () => {
        await request(app)
          .post(`/api/cards/${card.id}/blockers`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ reason: '' })
          .expect(400);
      });
    });

    describe('PATCH /api/blockers/:id — resolved 상태 변경', () => {
      let blocker;

      beforeEach(async () => {
        blocker = await Blocker.qm.createOne({
          cardId: card.id,
          reason: '테스트 블로커',
          status: 'active',
          creatorUserId: user.id,
        });
      });

      it('status를 resolved로 변경하면 resolvedAt이 설정되어야 함', async () => {
        const res = await request(app)
          .patch(`/api/blockers/${blocker.id}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ status: 'resolved' })
          .expect(200);

        expect(res.body.item.status).to.equal('resolved');
        expect(res.body.item.resolvedAt).to.not.be.null;
      });

      it('status를 active로 되돌리면 resolvedAt이 null로 초기화되어야 함', async () => {
        // 먼저 resolved로 변경
        await request(app)
          .patch(`/api/blockers/${blocker.id}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ status: 'resolved' })
          .expect(200);

        // 다시 active로 변경
        const res = await request(app)
          .patch(`/api/blockers/${blocker.id}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ status: 'active' })
          .expect(200);

        expect(res.body.item.status).to.equal('active');
        expect(res.body.item.resolvedAt).to.be.null;
      });
    });

    describe('DELETE /api/blockers/:id', () => {
      it('블로커를 삭제해야 함', async () => {
        const blocker = await Blocker.qm.createOne({
          cardId: card.id,
          reason: '삭제할 블로커',
          status: 'active',
          creatorUserId: user.id,
        });

        const res = await request(app)
          .delete(`/api/blockers/${blocker.id}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        expect(res.body.item).to.exist;
        expect(res.body.item.id).to.equal(blocker.id);

        // DB에서 삭제 확인
        const deleted = await Blocker.findOne({ id: blocker.id });
        expect(deleted).to.be.undefined;
      });
    });

    describe('복수 블로커 독립 상태 관리', () => {
      it('하나의 블로커 상태 변경이 다른 블로커에 영향을 주지 않아야 함', async () => {
        const blocker1 = await Blocker.qm.createOne({
          cardId: card.id,
          reason: '블로커 1',
          status: 'active',
          creatorUserId: user.id,
        });

        const blocker2 = await Blocker.qm.createOne({
          cardId: card.id,
          reason: '블로커 2',
          status: 'active',
          creatorUserId: user.id,
        });

        // blocker1만 resolved로 변경
        await request(app)
          .patch(`/api/blockers/${blocker1.id}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ status: 'resolved' })
          .expect(200);

        // blocker2는 여전히 active여야 함
        const updatedBlocker2 = await Blocker.findOne({ id: blocker2.id });
        expect(updatedBlocker2.status).to.equal('active');
        expect(updatedBlocker2.resolvedAt).to.be.null;
      });
    });
  });

  // ============================================================
  // 카드 관계 (하위 티켓) 테스트
  // ============================================================
  describe('카드 관계 (하위 티켓) API', () => {
    let parentCard;
    let childCard;

    beforeEach(async () => {
      parentCard = await Card.qm.createOne({
        boardId: board.id,
        listId: listDev.id,
        position: 65536,
        name: 'Parent Card',
        type: 'card',
      });

      childCard = await Card.qm.createOne({
        boardId: board.id,
        listId: listBacklog.id,
        position: 65536,
        name: 'Child Card',
        type: 'card',
      });
    });

    afterEach(async () => {
      await CardRelationship.destroy({});
      await Card.destroy({ boardId: board.id });
    });

    describe('POST /api/cards/:cardId/card-relationships', () => {
      it('하위 티켓 관계를 생성해야 함', async () => {
        const res = await request(app)
          .post(`/api/cards/${parentCard.id}/card-relationships`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ childCardId: childCard.id })
          .expect(200);

        expect(res.body.item).to.exist;
        expect(res.body.item.parentCardId).to.equal(parentCard.id);
        expect(res.body.item.childCardId).to.equal(childCard.id);
        expect(res.body.item.type).to.equal('sub_ticket');
      });
    });

    describe('최대 20개 하위 티켓 제한', () => {
      it('21번째 하위 티켓 생성 시 409를 반환해야 함', async () => {
        // 20개 하위 티켓 생성
        for (let i = 0; i < 20; i++) {
          const child = await Card.qm.createOne({
            boardId: board.id,
            listId: listBacklog.id,
            position: 65536 * (i + 2),
            name: `Child ${i}`,
            type: 'card',
          });

          await CardRelationship.qm.createOne({
            parentCardId: parentCard.id,
            childCardId: child.id,
            type: 'sub_ticket',
            position: 65536 * (i + 1),
          });
        }

        // 21번째 시도 — 409 Conflict
        const extraChild = await Card.qm.createOne({
          boardId: board.id,
          listId: listBacklog.id,
          position: 65536 * 22,
          name: 'Extra Child',
          type: 'card',
        });

        await request(app)
          .post(`/api/cards/${parentCard.id}/card-relationships`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ childCardId: extraChild.id })
          .expect(409);
      });
    });

    describe('중첩 불허: 이미 부모인 카드를 자식으로 추가', () => {
      it('이미 하위 티켓을 가진 카드를 다른 카드의 하위 티켓으로 추가하면 409를 반환해야 함', async () => {
        // childCard가 이미 부모 역할 (grandChild를 가짐)
        const grandChild = await Card.qm.createOne({
          boardId: board.id,
          listId: listBacklog.id,
          position: 131072,
          name: 'Grand Child',
          type: 'card',
        });

        await CardRelationship.qm.createOne({
          parentCardId: childCard.id,
          childCardId: grandChild.id,
          type: 'sub_ticket',
          position: 65536,
        });

        // childCard를 parentCard의 하위 티켓으로 추가 시도 — 409
        await request(app)
          .post(`/api/cards/${parentCard.id}/card-relationships`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ childCardId: childCard.id })
          .expect(409);
      });
    });

    describe('중첩 불허: 이미 자식인 카드를 부모로 사용', () => {
      it('이미 하위 티켓인 카드에 하위 티켓을 추가하면 409를 반환해야 함', async () => {
        // parentCard가 이미 다른 카드의 자식
        const grandParent = await Card.qm.createOne({
          boardId: board.id,
          listId: listDev.id,
          position: 131072,
          name: 'Grand Parent',
          type: 'card',
        });

        await CardRelationship.qm.createOne({
          parentCardId: grandParent.id,
          childCardId: parentCard.id,
          type: 'sub_ticket',
          position: 65536,
        });

        // parentCard(이미 자식)에 childCard를 하위 티켓으로 추가 시도 — 409
        await request(app)
          .post(`/api/cards/${parentCard.id}/card-relationships`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ childCardId: childCard.id })
          .expect(409);
      });
    });

    describe('동일 보드 제한', () => {
      it('다른 보드의 카드를 하위 티켓으로 추가하면 409를 반환해야 함', async () => {
        // 다른 보드 생성
        const otherBoard = await Board.create({
          projectId: project.id,
          position: 131072,
          name: 'Other Board',
        }).fetch();

        await BoardMembership.create({
          boardId: otherBoard.id,
          userId: user.id,
          role: 'editor',
        });

        const otherList = await List.qm.createOne({
          boardId: otherBoard.id,
          type: 'active',
          position: 65536,
          name: 'Other List',
        });

        const otherCard = await Card.qm.createOne({
          boardId: otherBoard.id,
          listId: otherList.id,
          position: 65536,
          name: 'Other Board Card',
          type: 'card',
        });

        // 다른 보드의 카드를 하위 티켓으로 추가 시도 — 409
        await request(app)
          .post(`/api/cards/${parentCard.id}/card-relationships`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ childCardId: otherCard.id })
          .expect(409);

        // 정리
        await Card.destroy({ boardId: otherBoard.id });
        await List.destroy({ boardId: otherBoard.id });
        await BoardMembership.destroy({ boardId: otherBoard.id });
        await Board.destroyOne({ id: otherBoard.id });
      });
    });

    describe('DELETE /api/card-relationships/:id', () => {
      it('관계를 삭제하되 하위 카드는 보존해야 함', async () => {
        const relationship = await CardRelationship.qm.createOne({
          parentCardId: parentCard.id,
          childCardId: childCard.id,
          type: 'sub_ticket',
          position: 65536,
        });

        const res = await request(app)
          .delete(`/api/card-relationships/${relationship.id}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        expect(res.body.item).to.exist;
        expect(res.body.item.id).to.equal(relationship.id);

        // 관계는 삭제됨
        const deletedRel = await CardRelationship.findOne({ id: relationship.id });
        expect(deletedRel).to.be.undefined;

        // 하위 카드는 여전히 존재
        const preservedChild = await Card.findOne({ id: childCard.id });
        expect(preservedChild).to.exist;
        expect(preservedChild.name).to.equal('Child Card');
      });
    });

    describe('POST /api/cards/:cardId/card-relationships/sort', () => {
      it('하위 티켓 순서를 재정렬해야 함', async () => {
        const child1 = await Card.qm.createOne({
          boardId: board.id,
          listId: listBacklog.id,
          position: 65536,
          name: 'Sort Child 1',
          type: 'card',
        });

        const child2 = await Card.qm.createOne({
          boardId: board.id,
          listId: listBacklog.id,
          position: 131072,
          name: 'Sort Child 2',
          type: 'card',
        });

        const rel1 = await CardRelationship.qm.createOne({
          parentCardId: parentCard.id,
          childCardId: child1.id,
          type: 'sub_ticket',
          position: 65536,
        });

        const rel2 = await CardRelationship.qm.createOne({
          parentCardId: parentCard.id,
          childCardId: child2.id,
          type: 'sub_ticket',
          position: 131072,
        });

        // 순서 변경: rel2를 rel1 앞으로
        const res = await request(app)
          .post(`/api/cards/${parentCard.id}/card-relationships/sort`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ relationshipIds: [rel2.id, rel1.id] })
          .expect(200);

        expect(res.body.items).to.exist;
        expect(res.body.items).to.have.lengthOf(2);

        // 재정렬 후 rel2가 rel1보다 앞에 위치해야 함
        const sorted = res.body.items.sort((a, b) => a.position - b.position);
        expect(sorted[0].id).to.equal(rel2.id);
        expect(sorted[1].id).to.equal(rel1.id);
      });
    });
  });
});
