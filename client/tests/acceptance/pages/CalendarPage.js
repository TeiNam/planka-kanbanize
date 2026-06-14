import Config from '../Config.js';

// 캘린더 보드 페이지 객체.
//
// 셀렉터 전략: 기존 acceptance 테스트(LoginPage/HomePage)와 동일하게 data-* 속성을 추가하지 않고
// CSS/텍스트/role/aria-label/value 기반 셀렉터만 사용한다. scss module 의 클래스명은 빌드 시
// 해시되므로, 다음과 같이 빌드에 영향받지 않는 안정적 요소를 타게팅한다.
//   - 뷰 전환 버튼: <button value="calendar"> (RightSide.jsx)
//   - 캘린더 진입 확인: 툴바의 설정 버튼 aria-label="Calendar Settings" (CalendarToolbar.jsx)
//   - 일정/마감일 항목: title={name} 속성 (CalendarEventItem.jsx / DueDateItem.jsx)
//   - 팝업 제출 버튼: semantic-ui 의 .positive / .negative (login.feature 가 .primary 를 쓰는 것과 동일 관례)
//   - 날짜 셀: 날짜 숫자 텍스트(월 중간 날짜는 그리드에서 유일하게 1회만 노출)
export default class CalendarPage {
  constructor() {
    this.timeout = Config.TIMEOUT;

    // 보드 헤더 우측 뷰 토글의 캘린더 버튼 (R1.2)
    this.calendarViewButtonSelector = 'button[value="calendar"]';

    // 캘린더 뷰가 렌더되었음을 나타내는 고유 요소 (툴바 설정 버튼)
    this.calendarSettingsButtonSelector = 'button[aria-label="Calendar Settings"]';
    this.todayButtonSelector = 'button:has-text("Today")';

    // 일정 생성/수정 팝업 폼 요소 (CalendarEventPopup.jsx)
    this.eventNameInputSelector = 'input[name="name"]';
    this.eventStartDateInputSelector = 'input[name="startDate"]';
    this.eventEndDateInputSelector = 'input[name="endDate"]';

    // semantic-ui 색상 버튼 클래스 — 생성/저장은 positive, 삭제 확인은 negative
    this.submitButtonSelector = 'button.positive';
    this.deleteConfirmButtonSelector = 'button.negative';

    // ── 날짜 셀 / 항목 로케이터 (상태 없는 팩토리) ────────────────────────────
    // 월 중간 날짜(예: 15)는 인접 월의 채움 셀에는 나타나지 않으므로 그리드에서 유일하다.
    this.dayNumberLocator = (day) => page.getByText(String(day), { exact: true });
    // 일정/마감일 항목은 title={name} 으로 노출되므로 이름으로 정확히 타게팅한다.
    this.itemByName = (name) => page.locator(`[title="${name}"]`);
  }

  // ── 뷰 전환 (R1.2) ────────────────────────────────────────────────────────
  async switchToCalendarView() {
    await page.click(this.calendarViewButtonSelector);
    await this.waitForCalendarVisible();
  }

  async waitForCalendarVisible() {
    await page.waitForSelector(this.calendarSettingsButtonSelector, { timeout: this.timeout });
  }

  async isCalendarVisible() {
    return page.isVisible(this.calendarSettingsButtonSelector);
  }

  // ── 날짜 셀 / 항목 셀렉터 ──────────────────────────────────────────────────
  // (dayNumberLocator / itemByName 은 생성자에서 상태 없는 로케이터 팩토리로 정의)

  // ── 일정 생성 (R3.8) ──────────────────────────────────────────────────────
  // 날짜 셀을 클릭하면 usePopup 트리거로 생성 팝업이 열린다(기본값: all-day, 클릭한 날짜로 프리필).
  async openCreatePopupOnDay(day) {
    await this.dayNumberLocator(day).first().click();
    await page.waitForSelector(this.eventNameInputSelector, { timeout: this.timeout });
  }

  async fillEventName(name) {
    await page.fill(this.eventNameInputSelector, name);
  }

  async submitEvent() {
    await page.click(this.submitButtonSelector);
  }

  async createAllDayEventOnDay(day, name) {
    await this.openCreatePopupOnDay(day);
    await this.fillEventName(name);
    await this.submitEvent();
    await this.itemByName(name).first().waitFor({ state: 'visible', timeout: this.timeout });
  }

  // ── 일정 수정 (R4.6) ──────────────────────────────────────────────────────
  // 일정 항목을 클릭하면 수정 모드 팝업이 열린다(이름 input 프리필 + 저장/삭제 컨트롤).
  async openEditPopup(name) {
    await this.itemByName(name).first().click();
    await page.waitForSelector(this.eventNameInputSelector, { timeout: this.timeout });
  }

  async renameEvent(currentName, newName) {
    await this.openEditPopup(currentName);
    await page.fill(this.eventNameInputSelector, newName);
    await this.submitEvent();
    await this.itemByName(newName).first().waitFor({ state: 'visible', timeout: this.timeout });
  }

  // ── 일정 삭제 (R5.4) ──────────────────────────────────────────────────────
  // 수정 팝업의 Delete → 확인 스텝(negative 버튼)으로 일정을 삭제한다.
  async deleteEvent(name) {
    await this.openEditPopup(name);
    await page.getByRole('button', { name: 'Delete', exact: true }).click();
    await page.click(this.deleteConfirmButtonSelector);
    await this.itemByName(name).first().waitFor({ state: 'hidden', timeout: this.timeout });
  }

  // ── 마감일 카드 (R8.3) ────────────────────────────────────────────────────
  // 마감일 항목 클릭 시 카드 라우트(/cards/:id)로 이동해 카드 모달이 열린다.
  async clickDueDateItem(cardName) {
    await this.itemByName(cardName).first().click();
  }
}
