const { fail } = require('../utils/respond');

// 404: no route matched
exports.notFound = (req, res) => fail(res, 404, `Route not found: ${req.method} ${req.originalUrl}`);

// Any error thrown inside a controller or model lands here.
exports.errorHandler = (err, req, res, next) => {
  const msg = String(err.message || '');
    // MySQL: duplicate value in a UNIQUE column (for example, the same branch name)
  if (err.code === 'ER_DUP_ENTRY') {
    return fail(res, 409, 'That value already exists. Please use a different one.');
  }
  // Broken database rules (UNIQUE, FOREIGN KEY, CHECK) are the client's fault -> 400
  if (msg.includes('constraint failed')) {
    return fail(res, 400, 'Database rule violated: ' + msg.replace(/^.*constraint failed:?\s*/i, ''));
  }
  if (err.type === 'entity.parse.failed') return fail(res, 400, 'Request body is not valid JSON');
  console.error(err);
  return fail(res, 500, 'Something went wrong on the server');
};
