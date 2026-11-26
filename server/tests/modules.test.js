const fs = require('fs');
const path = require('path');

describe('Module Syntax & Import Verification', () => {
  it('loads app.js without syntax or import errors', () => {
    expect(() => require('../app')).not.toThrow();
  });

  const targetDirs = ['controllers', 'routes', 'services', 'utils', 'middleware'];

  targetDirs.forEach((dirName) => {
    const dirPath = path.join(__dirname, '..', dirName);
    if (!fs.existsSync(dirPath)) return;

    const files = fs.readdirSync(dirPath).filter((f) => f.endsWith('.js'));

    describe(`${dirName}/ directory`, () => {
      files.forEach((file) => {
        it(`loads ${dirName}/${file} successfully`, () => {
          const fullPath = path.join(dirPath, file);
          expect(() => require(fullPath)).not.toThrow();
        });
      });
    });
  });
});
