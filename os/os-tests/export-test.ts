/**
 * Export Test
 * ==========
 * 
 * This file tests that the mock export/import structure works correctly.
 */

import * as assert from 'assert';

// Test importing directly from mocks directory
import { BaseModel as MocksDirBaseModel } from './mocks/model-mock';
import { createLogging as MocksDirCreateLogging } from './mocks/logging-mock';

// Test importing from os-tests exports
import { BaseModel as OsTestsBaseModel, createLogging as OsTestsCreateLogging } from './index';

// Test importing from model module exports
import { BaseModel as ModelModuleBaseModel } from '../model/__mocks__';

// Test importing from logging module exports
import { createLogging as LoggingModuleCreateLogging } from '../logging/__mocks__';

// Run simple verification
async function verifyExports() {
  console.log('Verifying mock exports...');

  // Verify model mocks
  const model1 = new MocksDirBaseModel({ name: 'test-from-mocks-dir' });
  const model2 = new OsTestsBaseModel({ name: 'test-from-os-tests' });
  const model3 = new ModelModuleBaseModel({ name: 'test-from-model-module' });

  await model1.initialize();
  await model2.initialize();
  await model3.initialize();

  assert.strictEqual(model1.getState().lifecycle, model2.getState().lifecycle);
  assert.strictEqual(model2.getState().lifecycle, model3.getState().lifecycle);

  // Verify logging mocks
  const logging1 = MocksDirCreateLogging({ name: 'test-from-mocks-dir' });
  const logging2 = OsTestsCreateLogging({ name: 'test-from-os-tests' });
  const logging3 = LoggingModuleCreateLogging({ name: 'test-from-logging-module' });

  await logging1.info('Test message');
  await logging2.info('Test message');
  await logging3.info('Test message');

  console.log('✅ All exports verified successfully!');
  console.log('The mock export structure is working correctly.');
}

// Run verification
verifyExports().catch(error => {
  console.error('❌ Export verification failed:', error);
  process.exit(1);
});
