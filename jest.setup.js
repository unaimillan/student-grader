require('@testing-library/jest-dom/extend-expect');
require('jest-canvas-mock');

const { getComputedStyle } = window;
window.getComputedStyle = (elt) => getComputedStyle(elt);

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

class ResizeObserver {
  constructor(callback) {
    this.callback = callback;
  }

  observe(target) {
    if (typeof this.callback === 'function') {
      this.callback(
        [
          {
            target,
            contentRect: {
              width: 800,
              height: 400,
              top: 0,
              left: 0,
              bottom: 400,
              right: 800,
              x: 0,
              y: 0,
            },
          },
        ],
        this
      );
    }
  }

  unobserve() {}

  disconnect() {}
}

window.ResizeObserver = ResizeObserver;

if (!HTMLElement.prototype.scrollTo) {
  HTMLElement.prototype.scrollTo = jest.fn();
}

const defaultRect = {
  width: 800,
  height: 400,
  top: 0,
  left: 0,
  bottom: 400,
  right: 800,
  x: 0,
  y: 0,
  toJSON: () => ({}),
};

Element.prototype.getBoundingClientRect = jest.fn(() => defaultRect);

Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
  configurable: true,
  value: 800,
});
Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
  configurable: true,
  value: 400,
});
Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
  configurable: true,
  value: 800,
});
Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
  configurable: true,
  value: 400,
});

if (!document.getElementById('portal')) {
  const portal = document.createElement('div');
  portal.id = 'portal';
  document.body.appendChild(portal);
}
