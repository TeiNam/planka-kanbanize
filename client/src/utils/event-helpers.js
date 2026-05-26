/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import Config from '../constants/Config';

export const isModifierKeyPressed = (event) => (Config.IS_MAC ? event.metaKey : event.ctrlKey);

// IME(한글/일본어/중국어 등) 조합 중 여부 검사.
// 조합 도중 Enter 키로 submit 처리되면 마지막 글자가 확정되며 다음 입력으로 흘러가는 버그가 발생한다.
// keyCode 229는 일부 브라우저에서 isComposing이 false로 들어오는 경우 대비.
export const isComposing = (event) =>
  event.nativeEvent?.isComposing || event.isComposing || event.keyCode === 229;
