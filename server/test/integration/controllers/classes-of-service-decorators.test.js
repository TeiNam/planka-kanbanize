const { expect } = require('chai');
const request = require('supertest');

// 서비스 클래스 및 데코레이터 통합 테스트
describe('Classes of Service & Decorators API', () => {
  let app;
  let authToken;
  let boardId;
  let projectId;
  let cardId;

  // 테스트 전 인증 토큰 및 보드/카드 생성
  before(async function beforeAll() {
    this.timeout(30000);
    app = sails.hooks.http.app;

    // 관리자 로그인으로 토큰 획득
    const loginRes = await request(app)
      .post('/api/access-tokens')
      .send({ emailOrUsername: 'demo@demo.demo', password: 'demo' })
      .expect(200);

    authToken = loginRes.body.item.token;

    // 프로젝트 생성
    const projectRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'CoS Test Project' })
      .expect(200);

    projectId = projectRes.body.item.id;

    // 보드 생성
    const boardRes = await request(app)
      .post(`/api/projects/${projectId}/boards`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'CoS Test Board', position: 65536 })
      .expect(200);

    boardId = boardRes.body.item.id;

    // 리스트 생성
    const listRes = await request(app)
      .post(`/api/boards/${boardId}/lists`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Backlog', position: 65536 })
      .expect(200);

    const listId = listRes.body.item.id;

    // 카드 생성
    const cardRes = await request(app)
      .post(`/api/lists/${listId}/cards`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Test Card', position: 65536 })
      .expect(200);

    cardId = cardRes.body.item.id;
  });

  // 테스트 후 정리
  after(async function afterAll() {
    this.timeout(10000);
    if (projectId) {
      await request(app)
        .delete(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`);
    }
  });

  // ============================================================
  // 서비스 클래스 (Class of Service) 테스트
  // ============================================================
  describe('Class of Service', () => {
    describe('POST /api/boards/:boardId/classes-of-service', () => {
      it('사용자 정의 CoS를 생성해야 함 (name 최대 30자, color 필수)', async () => {
        const res = await request(app)
          .post(`/api/boards/${boardId}/classes-of-service`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: 'Custom Class',
            color: 'berry-red',
            position: 65536,
          })
          .expect(200);

        expect(res.body.item).to.have.property('id');
        expect(res.body.item.name).to.equal('Custom Class');
        expect(res.body.item.color).to.equal('berry-red');
        expect(res.body.item.type).to.equal('custom');
        expect(res.body.item.isDefault).to.equal(false);
      });

      it('name이 30자를 초과하면 400을 반환해야 함', async () => {
        const longName = 'A'.repeat(31);

        await request(app)
          .post(`/api/boards/${boardId}/classes-of-service`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: longName,
            color: 'berry-red',
            position: 65536,
          })
          .expect(400);
      });

      it('color가 누락되면 400을 반환해야 함', async () => {
        await request(app)
          .post(`/api/boards/${boardId}/classes-of-service`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: 'No Color',
            position: 65536,
          })
          .expect(400);
      });

      it('policy를 포함하여 생성할 수 있어야 함', async () => {
        const res = await request(app)
          .post(`/api/boards/${boardId}/classes-of-service`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: 'With Policy',
            color: 'lagoon-blue',
            policy: 'Must be completed within 24 hours',
            position: 131072,
          })
          .expect(200);

        expect(res.body.item.policy).to.equal('Must be completed within 24 hours');
      });
    });

    describe('보드당 사용자 정의 CoS 최대 10개 제한', () => {
      let tempBoardId;

      before(async function beforeMaxTest() {
        this.timeout(15000);

        // 별도 보드 생성
        const boardRes = await request(app)
          .post(`/api/projects/${projectId}/boards`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ name: 'Max CoS Board', position: 131072 })
          .expect(200);

        tempBoardId = boardRes.body.item.id;

        // 10개 사용자 정의 CoS 생성
        for (let i = 0; i < 10; i++) {
          await request(app)
            .post(`/api/boards/${tempBoardId}/classes-of-service`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({
              name: `Custom ${i + 1}`,
              color: 'berry-red',
              position: (i + 1) * 65536,
            })
            .expect(200);
        }
      });

      it('11번째 사용자 정의 CoS 생성 시 409를 반환해야 함', async () => {
        const res = await request(app)
          .post(`/api/boards/${tempBoardId}/classes-of-service`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: 'Overflow',
            color: 'berry-red',
            position: 720896,
          })
          .expect(409);

        expect(res.body).to.have.property('maxCustomClassesReached');
      });
    });

    describe('PATCH /api/classes-of-service/:id', () => {
      let cosId;

      before(async () => {
        const res = await request(app)
          .post(`/api/boards/${boardId}/classes-of-service`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: 'To Update',
            color: 'lagoon-blue',
            position: 262144,
          })
          .expect(200);

        cosId = res.body.item.id;
      });

      it('name, color, policy를 업데이트할 수 있어야 함', async () => {
        const res = await request(app)
          .patch(`/api/classes-of-service/${cosId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: 'Updated Name',
            color: 'pumpkin-orange',
            policy: 'New policy text',
          })
          .expect(200);

        expect(res.body.item.name).to.equal('Updated Name');
        expect(res.body.item.color).to.equal('pumpkin-orange');
        expect(res.body.item.policy).to.equal('New policy text');
      });

      it('존재하지 않는 CoS 업데이트 시 404를 반환해야 함', async () => {
        await request(app)
          .patch('/api/classes-of-service/99999999')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ name: 'Ghost' })
          .expect(404);
      });
    });

    describe('DELETE /api/classes-of-service/:id', () => {
      it('사용자 정의 CoS를 삭제하면 카드의 classOfServiceId가 null이 되어야 함', async () => {
        // CoS 생성
        const cosRes = await request(app)
          .post(`/api/boards/${boardId}/classes-of-service`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: 'To Delete',
            color: 'fresh-salad',
            position: 327680,
          })
          .expect(200);

        const cosId = cosRes.body.item.id;

        // 카드에 CoS 할당
        await request(app)
          .patch(`/api/cards/${cardId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ classOfServiceId: cosId })
          .expect(200);

        // CoS 삭제
        await request(app)
          .delete(`/api/classes-of-service/${cosId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        // 카드의 classOfServiceId가 null인지 확인
        const cardRes = await request(app)
          .get(`/api/cards/${cardId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(cardRes.body.item.classOfServiceId).to.equal(null);
      });

      it('기본 CoS 삭제 시 409 (cannotDeleteDefault)를 반환해야 함', async () => {
        // 기본 CoS 초기화
        await sails.helpers.classesOfService.initializeDefaults.with({
          board: { id: boardId },
        });

        // 기본 CoS 조회
        const classesOfService = await ClassOfService.qm.getByBoardId(boardId);
        const defaultCos = classesOfService.find((cos) => cos.isDefault === true);

        expect(defaultCos).to.exist;

        const res = await request(app)
          .delete(`/api/classes-of-service/${defaultCos.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(409);

        expect(res.body).to.have.property('cannotDeleteDefault');
      });
    });

    describe('기본 CoS 초기화', () => {
      it('initializeDefaults가 4개의 기본 CoS를 생성해야 함', async () => {
        // 별도 보드 생성
        const boardRes = await request(app)
          .post(`/api/projects/${projectId}/boards`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ name: 'Defaults Board', position: 196608 })
          .expect(200);

        const newBoardId = boardRes.body.item.id;

        // 기본 CoS 초기화
        const defaults = await sails.helpers.classesOfService.initializeDefaults.with({
          board: { id: newBoardId },
        });

        expect(defaults).to.have.lengthOf(4);

        const names = defaults.map((d) => d.name);
        expect(names).to.include('Expedite');
        expect(names).to.include('Fixed Date');
        expect(names).to.include('Standard');
        expect(names).to.include('Intangible');

        const types = defaults.map((d) => d.type);
        expect(types).to.include('expedite');
        expect(types).to.include('fixed_date');
        expect(types).to.include('standard');
        expect(types).to.include('intangible');

        defaults.forEach((d) => {
          expect(d.isDefault).to.equal(true);
        });
      });
    });
  });

  // ============================================================
  // 데코레이터 (Decorator) 테스트
  // ============================================================
  describe('Decorator', () => {
    let decoratorId;

    describe('POST /api/boards/:boardId/decorators', () => {
      it('데코레이터를 생성해야 함 (name, icon 필수)', async () => {
        const res = await request(app)
          .post(`/api/boards/${boardId}/decorators`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: 'Tech Debt',
            icon: 'star',
            color: 'berry-red',
          })
          .expect(200);

        expect(res.body.item).to.have.property('id');
        expect(res.body.item.name).to.equal('Tech Debt');
        expect(res.body.item.icon).to.equal('star');
        expect(res.body.item.color).to.equal('berry-red');
        decoratorId = res.body.item.id;
      });

      it('name이 누락되면 400을 반환해야 함', async () => {
        await request(app)
          .post(`/api/boards/${boardId}/decorators`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            icon: 'circle',
          })
          .expect(400);
      });

      it('icon이 누락되면 400을 반환해야 함', async () => {
        await request(app)
          .post(`/api/boards/${boardId}/decorators`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: 'No Icon',
          })
          .expect(400);
      });
    });

    describe('PATCH /api/decorators/:id', () => {
      it('name, icon, color를 업데이트할 수 있어야 함', async () => {
        const res = await request(app)
          .patch(`/api/decorators/${decoratorId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: 'Updated Decorator',
            icon: 'circle',
            color: 'lagoon-blue',
          })
          .expect(200);

        expect(res.body.item.name).to.equal('Updated Decorator');
        expect(res.body.item.icon).to.equal('circle');
        expect(res.body.item.color).to.equal('lagoon-blue');
      });

      it('존재하지 않는 데코레이터 업데이트 시 404를 반환해야 함', async () => {
        await request(app)
          .patch('/api/decorators/99999999')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ name: 'Ghost' })
          .expect(404);
      });
    });

    describe('DELETE /api/decorators/:id', () => {
      it('데코레이터 삭제 시 관련 card-decorator 연결도 삭제되어야 함', async () => {
        // 새 데코레이터 생성
        const decRes = await request(app)
          .post(`/api/boards/${boardId}/decorators`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ name: 'To Delete', icon: 'triangle' })
          .expect(200);

        const decId = decRes.body.item.id;

        // 카드에 데코레이터 연결
        await request(app)
          .post(`/api/cards/${cardId}/card-decorators`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ decoratorId: decId })
          .expect(200);

        // 데코레이터 삭제
        await request(app)
          .delete(`/api/decorators/${decId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        // card-decorator 연결이 삭제되었는지 확인
        const cardDecorators = await CardDecorator.qm.getByCardId(cardId);
        const found = cardDecorators.find((cd) => cd.decoratorId === decId);
        expect(found).to.be.undefined;
      });
    });
  });

  // ============================================================
  // 카드-데코레이터 연결 (Card Decorator) 테스트
  // ============================================================
  describe('Card Decorator', () => {
    const testDecoratorIds = [];
    let testCardId;

    before(async function beforeCardDecorator() {
      this.timeout(10000);

      // 별도 카드 생성 (이전 테스트에서 데코레이터가 연결된 카드와 분리)
      const listRes = await request(app)
        .post(`/api/boards/${boardId}/lists`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Card Dec List', position: 131072 })
        .expect(200);

      const cardRes = await request(app)
        .post(`/api/lists/${listRes.body.item.id}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Dec Test Card', position: 65536 })
        .expect(200);

      testCardId = cardRes.body.item.id;

      // 테스트용 데코레이터 6개 생성
      for (let i = 0; i < 6; i++) {
        const res = await request(app)
          .post(`/api/boards/${boardId}/decorators`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ name: `Dec ${i + 1}`, icon: 'star' })
          .expect(200);

        testDecoratorIds.push(res.body.item.id);
      }
    });

    describe('POST /api/cards/:cardId/card-decorators', () => {
      it('카드에 데코레이터를 연결해야 함', async () => {
        const res = await request(app)
          .post(`/api/cards/${testCardId}/card-decorators`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ decoratorId: testDecoratorIds[0] })
          .expect(200);

        expect(res.body.item).to.have.property('id');
        expect(res.body.item.cardId).to.equal(testCardId);
        expect(res.body.item.decoratorId).to.equal(testDecoratorIds[0]);
      });

      it('카드당 최대 5개 데코레이터 연결 후 6번째 시 409를 반환해야 함', async () => {
        // 나머지 4개 연결 (총 5개)
        for (let i = 1; i < 5; i++) {
          await request(app)
            .post(`/api/cards/${testCardId}/card-decorators`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({ decoratorId: testDecoratorIds[i] })
            .expect(200);
        }

        // 6번째 연결 시도 → 409
        const res = await request(app)
          .post(`/api/cards/${testCardId}/card-decorators`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ decoratorId: testDecoratorIds[5] })
          .expect(409);

        expect(res.body).to.have.property('maxDecoratorsReached');
      });

      it('동일 데코레이터를 같은 카드에 중복 연결 시 409를 반환해야 함', async () => {
        const res = await request(app)
          .post(`/api/cards/${testCardId}/card-decorators`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ decoratorId: testDecoratorIds[0] })
          .expect(409);

        expect(res.body).to.have.property('decoratorAlreadyInCard');
      });
    });

    describe('DELETE /api/card-decorators/:id', () => {
      it('카드에서 데코레이터를 제거해야 함', async () => {
        // 현재 연결된 card-decorator 조회
        const cardDecorators = await CardDecorator.qm.getByCardId(testCardId);
        const targetCd = cardDecorators[0];

        expect(targetCd).to.exist;

        const res = await request(app)
          .delete(`/api/card-decorators/${targetCd.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(res.body.item.id).to.equal(targetCd.id);

        // 삭제 확인
        const remaining = await CardDecorator.qm.getByCardId(testCardId);
        const found = remaining.find((cd) => cd.id === targetCd.id);
        expect(found).to.be.undefined;
      });

      it('존재하지 않는 card-decorator 삭제 시 404를 반환해야 함', async () => {
        await request(app)
          .delete('/api/card-decorators/99999999')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(404);
      });
    });
  });
});
