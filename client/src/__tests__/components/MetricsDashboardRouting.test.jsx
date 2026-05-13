/*!
 * 메트릭 대시보드 라우팅 단위 테스트
 * BoardViews.METRICS 뷰 전환, 라우트 경로 정의, 아이콘 매핑 검증
 */

import { BoardViews } from '../../constants/Enums';
import { BoardViewIcons } from '../../constants/Icons';
import Paths from '../../constants/Paths';

describe('메트릭 대시보드 라우팅', () => {
  describe('BoardViews enum', () => {
    it('METRICS 뷰가 정의되어 있어야 함', () => {
      expect(BoardViews.METRICS).toBe('metrics');
    });

    it('기존 뷰(KANBAN, GRID, LIST)가 유지되어야 함', () => {
      expect(BoardViews.KANBAN).toBe('kanban');
      expect(BoardViews.GRID).toBe('grid');
      expect(BoardViews.LIST).toBe('list');
    });
  });

  describe('BoardViewIcons', () => {
    it('METRICS 뷰에 chart bar 아이콘이 매핑되어야 함', () => {
      expect(BoardViewIcons[BoardViews.METRICS]).toBe('chart bar');
    });

    it('기존 뷰 아이콘이 유지되어야 함', () => {
      expect(BoardViewIcons[BoardViews.KANBAN]).toBe('columns');
      expect(BoardViewIcons[BoardViews.GRID]).toBe('th');
      expect(BoardViewIcons[BoardViews.LIST]).toBe('unordered list');
    });
  });

  describe('Paths', () => {
    it('BOARDS_METRICS 경로가 정의되어 있어야 함', () => {
      expect(Paths.BOARDS_METRICS).toBeDefined();
      expect(Paths.BOARDS_METRICS).toContain('/boards/:id/metrics');
    });

    it('기존 경로가 유지되어야 함', () => {
      expect(Paths.BOARDS).toContain('/boards/:id');
      expect(Paths.CARDS).toContain('/cards/:id');
      expect(Paths.PROJECTS).toContain('/projects/:id');
    });

    it('BOARDS_METRICS 경로가 BOARDS 경로의 하위 경로여야 함', () => {
      const boardsBase = Paths.BOARDS.replace(':id', '123');
      const metricsPath = Paths.BOARDS_METRICS.replace(':id', '123');
      expect(metricsPath.startsWith(boardsBase)).toBe(true);
    });
  });
});
