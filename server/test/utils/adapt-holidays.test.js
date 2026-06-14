const { expect } = require('chai');

const adaptHolidays = require('../../utils/adapt-holidays');

describe('adapt-holidays', () => {
  describe('#adaptHolidays(payload)', () => {
    it('should normalize a plain array of holidays', () => {
      const payload = [
        { date: '2026-01-01', name: 'New Year' },
        { date: '2026-03-01', name: 'Independence Movement Day' },
      ];

      expect(adaptHolidays(payload)).to.deep.equal([
        { date: '2026-01-01', name: 'New Year' },
        { date: '2026-03-01', name: 'Independence Movement Day' },
      ]);
    });

    it('should normalize a payload wrapped in { items: [...] }', () => {
      const payload = {
        items: [{ date: '2026-05-05', name: "Children's Day" }],
      };

      expect(adaptHolidays(payload)).to.deep.equal([
        { date: '2026-05-05', name: "Children's Day" },
      ]);
    });

    it('should normalize a payload wrapped in { holidays: [...] }', () => {
      const payload = {
        holidays: [{ date: '2026-06-06', name: 'Memorial Day' }],
      };

      expect(adaptHolidays(payload)).to.deep.equal([{ date: '2026-06-06', name: 'Memorial Day' }]);
    });

    it('should support alternate key names (localDate / localName)', () => {
      const payload = [{ localDate: '2026-12-25', localName: 'Christmas' }];

      expect(adaptHolidays(payload)).to.deep.equal([{ date: '2026-12-25', name: 'Christmas' }]);
    });

    it('should support the "title" key for the name', () => {
      const payload = [{ date: '2026-08-15', title: 'Liberation Day' }];

      expect(adaptHolidays(payload)).to.deep.equal([
        { date: '2026-08-15', name: 'Liberation Day' },
      ]);
    });

    it('should extract the date component from an ISO timestamp', () => {
      const payload = [{ date: '2026-01-01T00:00:00.000Z', name: 'New Year' }];

      expect(adaptHolidays(payload)).to.deep.equal([{ date: '2026-01-01', name: 'New Year' }]);
    });

    it('should trim whitespace around the holiday name', () => {
      const payload = [{ date: '2026-01-01', name: '  New Year  ' }];

      expect(adaptHolidays(payload)).to.deep.equal([{ date: '2026-01-01', name: 'New Year' }]);
    });

    it('should drop items missing a date or a name', () => {
      const payload = [
        { date: '2026-01-01', name: 'Valid' },
        { name: 'No Date' },
        { date: '2026-02-02' },
        { date: 'not-a-date', name: 'Bad Date' },
      ];

      expect(adaptHolidays(payload)).to.deep.equal([{ date: '2026-01-01', name: 'Valid' }]);
    });

    it('should return an empty array for an empty array', () => {
      expect(adaptHolidays([])).to.deep.equal([]);
    });

    it('should return an empty array for an unrecognized object shape', () => {
      expect(adaptHolidays({ data: { foo: 'bar' } })).to.deep.equal([]);
    });

    it('should return an empty array for null', () => {
      expect(adaptHolidays(null)).to.deep.equal([]);
    });

    it('should return an empty array for undefined', () => {
      expect(adaptHolidays(undefined)).to.deep.equal([]);
    });

    it('should return an empty array for a primitive payload', () => {
      expect(adaptHolidays('unexpected')).to.deep.equal([]);
      expect(adaptHolidays(42)).to.deep.equal([]);
    });

    it('should skip non-object entries within an array', () => {
      const payload = [null, 'x', 5, { date: '2026-01-01', name: 'Valid' }];

      expect(adaptHolidays(payload)).to.deep.equal([{ date: '2026-01-01', name: 'Valid' }]);
    });
  });
});
