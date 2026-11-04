// Prints the README endpoint table by reading every backend/routes/*.routes.js file.
// Run from the project root:   node docs/list-endpoints.js
// Then paste the output into README.md under "Endpoints".
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'backend', 'routes');
const rows = [];

for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.routes.js')).sort()) {
  const mount = '/api/' + file.replace('.routes.js', '');
  const text = fs.readFileSync(path.join(dir, file), 'utf8');
  const needsLogin = /router\.use\(\s*authenticate/.test(text);

  // matches:  router.get('/path', ...anything..., ctrl.handler)
  const re = /router\.(get|post|put|patch|delete)\(\s*['"`]([^'"`]*)['"`]\s*,([^;]*)\)\s*;/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const [, method, sub, rest] = m;
    const roles = (rest.match(/requireRole\(([^)]*)\)/) || [])[1];
    const handler = (rest.match(/(\w+\.\w+)\s*$/) || [])[1] || '?';
    const who = roles ? roles.replace(/['"\s]/g, '') + ' only' : needsLogin || /authenticate/.test(rest) ? 'any logged-in user' : 'public';
    rows.push(`| ${method.toUpperCase()} | ${mount}${sub === '/' ? '' : sub} | ${who} | ${handler} |`);
  }
}

console.log('| Method | URL | Who can use it | Handler |');
console.log('|---|---|---|---|');
console.log(rows.join('\n'));
console.log(`\n${rows.length} endpoints`);
