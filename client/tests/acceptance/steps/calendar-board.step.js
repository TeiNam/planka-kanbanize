import { Given, Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';

import BoardPage from '../pages/BoardPage.js';
import CalendarPage from '../pages/CalendarPage.js';

const boardPage = new BoardPage();
const calendarPage = new CalendarPage();

// 캘린더 보드 E2E 스텝 정의.
// 로그인은 login.step.js 의 공통 Given("the user is logged in ...") 을 재사용한다
// (cucumber 가 steps/**/*.js 를 모두 로드하므로 별도 import 가 필요 없다).
// 여기서는 보드 진입/캘린더 전환/일정 CRUD/마감일 카드 관련 스텝만 정의한다.

// ---------- GIVEN ----------

Given('the user opens a board', async () => {
  await boardPage.openFirstBoard();

  await expect(page).toHaveURL(/\/boards\//);
});

Given('the user is viewing the calendar board', async () => {
  await calendarPage.switchToCalendarView();

  await expect(page.locator(calendarPage.calendarSettingsButtonSelector)).toBeVisible();
});

// 마감일 항목 표시 전제. 항목은 title={card.name} 으로 노출된다(DueDateItem.jsx).
// 카드 마감일은 시드/사전 셋업으로 현재 표시 월에 존재해야 한다(라이브 환경 전제, Task 30).
Given('the calendar displays a due-date item named {string}', async (cardName) => {
  await expect(calendarPage.itemByName(cardName).first()).toBeVisible();
});

// 일정 생성 스텝 — 생성 시나리오(When)와 수정/삭제 시나리오의 사전 준비(Given/And) 양쪽에서
// 동일 패턴으로 사용된다. Cucumber 는 키워드와 무관하게 스텝 패턴을 공유하므로 한 번만 등록한다.
Given('the user creates an all-day event named {string} on day {int}', async (name, day) => {
  await calendarPage.createAllDayEventOnDay(day, name);
});

// ---------- WHEN ----------

When('the user activates the calendar button', async () => {
  await calendarPage.switchToCalendarView();
});

When('the user renames the event {string} to {string}', async (currentName, newName) => {
  await calendarPage.renameEvent(currentName, newName);
});

When('the user deletes the event {string}', async (name) => {
  await calendarPage.deleteEvent(name);
});

When('the user clicks the due-date item named {string}', async (cardName) => {
  await calendarPage.clickDueDateItem(cardName);
});

// ---------- THEN ----------

Then('the calendar board should be displayed', async () => {
  await expect(page.locator(calendarPage.calendarSettingsButtonSelector)).toBeVisible();
});

Then('the calendar should display an item named {string}', async (name) => {
  await expect(calendarPage.itemByName(name).first()).toBeVisible();
});

Then('the calendar should not display an item named {string}', async (name) => {
  await expect(calendarPage.itemByName(name)).toHaveCount(0);
});

// 마감일 항목 클릭 시 카드 라우트(/cards/:id)로 이동하며 카드 모달이 열린다(R8.3).
Then('the corresponding card should be opened', async () => {
  await expect(page).toHaveURL(/\/cards\//);
});
