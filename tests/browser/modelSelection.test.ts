import { describe, expect, test } from 'vitest';
import {
  buildModelSelectionExpressionForTest,
} from '../../src/browser/actions/modelSelection.js';
import { MODEL_BUTTON_SELECTOR } from '../../src/browser/constants.ts';

type OptionConfig = {
  label: string;
  attributes?: Record<string, string>;
  hasCheckmark?: boolean;
};

class MockHTMLElement {
  textContent: string;
  #attributes: Map<string, string>;

  constructor(text = '', attributes: Record<string, string> = {}) {
    this.textContent = text;
    this.#attributes = new Map(Object.entries(attributes));
  }

  getAttribute(name: string): string | null {
    return this.#attributes.get(name) ?? null;
  }

  setAttribute(name: string, value: string) {
    this.#attributes.set(name, value);
  }

  querySelector(_selector?: string): MockHTMLElement | null {
    return null;
  }

  querySelectorAll(_selector?: string): MockHTMLElement[] {
    return [];
  }

  dispatchEvent() {
    // no-op: we only need this to exist so PointerEvent dispatching does not fail
  }
}

class MockButton extends MockHTMLElement {}

class MockOption extends MockHTMLElement {
  #hasCheckmark: boolean;
  clicks = 0;

  constructor(label: string, attributes: Record<string, string>, hasCheckmark: boolean) {
    super(label, attributes);
    this.#hasCheckmark = hasCheckmark;
  }

  click() {
    this.clicks += 1;
  }

  override querySelector(selector?: string) {
    if (selector && this.#hasCheckmark && selector.includes('check')) {
      return new MockHTMLElement('check');
    }
    return null;
  }
}

class MockMenu extends MockHTMLElement {
  readonly options: MockOption[];

  constructor(options: MockOption[]) {
    super('menu');
    this.options = options;
  }

  override querySelectorAll(_selector?: string) {
    return this.options;
  }
}

class MockDocument {
  #button: MockButton;
  #menus: MockMenu[];
  #menuOpen: boolean;

  constructor(button: MockButton, menus: MockMenu[], { menuOpen = true }: { menuOpen?: boolean }) {
    this.#button = button;
    this.#menus = menus;
    this.#menuOpen = menuOpen;
  }

  querySelector(selector: string) {
    if (selector === MODEL_BUTTON_SELECTOR) {
      return this.#button;
    }
    if (selector.includes('[role="menu"') || selector.includes('data-radix-collection-root')) {
      return this.#menuOpen ? this.#menus[0] ?? null : null;
    }
    return null;
  }

  querySelectorAll(selector: string) {
    if (selector.includes('[role="menu"') || selector.includes('data-radix-collection-root')) {
      return this.#menuOpen ? this.#menus : [];
    }
    return [];
  }
}

class MockPointerEvent {
  type: string;
  constructor(type: string, _init?: Record<string, unknown>) {
    this.type = type;
  }
}

class MockMouseEvent extends MockPointerEvent {}

const runExpression = async (targetModel: string, configs: OptionConfig[]) => {
  const button = new MockButton('', { 'data-testid': 'model-launcher' });
  const options = configs.map(
    (config) => new MockOption(config.label, config.attributes ?? {}, Boolean(config.hasCheckmark)),
  );
  const menu = new MockMenu(options);
  const document = new MockDocument(button, [menu], { menuOpen: true });
  let now = 0;
  const performance = {
    now: () => {
      now += 5;
      return now;
    },
  };
  const mockSetTimeout = (fn: () => void) => {
    queueMicrotask(fn);
    return 0;
  };
  const expression = buildModelSelectionExpressionForTest(targetModel);
  const runner = new Function(
    'document',
    'PointerEvent',
    'MouseEvent',
    'performance',
    'setTimeout',
    'HTMLElement',
    `return ${expression};`,
  );
  const resultPromise = runner(
    document,
    MockPointerEvent,
    MockMouseEvent,
    performance,
    mockSetTimeout,
    MockHTMLElement,
  ) as Promise<{ status: string; label?: string | null }>;
  const result = await resultPromise;
  return { result, options };
};

describe('model selection expression', () => {
  test('clicks the option with the strongest test id match', async () => {
    const { result, options } = await runExpression('ChatGPT 5.1', [
      { label: 'Enterprise default', attributes: { 'data-testid': 'model-switcher-chatgpt-5.1' } },
      { label: 'GPT o3-mini', attributes: { 'data-testid': 'model-switcher-o3-mini' } },
    ]);
    expect(result.status).toBe('switched');
    expect(result.label).toContain('Enterprise default');
    expect(options[0].clicks).toBe(1);
    expect(options[1].clicks).toBe(0);
  });

  test('prefers the closest label match when no test ids hit', async () => {
    const { result, options } = await runExpression('ChatGPT 5.1', [
      { label: 'ChatGPT 5 turbo' },
      { label: 'ChatGPT 5.1 reasoning preview' },
      { label: 'ChatGPT 4o' },
    ]);
    expect(result.status).toBe('switched');
    expect(result.label).toBe('ChatGPT 5.1 reasoning preview');
    expect(options[1].clicks).toBe(1);
  });

  test('reports already-selected when the best option is active', async () => {
    const { result, options } = await runExpression('ChatGPT 5.1', [
      {
        label: 'ChatGPT 5.1',
        attributes: { 'aria-selected': 'true', 'data-testid': 'model-switcher-chatgpt-5-1' },
        hasCheckmark: true,
      },
    ]);
    expect(result.status).toBe('already-selected');
    expect(options[0].clicks).toBe(0);
  });
});
