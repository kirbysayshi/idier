import mockFSReal from 'mock-fs';

// This entire file exists to avoid https://github.com/tschaub/mock-fs/issues/234
// aka "ENOENT, no such file or directory '... /node_modules/callsites'

function setupFS(config: Parameters<typeof mockFSReal>[0]) {
  // eslint-disable-next-line no-console
  console.log();
  return mockFSReal(config);
}

Object.keys(mockFSReal).forEach(key => {
  (setupFS as any)[key] = (mockFSReal as any)[key];
});

export const mockFS = setupFS as typeof mockFSReal;
