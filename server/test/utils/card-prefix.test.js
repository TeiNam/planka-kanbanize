const { expect } = require('chai');

const {
  buildPrefixedName,
  stripPrefixedName,
  formatPrefixNumber,
} = require('../../utils/card-prefix');

describe('card-prefix', () => {
  describe('#formatPrefixNumber()', () => {
    it('should zero-pad numbers below 10', () => {
      expect(formatPrefixNumber(1)).to.equal('01');
      expect(formatPrefixNumber(9)).to.equal('09');
      expect(formatPrefixNumber(10)).to.equal('10');
      expect(formatPrefixNumber(123)).to.equal('123');
    });
  });

  describe('#buildPrefixedName() / #stripPrefixedName()', () => {
    it('should round-trip: strip returns the original name', () => {
      expect(stripPrefixedName(buildPrefixedName('DB', 1, '카드 제목'))).to.equal('카드 제목');
      expect(stripPrefixedName(buildPrefixedName('개발', 42, 'Fix bug'))).to.equal('Fix bug');
    });

    it('should prevent double prefixing on re-import (strip then re-prefix)', () => {
      const exported = buildPrefixedName('DB', 1, '제목'); // "[DB-01] 제목"
      const reimported = buildPrefixedName('DB', 2, stripPrefixedName(exported));
      expect(reimported).to.equal('[DB-02] 제목');
    });

    it('should strip only one leading prefix at a time', () => {
      const doubled = '[DB-02] [DB-01] 제목';
      expect(stripPrefixedName(doubled)).to.equal('[DB-01] 제목');
    });

    it('should leave names without a valid prefix pattern untouched', () => {
      expect(stripPrefixedName('일반 제목')).to.equal('일반 제목');
      expect(stripPrefixedName('[메모] 제목')).to.equal('[메모] 제목'); // 순번 없음
      expect(stripPrefixedName('[TOOLONG-01] 제목')).to.equal('[TOOLONG-01] 제목'); // 폭 4 초과
      expect(stripPrefixedName('[DB-1] 제목')).to.equal('[DB-1] 제목'); // 순번 2자리 미만
      expect(stripPrefixedName('[DB-01]제목')).to.equal('[DB-01]제목'); // 공백 없음
    });

    it('should handle non-string input safely', () => {
      expect(stripPrefixedName(null)).to.equal(null);
      expect(stripPrefixedName(undefined)).to.equal(undefined);
    });
  });
});
