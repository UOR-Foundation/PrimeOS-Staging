export * from './os-model-mock';
export * from './os-logging-mock';
export * from './test-mock';
export { createMockModular as default } from './test-mock';
export function runModularMockTests() { require('./mock.test'); }
