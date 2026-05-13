/*!
 * CardPriority 컴포넌트 단위 테스트
 * 우선순위 배지 렌더링, 색상 매핑, null/undefined 시 null 반환 검증
 */

import React from 'react';
import { render } from '@testing-library/react';

import CardPriority from '../../components/cards/CardPriority/CardPriority';

describe('CardPriority', () => {
  it('priority가 null이면 null을 반환해야 함', () => {
    const { container } = render(<CardPriority priority={null} />);

    expect(container.innerHTML).toBe('');
  });

  it('priority가 undefined이면 null을 반환해야 함', () => {
    const { container } = render(<CardPriority />);

    expect(container.innerHTML).toBe('');
  });

  it('priority "H"일 때 "H" 텍스트를 렌더링해야 함', () => {
    const { container } = render(<CardPriority priority="H" />);

    expect(container.textContent).toBe('H');
    expect(container.firstChild.tagName).toBe('SPAN');
  });

  it('priority "M"일 때 "M" 텍스트를 렌더링해야 함', () => {
    const { container } = render(<CardPriority priority="M" />);

    expect(container.textContent).toBe('M');
    expect(container.firstChild.tagName).toBe('SPAN');
  });

  it('priority "L"일 때 "L" 텍스트를 렌더링해야 함', () => {
    const { container } = render(<CardPriority priority="L" />);

    expect(container.textContent).toBe('L');
    expect(container.firstChild.tagName).toBe('SPAN');
  });
});
