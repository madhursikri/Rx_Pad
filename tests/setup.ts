import "@testing-library/jest-dom/vitest";
import { beforeAll, beforeEach, vi } from "vitest";

beforeEach(() => {
  vi.restoreAllMocks();
});

beforeAll(() => {
  Object.defineProperty(window, "scrollTo", {
    value: vi.fn(),
    writable: true
  });
  Object.defineProperty(window.HTMLElement.prototype, "scrollIntoView", {
    value: vi.fn(),
    writable: true
  });
  window.confirm = vi.fn(() => true);
});
