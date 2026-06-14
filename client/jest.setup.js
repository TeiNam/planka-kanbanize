/*!
 * Jest 전역 셋업
 *
 * jsdom 환경에는 TextEncoder/TextDecoder 가 기본 제공되지 않는다.
 * react-router(v7)는 모듈 로드 시점에 이를 참조하므로, 실제 셀렉터/라우터를
 * import 하는 테스트가 깨지지 않도록 모듈 로드 이전(setupFiles)에 폴리필한다.
 */

const { TextEncoder, TextDecoder } = require('util');

if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}

if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder;
}
