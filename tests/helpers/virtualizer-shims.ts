/**
 * happy-dom shims that let @tanstack/react-virtual compute a sensible visible
 * range during tests. The library reads element dimensions via ResizeObserver
 * + getBoundingClientRect + offsetHeight; happy-dom reports zero for all of
 * them, which makes the virtualizer report a zero-height viewport and render
 * nothing.
 *
 * Call `installVirtualizerShims()` in `beforeEach` and
 * `restoreVirtualizerShims()` in `afterEach` for any test that mounts a
 * component backed by `useVirtualizer` (currently ArticleList).
 *
 * The shims distinguish the scroll container (className contains
 * "overflow-y-auto") from child rows so the two get different reported
 * heights — without that split, every row would report the full viewport
 * height and the virtualizer would render the wrong number of rows.
 */

let originalResizeObserver: typeof ResizeObserver | undefined;
let originalClientHeight: PropertyDescriptor | undefined;
let originalClientWidth: PropertyDescriptor | undefined;
let originalOffsetHeight: PropertyDescriptor | undefined;
let originalOffsetWidth: PropertyDescriptor | undefined;
let originalBoundingClientRect: typeof HTMLElement.prototype.getBoundingClientRect;

const VIEWPORT_HEIGHT = 600;
const VIEWPORT_WIDTH = 400;
const ROW_HEIGHT = 72;

function isScrollContainer(el: HTMLElement): boolean {
  return (
    typeof el.className === "string" &&
    el.className.includes("overflow-y-auto")
  );
}

export function installVirtualizerShims() {
  originalResizeObserver = globalThis.ResizeObserver;
  originalClientHeight = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    "clientHeight",
  );
  originalClientWidth = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    "clientWidth",
  );
  originalOffsetHeight = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    "offsetHeight",
  );
  originalOffsetWidth = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    "offsetWidth",
  );
  originalBoundingClientRect = HTMLElement.prototype.getBoundingClientRect;

  globalThis.ResizeObserver = class {
    private callback: ResizeObserverCallback;
    constructor(callback: ResizeObserverCallback) {
      this.callback = callback;
    }
    observe(target: Element) {
      const rect = target.getBoundingClientRect();
      this.callback(
        [
          {
            target,
            contentRect: rect,
            borderBoxSize: [
              { blockSize: rect.height, inlineSize: rect.width },
            ],
            contentBoxSize: [
              { blockSize: rect.height, inlineSize: rect.width },
            ],
            devicePixelContentBoxSize: [
              { blockSize: rect.height, inlineSize: rect.width },
            ],
          } as ResizeObserverEntry,
        ],
        this as unknown as ResizeObserver,
      );
    }
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;

  Object.defineProperty(HTMLElement.prototype, "clientHeight", {
    configurable: true,
    get() {
      return VIEWPORT_HEIGHT;
    },
  });
  Object.defineProperty(HTMLElement.prototype, "clientWidth", {
    configurable: true,
    get() {
      return VIEWPORT_WIDTH;
    },
  });
  Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
    configurable: true,
    get(): number {
      return isScrollContainer(this as HTMLElement)
        ? VIEWPORT_HEIGHT
        : ROW_HEIGHT;
    },
  });
  Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
    configurable: true,
    get() {
      return VIEWPORT_WIDTH;
    },
  });

  HTMLElement.prototype.getBoundingClientRect = function () {
    const height = isScrollContainer(this) ? VIEWPORT_HEIGHT : ROW_HEIGHT;
    return {
      width: VIEWPORT_WIDTH,
      height,
      top: 0,
      left: 0,
      right: VIEWPORT_WIDTH,
      bottom: height,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect;
  };
}

export function restoreVirtualizerShims() {
  if (originalResizeObserver) {
    globalThis.ResizeObserver = originalResizeObserver;
  }
  restoreDescriptor("clientHeight", originalClientHeight);
  restoreDescriptor("clientWidth", originalClientWidth);
  restoreDescriptor("offsetHeight", originalOffsetHeight);
  restoreDescriptor("offsetWidth", originalOffsetWidth);
  HTMLElement.prototype.getBoundingClientRect = originalBoundingClientRect;
}

function restoreDescriptor(
  key: "clientHeight" | "clientWidth" | "offsetHeight" | "offsetWidth",
  descriptor: PropertyDescriptor | undefined,
) {
  if (descriptor) {
    Object.defineProperty(HTMLElement.prototype, key, descriptor);
  } else {
    delete (HTMLElement.prototype as unknown as Record<string, unknown>)[key];
  }
}
