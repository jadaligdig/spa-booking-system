// Every response in the API uses the same JSON shape.
//   success: { "success": true,  "message": "...", "data": ... }
//   error:   { "success": false, "message": "...", "errors": [ ... ] }
exports.ok = (res, data, message = 'OK', status = 200) =>
  res.status(status).json({ success: true, message, data });

exports.created = (res, data, message = 'Created') =>
  res.status(201).json({ success: true, message, data });

exports.fail = (res, status, message, errors = []) =>
  res.status(status).json({ success: false, message, errors });
