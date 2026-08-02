import "@testing-library/jest-dom";

/*
  jsdom에 없는 브라우저 기능을 채운다.

  ⚠️ **제품 코드를 테스트에 맞춰 고치지 않는다.** 없는 건 여기서 메운다 —
     화면이 실제 브라우저에서 하는 일을 테스트 때문에 빼면 그건 다른 화면이다.
  ⚠️ `scrollTo`는 jsdom이 구현하지 않는다(목록에 항목이 붙을 때 아래로 따라가는 데 쓴다).
*/
if (!Element.prototype.scrollTo) {
  Element.prototype.scrollTo = () => {};
}
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}
