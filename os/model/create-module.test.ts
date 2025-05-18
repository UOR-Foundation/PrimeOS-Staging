/**
 * Module Creation Tests
 * ====================
 * 
 * Unit tests for the module creation functionality.
 */

import * as fs from 'fs';
import * as path from 'path';
import { createModule, CreateModuleOptions } from './create-module';

// Mock file system operations
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
  readFileSync: jest.fn()
}));

// Mock child_process
jest.mock('child_process', () => ({
  exec: jest.fn((command, options, callback) => {
    if (callback) {
      callback(null, 'mocked stdout', 'mocked stderr');
    }
  })
}));

describe('Module Creation', () => {
  // Store original process.cwd
  const originalCwd = process.cwd;
  
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Mock process.cwd
    process.cwd = jest.fn().mockReturnValue('/fake/cwd');
    
    // Default mock for fs.existsSync
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    
    // Default mock for fs.readFileSync
    (fs.readFileSync as jest.Mock).mockReturnValue('{{module-name}}');
  });
  
  afterEach(() => {
    // Restore original process.cwd
    process.cwd = originalCwd;
  });
  
  test('should create module with minimum options', async () => {
    // Setup
    const options: CreateModuleOptions = {
      name: 'test-module'
    };
    
    // Execute
    const result = await createModule(options);
    
    // Verify
    expect(result.success).toBe(true);
    expect(fs.mkdirSync).toHaveBeenCalledWith(
      path.join('/fake/cwd', 'test-module'),
      { recursive: true }
    );
    
    // Should create 5 files
    expect(fs.writeFileSync).toHaveBeenCalledTimes(5);
    
    // Verify files contain the right content - using more flexible checks
    const writeFileCalls = (fs.writeFileSync as jest.Mock).mock.calls;
    
    // Check for README.md
    expect(writeFileCalls.some(call => 
      call[0].includes('README.md') && 
      typeof call[1] === 'string' && 
      call[1].includes('test-module')
    )).toBe(true);
    
    // Check for package.json
    expect(writeFileCalls.some(call => 
      call[0].includes('package.json') && 
      typeof call[1] === 'string' && 
      call[1].includes('test-module')
    )).toBe(true);
    
    // Check for types.ts
    expect(writeFileCalls.some(call => 
      call[0].includes('types.ts') && 
      typeof call[1] === 'string' && 
      call[1].includes('TestModule')
    )).toBe(true);
    
    // Check for index.ts
    expect(writeFileCalls.some(call => 
      call[0].includes('index.ts') && 
      typeof call[1] === 'string' && 
      call[1].includes('TestModule')
    )).toBe(true);
    
    // Check for test.ts
    expect(writeFileCalls.some(call => 
      call[0].includes('test.ts') && 
      typeof call[1] === 'string' && 
      call[1].includes('TestModule')
    )).toBe(true);
  });
  
  test('should create module with custom path', async () => {
    // Setup
    const options: CreateModuleOptions = {
      name: 'test-module',
      path: 'custom/path'
    };
    
    // Execute
    const result = await createModule(options);
    
    // Verify
    expect(result.success).toBe(true);
    expect(fs.mkdirSync).toHaveBeenCalledWith(
      path.join('/fake/cwd', 'custom/path', 'test-module'),
      { recursive: true }
    );
    
    // Should create files in custom path
    const writeFileCalls = (fs.writeFileSync as jest.Mock).mock.calls;
    const customPathCallExists = writeFileCalls.some(call => {
      const filePath = call[0];
      return filePath.includes('custom/path') && filePath.includes('test-module');
    });
    
    expect(customPathCallExists).toBe(true);
  });
  
  test('should create module with custom description', async () => {
    // Setup
    const options: CreateModuleOptions = {
      name: 'test-module',
      description: 'Custom module description'
    };
    
    // Execute
    const result = await createModule(options);
    
    // Verify
    expect(result.success).toBe(true);
    
    // Should include custom description in at least one file
    const writeFileCalls = (fs.writeFileSync as jest.Mock).mock.calls;
    const descriptionExists = writeFileCalls.some(call => {
      const content = call[1];
      return typeof content === 'string' && content.includes('Custom module description');
    });
    
    expect(descriptionExists).toBe(true);
  });
  
  test('should handle existing directory', async () => {
    // Setup
    const options: CreateModuleOptions = {
      name: 'existing-module'
    };
    
    // Mock directory already exists
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    
    // Execute
    const result = await createModule(options);
    
    // Verify
    expect(result.success).toBe(true);
    expect(fs.mkdirSync).not.toHaveBeenCalled();
    expect(fs.writeFileSync).toHaveBeenCalledTimes(5);
  });
  
  test('should update main package.json if install=true', async () => {
    // Setup
    const options: CreateModuleOptions = {
      name: 'installable-module',
      install: true
    };
    
    // Mock package.json exists
    (fs.existsSync as jest.Mock).mockImplementation((path: string) => {
      if (path.includes('package.json')) {
        return true;
      }
      return false;
    });
    
    // Mock package.json content
    (fs.readFileSync as jest.Mock).mockImplementation((path: string) => {
      if (path.includes('package.json')) {
        return JSON.stringify({ dependencies: {} });
      }
      return '{{module-name}}';
    });
    
    // Execute
    const result = await createModule(options);
    
    // Verify
    expect(result.success).toBe(true);
    
    // Check if main package.json was updated with the module name
    const writeFileCalls = (fs.writeFileSync as jest.Mock).mock.calls;
    const mainPackageJsonUpdated = writeFileCalls.some(call => {
      const filePath = call[0];
      const content = call[1];
      return filePath === path.join('/fake/cwd', 'package.json') && 
             typeof content === 'string' && 
             content.includes('installable-module');
    });
    
    expect(mainPackageJsonUpdated).toBe(true);
  });
  
  test('should run npm install if npm=true', async () => {
    // Setup
    const options: CreateModuleOptions = {
      name: 'npm-module',
      install: true,
      npm: true
    };
    
    // Mock package.json exists
    (fs.existsSync as jest.Mock).mockImplementation((path: string) => {
      if (path.includes('package.json')) {
        return true;
      }
      return false;
    });
    
    // Mock package.json content
    (fs.readFileSync as jest.Mock).mockImplementation((path: string) => {
      if (path.includes('package.json')) {
        return JSON.stringify({ dependencies: {} });
      }
      return '{{module-name}}';
    });
    
    // Execute
    const result = await createModule(options);
    
    // Verify
    expect(result.success).toBe(true);
    
    // Should run npm install
    expect(require('child_process').exec).toHaveBeenCalledWith(
      'npm install',
      { cwd: '/fake/cwd' },
      expect.any(Function)
    );
  });
  
  test('should handle errors gracefully', async () => {
    // Setup
    const options: CreateModuleOptions = {
      name: 'error-module'
    };
    
    // Mock error in fs.writeFileSync
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {
      throw new Error('Mocked file system error');
    });
    
    // Execute
    const result = await createModule(options);
    
    // Verify
    expect(result.success).toBe(false);
    expect(result.error).toBe('Mocked file system error');
  });
  
  test('should fail if name is not provided', async () => {
    // Setup
    const options = {} as CreateModuleOptions;
    
    // Execute
    const result = await createModule(options);
    
    // Verify
    expect(result.success).toBe(false);
    expect(result.error).toBe('Module name is required');
  });
});
