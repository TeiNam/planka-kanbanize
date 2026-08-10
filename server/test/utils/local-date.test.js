const { expect } = require('chai');

const {
  formatLocalDate,
  parseLocalDate,
  startOfLocalDay,
  addLocalDays,
  endOfLocalDayMs,
  diffLocalCalendarDays,
} = require('../../utils/local-date');

describe('local-date', () => {
  describe('#formatLocalDate() / #parseLocalDate()', () => {
    it('should round-trip a local date string', () => {
      expect(formatLocalDate(parseLocalDate('2026-08-09'))).to.equal('2026-08-09');
      expect(formatLocalDate(parseLocalDate('2026-01-01'))).to.equal('2026-01-01');
    });

    it('should parse the date part of an ISO datetime string', () => {
      expect(formatLocalDate(parseLocalDate('2026-08-09T15:30:00.000Z'))).to.equal('2026-08-09');
    });

    it('should format using the local calendar day, not UTC', () => {
      // 로컬 23:59 는 로컬 날짜 그대로여야 한다 (UTC 변환 시 날짜가 밀리는 타임존 대비)
      const lateEvening = new Date(2026, 7, 9, 23, 59, 0);
      expect(formatLocalDate(lateEvening)).to.equal('2026-08-09');

      const earlyMorning = new Date(2026, 7, 9, 0, 0, 1);
      expect(formatLocalDate(earlyMorning)).to.equal('2026-08-09');
    });
  });

  describe('#addLocalDays() / #startOfLocalDay()', () => {
    it('should add calendar days across month boundaries', () => {
      expect(formatLocalDate(addLocalDays(parseLocalDate('2026-08-31'), 1))).to.equal('2026-09-01');
      expect(formatLocalDate(addLocalDays(parseLocalDate('2026-01-01'), -1))).to.equal(
        '2025-12-31',
      );
    });

    it('should truncate to local midnight', () => {
      const noon = new Date(2026, 7, 9, 12, 34, 56);
      const start = startOfLocalDay(noon);
      expect(start.getHours()).to.equal(0);
      expect(formatLocalDate(start)).to.equal('2026-08-09');
    });
  });

  describe('#endOfLocalDayMs()', () => {
    it('should be the last millisecond of the local day', () => {
      const endMs = endOfLocalDayMs('2026-08-09');
      expect(formatLocalDate(new Date(endMs))).to.equal('2026-08-09');
      expect(formatLocalDate(new Date(endMs + 1))).to.equal('2026-08-10');
    });
  });

  describe('#diffLocalCalendarDays()', () => {
    it('should return 0 for the same local day', () => {
      const morning = new Date(2026, 7, 9, 1, 0, 0);
      const night = new Date(2026, 7, 9, 23, 0, 0);
      expect(diffLocalCalendarDays(morning, night)).to.equal(0);
    });

    it('should return 1 when crossing local midnight regardless of elapsed hours', () => {
      const lateNight = new Date(2026, 7, 9, 23, 30, 0);
      const nextMorning = new Date(2026, 7, 10, 0, 30, 0); // 경과 1시간, 달력일 1일 차
      expect(diffLocalCalendarDays(lateNight, nextMorning)).to.equal(1);
    });

    it('should count full calendar days for multi-day spans', () => {
      expect(
        diffLocalCalendarDays(parseLocalDate('2026-08-01'), parseLocalDate('2026-08-09')),
      ).to.equal(8);
    });
  });
});
