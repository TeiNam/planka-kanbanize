const { expect } = require('chai');

describe('helpers/lists/update-one', () => {
  let project;
  let board;
  let user;
  let list;

  before(async () => {
    // 테스트용 사용자 생성
    user = await User.qm.createOne({
      email: 'list-update-test@test.com',
      password: 'password123',
      name: 'Test User',
    });

    // 테스트용 프로젝트 생성
    project = await Project.create({
      name: 'Test Project',
    }).fetch();

    // 테스트용 보드 생성
    board = await Board.create({
      projectId: project.id,
      position: 65536,
      name: 'Test Board',
    }).fetch();

    // 보드 멤버십 생성
    await BoardMembership.create({
      boardId: board.id,
      userId: user.id,
      role: 'editor',
    });
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
    // 테스트 후 정리: 서브컬럼 및 카드 삭제
    await Card.destroy({ boardId: board.id });
    await List.destroy({ boardId: board.id, id: { '!=': list.id } });
    await List.destroyOne({ id: list.id });
  });

  after(async () => {
    await BoardMembership.destroy({ boardId: board.id });
    await Board.destroyOne({ id: board.id });
    await Project.destroyOne({ id: project.id });
    await User.destroyOne({ id: user.id });
  });

  describe('wipLimit 필드 업데이트', () => {
    it('wipLimit을 정수로 설정할 수 있어야 함', async () => {
      const updatedList = await sails.helpers.lists.updateOne.with({
        record: list,
        values: { wipLimit: 5 },
        project,
        board,
        actorUser: user,
      });

      expect(updatedList).to.exist;
      expect(updatedList.wipLimit).to.equal(5);
    });

    it('wipLimit을 null로 설정하여 제한을 해제할 수 있어야 함', async () => {
      // 먼저 설정
      await sails.helpers.lists.updateOne.with({
        record: list,
        values: { wipLimit: 10 },
        project,
        board,
        actorUser: user,
      });

      // record를 다시 조회
      const refreshedList = await List.qm.getOneById(list.id);

      const updatedList = await sails.helpers.lists.updateOne.with({
        record: refreshedList,
        values: { wipLimit: null },
        project,
        board,
        actorUser: user,
      });

      expect(updatedList).to.exist;
      expect(updatedList.wipLimit).to.be.null;
    });
  });

  describe('isBuffer 필드 업데이트', () => {
    it('isBuffer를 true로 설정할 수 있어야 함', async () => {
      const updatedList = await sails.helpers.lists.updateOne.with({
        record: list,
        values: { isBuffer: true },
        project,
        board,
        actorUser: user,
      });

      expect(updatedList).to.exist;
      expect(updatedList.isBuffer).to.equal(true);
    });
  });

  describe('pullCriteria 필드 업데이트', () => {
    it('pullCriteria 텍스트를 설정할 수 있어야 함', async () => {
      const criteria = 'Code review 완료, 테스트 통과';
      const updatedList = await sails.helpers.lists.updateOne.with({
        record: list,
        values: { pullCriteria: criteria },
        project,
        board,
        actorUser: user,
      });

      expect(updatedList).to.exist;
      expect(updatedList.pullCriteria).to.equal(criteria);
    });

    it('pullCriteria를 null로 설정하여 제거할 수 있어야 함', async () => {
      const updatedList = await sails.helpers.lists.updateOne.with({
        record: list,
        values: { pullCriteria: null },
        project,
        board,
        actorUser: user,
      });

      expect(updatedList).to.exist;
      expect(updatedList.pullCriteria).to.be.null;
    });
  });

  describe('policy 필드 업데이트', () => {
    it('policy 텍스트를 설정할 수 있어야 함', async () => {
      const policyText = '모든 작업은 페어 프로그래밍으로 진행';
      const updatedList = await sails.helpers.lists.updateOne.with({
        record: list,
        values: { policy: policyText },
        project,
        board,
        actorUser: user,
      });

      expect(updatedList).to.exist;
      expect(updatedList.policy).to.equal(policyText);
    });
  });

  describe('subColumnType 필드 업데이트', () => {
    it('서브컬럼 리스트의 subColumnType을 업데이트할 수 있어야 함', async () => {
      // 서브컬럼 활성화하여 자식 리스트 생성
      await sails.helpers.lists.updateOne.with({
        record: list,
        values: {},
        project,
        board,
        actorUser: user,
        enableSubColumns: true,
      });

      const allLists = await List.qm.getByBoardId(board.id);
      const activeChild = allLists.find(
        (l) => l.parentListId === list.id && l.subColumnType === 'active',
      );

      expect(activeChild).to.exist;
      expect(activeChild.subColumnType).to.equal('active');
    });
  });

  describe('서브컬럼 활성화', () => {
    it('서브컬럼 활성화 시 Active/Done 자식 리스트가 생성되어야 함', async () => {
      await sails.helpers.lists.updateOne.with({
        record: list,
        values: {},
        project,
        board,
        actorUser: user,
        enableSubColumns: true,
      });

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
        name: 'Test Card 1',
        type: 'card',
      });

      await Card.create({
        boardId: board.id,
        listId: list.id,
        position: 131072,
        name: 'Test Card 2',
        type: 'card',
      });

      await sails.helpers.lists.updateOne.with({
        record: list,
        values: {},
        project,
        board,
        actorUser: user,
        enableSubColumns: true,
      });

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
  });

  describe('서브컬럼 비활성화', () => {
    it('서브컬럼 비활성화 시 카드가 부모 컬럼으로 병합되어야 함 (Active 먼저, Done 뒤에)', async () => {
      // 서브컬럼 활성화
      await sails.helpers.lists.updateOne.with({
        record: list,
        values: {},
        project,
        board,
        actorUser: user,
        enableSubColumns: true,
      });

      const allLists = await List.qm.getByBoardId(board.id);
      const activeChild = allLists.find(
        (l) => l.parentListId === list.id && l.subColumnType === 'active',
      );
      const doneChild = allLists.find(
        (l) => l.parentListId === list.id && l.subColumnType === 'done',
      );

      // Active에 카드 추가
      await Card.create({
        boardId: board.id,
        listId: activeChild.id,
        position: 65536,
        name: 'Active Card 1',
        type: 'card',
      });

      await Card.create({
        boardId: board.id,
        listId: activeChild.id,
        position: 131072,
        name: 'Active Card 2',
        type: 'card',
      });

      // Done에 카드 추가
      await Card.create({
        boardId: board.id,
        listId: doneChild.id,
        position: 65536,
        name: 'Done Card 1',
        type: 'card',
      });

      // record를 다시 조회
      const refreshedList = await List.qm.getOneById(list.id);

      // 서브컬럼 비활성화
      await sails.helpers.lists.updateOne.with({
        record: refreshedList,
        values: {},
        project,
        board,
        actorUser: user,
        enableSubColumns: false,
      });

      // 부모 리스트에 모든 카드가 있어야 함
      const parentCards = await Card.qm.getByListId(list.id);
      expect(parentCards).to.have.lengthOf(3);

      // Active 카드가 Done 카드보다 앞에 위치해야 함
      const sortedCards = _.sortBy(parentCards, ['position']);
      expect(sortedCards[0].name).to.equal('Active Card 1');
      expect(sortedCards[1].name).to.equal('Active Card 2');
      expect(sortedCards[2].name).to.equal('Done Card 1');

      // 서브컬럼 리스트가 삭제되어야 함
      const remainingLists = await List.qm.getByBoardId(board.id);
      const childLists = remainingLists.filter((l) => l.parentListId === list.id);
      expect(childLists).to.have.lengthOf(0);
    });
  });
});
