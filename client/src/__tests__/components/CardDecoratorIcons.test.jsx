/*!
 * CardDecoratorIcons 컴포넌트 단위 테스트
 * 데코레이터 아이콘 렌더링, 최대 5개 제한, 빈 배열/null 시 null 반환 검증
 */

import React from 'react';
import { render } from '@testing-library/react';

import CardDecoratorIcons from '../../components/cards/CardDecoratorIcons/CardDecoratorIcons';

describe('CardDecoratorIcons', () => {
  it('decorators가 undefined이면 null을 반환해야 함', () => {
    const { container } = render(<CardDecoratorIcons />);

    expect(container.innerHTML).toBe('');
  });

  it('decorators가 null이면 null을 반환해야 함', () => {
    const { container } = render(<CardDecoratorIcons decorators={null} />);

    expect(container.innerHTML).toBe('');
  });

  it('decorators가 빈 배열이면 null을 반환해야 함', () => {
    const { container } = render(<CardDecoratorIcons decorators={[]} />);

    expect(container.innerHTML).toBe('');
  });

  it('데코레이터 아이콘을 렌더링해야 함', () => {
    const decorators = [
      { id: '1', name: 'Bug', icon: '🐛', color: '#db2828' },
      { id: '2', name: 'Feature', icon: '⭐', color: '#21ba45' },
    ];

    const { container } = render(<CardDecoratorIcons decorators={decorators} />);

    expect(container.textContent).toContain('🐛');
    expect(container.textContent).toContain('⭐');
  });

  it('최대 5개까지만 표시해야 함', () => {
    const decorators = [
      { id: '1', name: 'D1', icon: '1️⃣', color: null },
      { id: '2', name: 'D2', icon: '2️⃣', color: null },
      { id: '3', name: 'D3', icon: '3️⃣', color: null },
      { id: '4', name: 'D4', icon: '4️⃣', color: null },
      { id: '5', name: 'D5', icon: '5️⃣', color: null },
      { id: '6', name: 'D6', icon: '6️⃣', color: null },
      { id: '7', name: 'D7', icon: '7️⃣', color: null },
    ];

    const { container } = render(<CardDecoratorIcons decorators={decorators} />);

    const wrapper = container.firstChild;
    // 5개 아이콘 + 1개 오버플로우 표시기
    expect(wrapper.children.length).toBe(6);
    expect(container.textContent).not.toContain('6️⃣');
    expect(container.textContent).not.toContain('7️⃣');
    expect(container.textContent).toContain('+2');
  });

  it('정확히 5개일 때 오버플로우 표시기가 없어야 함', () => {
    const decorators = [
      { id: '1', name: 'D1', icon: '1️⃣', color: null },
      { id: '2', name: 'D2', icon: '2️⃣', color: null },
      { id: '3', name: 'D3', icon: '3️⃣', color: null },
      { id: '4', name: 'D4', icon: '4️⃣', color: null },
      { id: '5', name: 'D5', icon: '5️⃣', color: null },
    ];

    const { container } = render(<CardDecoratorIcons decorators={decorators} />);

    const wrapper = container.firstChild;
    expect(wrapper.children.length).toBe(5);
    expect(container.textContent).not.toContain('+');
  });

  it('데코레이터에 color가 있으면 인라인 스타일로 적용해야 함', () => {
    const decorators = [{ id: '1', name: 'Bug', icon: '🐛', color: '#db2828' }];

    const { container } = render(<CardDecoratorIcons decorators={decorators} />);

    const icon = container.firstChild.firstChild;
    expect(icon.style.color).toBe('rgb(219, 40, 40)');
  });

  it('데코레이터에 color가 없으면 인라인 스타일이 없어야 함', () => {
    const decorators = [{ id: '1', name: 'Feature', icon: '⭐', color: null }];

    const { container } = render(<CardDecoratorIcons decorators={decorators} />);

    const icon = container.firstChild.firstChild;
    expect(icon.style.color).toBe('');
  });

  it('데코레이터 name이 title 속성으로 설정되어야 함', () => {
    const decorators = [{ id: '1', name: 'Bug Fix', icon: '🐛', color: null }];

    const { container } = render(<CardDecoratorIcons decorators={decorators} />);

    const icon = container.firstChild.firstChild;
    expect(icon.getAttribute('title')).toBe('Bug Fix');
  });
});
