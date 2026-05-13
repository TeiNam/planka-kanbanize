const { expect } = require('chai');

describe('helpers/cards/record-movement', () => {
  let project;
  let board;
  let user;
  let listTodo;
  let listInProgress;
  let listDone;
  let card;

  before(async () => {
    // 테스트용 사용자 생성
    user = await User.qm.createOne({
      email: 'record-movement-test@test.com',
      password: 'password123',
      name: 'Movement Test User',
    });

    // 테스트용 프로젝트 생성
    project = await Project.create({
      name: 'Movement Test Project',
    }).fetch();

    // 테스트용 보드 생성
    board = await Board.create({
      projectId: project.id,
      position: 65536,
      name: 'Movement Test Board',
    }).fetch();

    // 보드 멤버십 생성
    await BoardMembership.create({
      boardId: board.id,
      userId: user.id,
      role: 'editor',
    });

    // 리스트 생성
    listTodo = await List.qm.createOne({
      boardId: board.id,
      type: 'active',
      position: 65536,
      name: 'To Do',
    });

    listInProgress = await List.qm.createOne({
      boardId: board.id,
      type: 'active',
      position: 131072,
      name: 'In Progress',
      wipLimit: 3,
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
      listId: listTodo.id,
      position: 65536,
      name: 'Test Card',
      type: 'card',
    });
  });

  afterEach(async () => {
    // 테스트 후 정리
    await CardMovementLog.destroy({ boardId: board.id });
    await Card.destroy({ boardId: board.id });
  });

  after(async () => {
    await List.destroy({ boardId: board.id });
    await BoardMembership.destroy({ boardId: board.id });
    await Board.destroyOne({ id: board.id });
    await Project.destroyOne({ id: project.id });
    await User.destroyOne({ id: user.id });
  });

  describe('이동 이력 기록', () => {
    it('카드 이동 시 card_movement_log 레코드가 생성되어야 함', async () => {
      const result = await sails.helpers.cards.recordMovement.with({
        card,
        board,
        fromList: listTodo,
        toList: listInProgress,
        user,
      });

      expect(result.movementLog).to.exist;
      expect(result.movementLog.cardId).to.equal(card.id);
      expect(result.movementLog.boardId).to.equal(board.id);
      expect(result.movementLog.fromListId).to.equal(listTodo.id);
      expect(result.movementLog.toListId).to.equal(listInProgress.id);
      expect(result.movementLog.userId).to.equal(user.id);
      expect(result.movementLog.movedAt).to.exist;
    });

    it('fromList가 null인 경우 (신규 카드) fromListId가 null이어야 함', async () => {
      const result = await sails.helpers.cards.recordMovement.with({
        card,
        board,
        toList: listTodo,
        user,
      });

      expect(result.movementLog).to.exist;
      expect(result.movementLog.fromListId).to.be.null;
      expect(result.movementLog.toListId).to.equal(listTodo.id);
    });

    it('user가 null인 경우 userId가 null이어야 함', async () => {
      const result = await sails.helpers.cards.recordMovement.with({
        card,
        board,
        fromList: listTodo,
        toList: listInProgress,
      });

      expect(result.movementLog).to.exist;
      expect(result.movementLog.userId).to.be.null;
    });
  });

  describe('WIP 초과 검증 (소프트 제한)', () => {
    it('WIP 제한이 없는 컬럼으로 이동 시 wipExceeded가 false여야 함', async () => {
      const result = await sails.helpers.cards.recordMovement.with({
        card,
        board,
        fromList: listInProgress,
        toList: listDone,
        user,
      });

      expect(result.wipExceeded).to.be.false;
      expect(result.wipLimit).to.be.null;
      expect(result.currentCount).to.equal(0);
    });

    it('WIP 제한 미초과 시 wipExceeded가 false여야 함', async () => {
      // listInProgress의 wipLimit은 3, 현재 카드 1개 (이동된 카드 포함)
      const result = await sails.helpers.cards.recordMovement.with({
        card,
        board,
        fromList: listTodo,
        toList: listInProgress,
        user,
      });

      expect(result.wipExceeded).to.be.false;
      expect(result.wipLimit).to.equal(3);
    });

    it('WIP 제한 초과 시 wipExceeded가 true여야 함', async () => {
      // listInProgress에 카드 3개 추가 (wipLimit = 3)
      await Card.qm.createOne({
        boardId: board.id,
        listId: listInProgress.id,
        position: 65536,
        name: 'Card 1',
        type: 'card',
      });
      await Card.qm.createOne({
        boardId: board.id,
        listId: listInProgress.id,
        position: 131072,
        name: 'Card 2',
        type: 'card',
      });
      await Card.qm.createOne({
        boardId: board.id,
        listId: listInProgress.id,
        position: 196608,
        name: 'Card 3',
        type: 'card',
      });

      // 4번째 카드 이동 시도 — WIP 초과
      const result = await sails.helpers.cards.recordMovement.with({
        card,
        board,
        fromList: listTodo,
        toList: listInProgress,
        user,
      });

      expect(result.wipExceeded).to.be.true;
      expect(result.wipLimit).to.equal(3);
      expect(result.currentCount).to.be.above(3);
    });

    it('이동 자체는 WIP 초과와 관계없이 항상 기록되어야 함 (소프트 제한)', async () => {
      // listInProgress에 카드 3개 추가 (wipLimit = 3)
      await Card.qm.createOne({
        boardId: board.id,
        listId: listInProgress.id,
        position: 65536,
        name: 'Card A',
        type: 'card',
      });
      await Card.qm.createOne({
        boardId: board.id,
        listId: listInProgress.id,
        position: 131072,
        name: 'Card B',
        type: 'card',
      });
      await Card.qm.createOne({
        boardId: board.id,
        listId: listInProgress.id,
        position: 196608,
        name: 'Card C',
        type: 'card',
      });

      // WIP 초과 상태에서도 이동 기록은 생성됨
      const result = await sails.helpers.cards.recordMovement.with({
        card,
        board,
        fromList: listTodo,
        toList: listInProgress,
        user,
      });

      expect(result.movementLog).to.exist;
      expect(result.movementLog.toListId).to.equal(listInProgress.id);
      expect(result.wipExceeded).to.be.true;
    });
  });

  describe('스윔레인 정보 기록', () => {
    it('스윔레인 정보가 있으면 기록에 포함되어야 함', async () => {
      const swimLane = await SwimLane.qm.createOne({
        boardId: board.id,
        position: 65536,
        name: 'Feature',
        type: 'standard',
      });

      const result = await sails.helpers.cards.recordMovement.with({
        card,
        board,
        fromList: listTodo,
        toList: listInProgress,
        fromSwimLane: swimLane,
        toSwimLane: swimLane,
        user,
      });

      expect(result.movementLog.fromSwimLaneId).to.equal(swimLane.id);
      expect(result.movementLog.toSwimLaneId).to.equal(swimLane.id);

      // 정리
      await SwimLane.destroyOne({ id: swimLane.id });
    });
  });
});
