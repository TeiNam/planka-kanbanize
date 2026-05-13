/*!
 * PullSlot 컴포넌트 단위 테스트
 * 빈 슬롯 플레이스홀더 렌더링, count=0 시 null 반환, "+N" 인디케이터 검증
 */

import React from 'react';
import { render } from '@testing-library/react';

import PullSlot from '../../components/lists/PullSlot/PullSlot';

describe('PullSlot', () => {
  it('count만큼 빈 슬롯 플레이스홀더를 렌더링해야 함', () => {
    const { container } = render(<PullSlot count={3} />);

    // PullSlot은 wrapper > slot > slotInner 구조
    const wrapper = container.firstChild;
    expect(wrapper.children.length).toBe(3);
  });

  it('count가 0이면 null을 반환해야 함', () => {
    const { container } = render(<PullSlot count={0} />);

    expect(container.innerHTML).toBe('');
  });

  it('count가 음수이면 null을 반환해야 함', () => {
    const { container } = render(<PullSlot count={-1} />);

    expect(container.innerHTML).toBe('');
  });

  it('count가 5 이하이면 모든 슬롯을 표시하고 "+N" 인디케이터가 없어야 함', () => {
    const { container } = render(<PullSlot count={5} />);

    const wrapper = container.firstChild;
    expect(wrapper.children.length).toBe(5);
    expect(container.textContent).not.toContain('+');
  });

  it('count가 5 초과이면 최대 5개 슬롯과 "+N" 인디케이터를 표시해야 함', () => {
    const { container } = render(<PullSlot count={8} />);

    const wrapper = container.firstChild;
    // 5개 슬롯 + 1개 moreIndicator = 6개 자식 요소
    expect(wrapper.children.length).toBe(6);
    expect(container.textContent).toContain('+3');
  });

  it('count가 10이면 "+5" 인디케이터를 표시해야 함', () => {
    const { container } = render(<PullSlot count={10} />);

    expect(container.textContent).toContain('+5');
  });

  it('count가 1이면 슬롯 1개만 렌더링해야 함', () => {
    const { container } = render(<PullSlot count={1} />);

    const wrapper = container.firstChild;
    expect(wrapper.children.length).toBe(1);
  });
});
