import Config from '../Config.js';

// 보드 페이지 객체 — 홈에서 보드로 진입하고 보드 컨텍스트를 다루는 공통 동작을 제공한다.
// 캘린더 외 시나리오에서도 재사용할 수 있도록 별도 페이지 객체로 분리한다.
export default class BoardPage {
  constructor() {
    this.url = Config.BASE_URL;

    // 보드/프로젝트 링크는 `/boards/:id` 로 연결되는 앵커로 렌더된다
    // (components/boards/Boards/Item.jsx, projects/ProjectCard/ProjectCard.jsx).
    // class 는 scss module 로 해시되므로 href 패턴으로 안정적으로 타게팅한다.
    this.boardLinkSelector = 'a[href*="/boards/"]';
  }

  async navigateHome() {
    await page.goto(this.url);
  }

  // 홈에서 첫 번째 보드로 진입한다. 시드/데모 환경의 보드 이름에 의존하지 않도록
  // href 패턴 기반으로 첫 보드 링크를 클릭한다.
  async openFirstBoard() {
    await this.navigateHome();
    await page.locator(this.boardLinkSelector).first().click();
    await page.waitForURL('**/boards/**');
  }

  // 이름으로 특정 보드를 연다. 보드 링크 앵커에는 title={board.name} 이 부여된다.
  async openBoardByName(boardName) {
    await this.navigateHome();
    await page.locator(`a[title="${boardName}"]`).first().click();
    await page.waitForURL('**/boards/**');
  }
}
