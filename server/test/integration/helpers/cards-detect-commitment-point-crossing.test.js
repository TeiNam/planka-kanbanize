const { expect } = require('chai');

describe('helpers/cards/detect-commitment-point-crossing', () => {
  let project;
  let board;
  let user;
  let listBacklog;
  let listDev;
  let listDone;
  let card;

  before(async () => {
    // 테스트용 사용자 생성
    user = await User.qm.createOne({
      email: 'cp-crossing-test@test.com',
      password: 'password123',
      name: 'CP Test User',
    });

    // 테스트용 프로젝트 생성
    project = await Project.create({
      name: 'CP Test Project',
    }).fetch();

    // 테스트용 보드 생성
    board = await Board.create({
      projectId: project.id,
      position: 65536,
      name: 'CP Test Board',
    }).fetch();

    // 보드 멤버십 생성
    await BoardMembership.create({
      boardId: board.id,
      userId: user.id,
      role: 'editor',
    });

    // 리스트 3개 생성 (Backlog → Dev → Done)
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

    listDone = await List.qm.createOne({
      boardId: board.id,
      type: 'active',
      position: 196608,
      name: 'Done',
    });
  });

  beforeEach(async () => {
    // 각 테스트 전 카드 생성
    card = await Card.qm.createOne({
      boardId: board.id,
      listId: listBacklog.id,
      position: 65536,
      name: 'Test Card',
      type: 'card',
    });
  });

  afterEach(async () => {
    // 테스트 후 정리
    await CardCommitmentLog.destroy({ cardId: card.id });
    await Card.destroyOne({ id: card.id });
    await CommitmentPoint.destroy({ boardId: board.id });
  });

  after(async () => {
    await List.destroy({ boardId: board.id });
    await BoardMembership.destroy({ boardId: board.id });
    await Board.destroyOne({ id: board.id });
    await Project.destroyOne({ id: project.id });
    await User.destroyOne({ id: user.id });
  });

  describe('정방향 통과 (forward crossing)', () => {
    it('CP 이전 리스트에서 이후 리스트로 이동 시 forward 기록이 생성되어야 함', async () => {
      // Commitment Point 생성: Backlog | Dev (leftList=Backlog, rightList=Dev)
      await CommitmentPoint.qm.createOne({
        boardId: board.id,
        leftListId: listBacklog.id,
        rightListId: listDev.id,
        position: 65536,
        type: 'commitment',
      });

      const logs = await sails.helpers.cards.detectCommitmentPointCrossing.with({
        card,
        board,
        fromList: listBacklog,
        toList: listDev,
      });

      expect(logs).to.have.lengthOf(1);
      expect(logs[0].direction).to.equal('forward');
      expect(logs[0].cardId).to.equal(card.id);
      expect(logs[0].passedAt).to.exist;
    });

    it('CP를 건너뛰는 이동도 forward로 기록되어야 함', async () => {
      // Commitment Point: Backlog | Dev
      await CommitmentPoint.qm.createOne({
        boardId: board.id,
        leftListId: listBacklog.id,
        rightListId: listDev.id,
        position: 65536,
        type: 'commitment',
      });

      // Backlog → Done (Dev를 건너뜀)
      const logs = await sails.helpers.cards.detectCommitmentPointCrossing.with({
        card,
        board,
        fromList: listBacklog,
        toList: listDone,
      });

      expect(logs).to.have.lengthOf(1);
      expect(logs[0].direction).to.equal('forward');
    });
  });

  describe('역방향 통과 (backward crossing)', () => {
    it('CP 이후 리스트에서 이전 리스트로 이동 시 backward 기록이 생성되어야 함', async () => {
      // Commitment Point: Backlog | Dev
      await CommitmentPoint.qm.createOne({
        boardId: board.id,
        leftListId: listBacklog.id,
        rightListId: listDev.id,
        position: 65536,
        type: 'commitment',
      });

      const logs = await sails.helpers.cards.detectCommitmentPointCrossing.with({
        card,
        board,
        fromList: listDev,
        toList: listBacklog,
      });

      expect(logs).to.have.lengthOf(1);
      expect(logs[0].direction).to.equal('backward');
    });
  });

  describe('통과 없음 (no crossing)', () => {
    it('같은 쪽 리스트 간 이동 시 기록이 생성되지 않아야 함', async () => {
      // Commitment Point: Dev | Done
      await CommitmentPoint.qm.createOne({
        boardId: board.id,
        leftListId: listDev.id,
        rightListId: listDone.id,
        position: 65536,
        type: 'commitment',
      });

      // Backlog → Dev (둘 다 CP 이전)
      const logs = await sails.helpers.cards.detectCommitmentPointCrossing.with({
        card,
        board,
        fromList: listBacklog,
        toList: listDev,
      });

      expect(logs).to.have.lengthOf(0);
    });

    it('Commitment Point가 없는 보드에서는 기록이 생성되지 않아야 함', async () => {
      const logs = await sails.helpers.cards.detectCommitmentPointCrossing.with({
        card,
        board,
        fromList: listBacklog,
        toList: listDev,
      });

      expect(logs).to.have.lengthOf(0);
    });
  });

  describe('Delivery Point 통과 시 completedAt 처리', () => {
    it('Delivery Point 정방향 통과 시 card.completedAt이 설정되어야 함', async () => {
      // Delivery Point: Dev | Done
      await CommitmentPoint.qm.createOne({
        boardId: board.id,
        leftListId: listDev.id,
        rightListId: listDone.id,
        position: 65536,
        type: 'delivery',
      });

      await sails.helpers.cards.detectCommitmentPointCrossing.with({
        card,
        board,
        fromList: listDev,
        toList: listDone,
      });

      // 카드 다시 조회하여 completedAt 확인
      const updatedCard = await Card.findOne({ id: card.id });
      expect(updatedCard.completedAt).to.exist;
    });

    it('Delivery Point 역방향 통과 시 card.completedAt이 null로 초기화되어야 함', async () => {
      // 먼저 completedAt 설정
      await Card.updateOne({ id: card.id }).set({
        completedAt: new Date().toISOString(),
      });

      // Delivery Point: Dev | Done
      await CommitmentPoint.qm.createOne({
        boardId: board.id,
        leftListId: listDev.id,
        rightListId: listDone.id,
        position: 65536,
        type: 'delivery',
      });

      await sails.helpers.cards.detectCommitmentPointCrossing.with({
        card,
        board,
        fromList: listDone,
        toList: listDev,
      });

      // 카드 다시 조회하여 completedAt 확인
      const updatedCard = await Card.findOne({ id: card.id });
      expect(updatedCard.completedAt).to.be.null;
    });
  });

  describe('복수 Commitment Point 통과', () => {
    it('여러 CP를 한 번에 통과하면 각각 기록이 생성되어야 함', async () => {
      // CP1: Backlog | Dev
      await CommitmentPoint.qm.createOne({
        boardId: board.id,
        leftListId: listBacklog.id,
        rightListId: listDev.id,
        position: 65536,
        type: 'commitment',
      });

      // CP2 (Delivery): Dev | Done
      await CommitmentPoint.qm.createOne({
        boardId: board.id,
        leftListId: listDev.id,
        rightListId: listDone.id,
        position: 131072,
        type: 'delivery',
      });

      // Backlog → Done (두 CP 모두 통과)
      const logs = await sails.helpers.cards.detectCommitmentPointCrossing.with({
        card,
        board,
        fromList: listBacklog,
        toList: listDone,
      });

      expect(logs).to.have.lengthOf(2);
      expect(logs[0].direction).to.equal('forward');
      expect(logs[1].direction).to.equal('forward');

      // completedAt도 설정되어야 함 (Delivery Point 통과)
      const updatedCard = await Card.findOne({ id: card.id });
      expect(updatedCard.completedAt).to.exist;
    });
  });
});
