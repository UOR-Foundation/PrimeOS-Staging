import { createMockModular } from './test-mock';
import { ModelLifecycleState } from './os-model-mock';

describe('Modular Mocks', () => {
  it('creates a mock modular instance', async () => {
    const mock = createMockModular();
    expect(mock).toBeDefined();
    expect(typeof mock.mod).toBe('function');
    const state = mock.getState();
    expect(state.lifecycle).toBe(ModelLifecycleState.Ready);
  });
});
