import '@testing-library/jest-dom';
global.ResizeObserver = require('resize-observer-polyfill');

if (typeof Element !== 'undefined' && !Element.prototype.scrollTo) {
  Element.prototype.scrollTo = function (options) {
    if (typeof options === 'object') {
      const { top = 0, left = 0 } = options;
      this.scrollTop = top;
      this.scrollLeft = left;
    } else {
      // Support calling scrollTo(x, y) if needed
      this.scrollLeft = arguments[0];
      this.scrollTop = arguments[1];
    }
  };
}
