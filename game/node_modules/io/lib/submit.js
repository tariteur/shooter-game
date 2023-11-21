const mime = require('mime');

const send = require('../helpers/send.js');
const generateBoundary = require('../helpers/generate_boundary.js');

/**
* Perform HTTP request by submitting a form (multipart/form-data)
* @param {enum} method The request Method
*   ["GET", "GET"]
*   ["POST", "POST"]
*   ["PUT", "PUT"]
*   ["PATCH", "PATCH"]
*   ["DELETE", "DELETE"]
* @param {string} url The URL to make an HTTP(S) request to
* @param {object} queryParams Parameters sent as part of the HTTP query string
* @param {object} headers Custom HTTP request headers
* @param {string} formData The formData in key-value form
* @param {function} streamListener Callback to stream data to
* @returns {object} response
* @ {number} statusCode
* @ {object} headers
* @ {buffer} body
*/
module.exports = async (method, url, queryParams, headers = {}, formData = {}, streamListener = null) => {

  const boundary = generateBoundary();
  headers['Content-Type'] = `multipart/form-data; boundary=${boundary}`;
  const body = Object.keys(formData).map(key => {
    const value = formData[key];
    return [
      `--${boundary}`,
      `Content-Disposition: form-data; name="${key}"${(Buffer.isBuffer(value) && value.filename) ? `; filename="${value.filename}"` : ``}`,
      (
        Buffer.isBuffer(value)
          ? value.filename
            ? `Content-Type: ${mime.getType(value.filename)}\r\nContent-Transfer-Encoding: binary`
            : `Content-Type: application/octet-stream\r\nContent-Transfer-Encoding: binary`
          : typeof value === 'object'
            ? `Content-Type: application/json`
            : `Content-Type: text/plain`
      ),
      ``,
      (
        Buffer.isBuffer(value)
          ? value.toString('binary')
          : typeof value === 'object'
            ? JSON.stringify(value)
            : value
      ),
    ].join(`\r\n`);
  }).join(`\r\n`) + (Object.keys(formData).length ? `\r\n--${boundary}--` : ``);

  let result = await send(method, url, queryParams, null, headers, null, body, streamListener);
  return {
    statusCode: result.statusCode,
    headers: result.headers,
    body: result.body
  };

};
