Feature: Calendar Board
  보드 사용자가 캘린더 버튼으로 캘린더 뷰에 진입하고, 일정을 생성/수정/삭제하면
  월 그리드에 즉시 반영되며, 마감일 카드는 캘린더에 표시되고 클릭 시 해당 카드가 열린다.
  (R1.2, R3.8, R4.6, R5.4, R8.3)

  Background:
    Given the user is logged in with email or username "demo" and password "demo"
    And the user opens a board

  Scenario: User switches the board content to the calendar view
    When the user activates the calendar button
    Then the calendar board should be displayed

  Scenario: Creating an event shows it on the matching date cell
    Given the user is viewing the calendar board
    When the user creates an all-day event named "E2E Created Event" on day 15
    Then the calendar should display an item named "E2E Created Event"

  Scenario: Editing an event reflects the updated values on the grid
    Given the user is viewing the calendar board
    And the user creates an all-day event named "E2E Event To Edit" on day 16
    When the user renames the event "E2E Event To Edit" to "E2E Event Edited"
    Then the calendar should display an item named "E2E Event Edited"
    And the calendar should not display an item named "E2E Event To Edit"

  Scenario: Deleting an event removes it from the grid
    Given the user is viewing the calendar board
    And the user creates an all-day event named "E2E Event To Delete" on day 17
    When the user deletes the event "E2E Event To Delete"
    Then the calendar should not display an item named "E2E Event To Delete"

  Scenario Outline: Clicking a due-date item opens the corresponding card
    Given the user is viewing the calendar board
    And the calendar displays a due-date item named "<cardName>"
    When the user clicks the due-date item named "<cardName>"
    Then the corresponding card should be opened

    Examples:
      | cardName     |
      | E2E Due Card |
