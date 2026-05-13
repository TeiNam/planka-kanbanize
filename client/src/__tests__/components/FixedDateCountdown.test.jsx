/*!
 * FixedDateCountdown 컴포넌트 단위 테스트
 * Fixed_Date CoS 카드의 남은 일수 카운트다운 표시 검증
 * Requirements: 5.1~5.8
 */

import React from 'react';
import { render } from '@testing-library/react';

import FixedDateCountdown from '../../components/classes-of-service/FixedDateCountdown';

describe('FixedDateCountdown', () => {
  it('미래 날짜일 때 "D-N" 형식으로 표시해야 함', () => {
    // 현재로부터 10일 후
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);
    const dueDateStr = futureDate.toISOString();

    const { container } = render(<FixedDateCountdown dueDate={dueDateStr} />);

    expect(container.textContent).toMatch(/^D-\d+$/);
    expect(container.textContent).toContain('D-');
  });

  it('초과된 날짜일 때 "D+N" 형식으로 표시해야 함', () => {
    // 현재로부터 5일 전
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);
    const dueDateStr = pastDate.toISOString();

    const { container } = render(<FixedDateCountdown dueDate={dueDateStr} />);

    expect(container.textContent).toMatch(/^D\+\d+$/);
    expect(container.textContent).toContain('D+');
  });

  it('dueDate가 null이면 null을 반환해야 함', () => {
    const { container } = render(<FixedDateCountdown dueDate={null} />);

    expect(container.innerHTML).toBe('');
  });
});
