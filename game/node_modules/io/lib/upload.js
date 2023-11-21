const mime = require('mime');

const send = require('../helpers/send.js');
const generateBoundary = require('../helpers/generate_boundary.js');

const VALID_ENCODINGS = {
  'utf8': true,
  'binary': true
};

/**
* Perform HTTP POST request (multipart/form-data)
* @param {string} url The URL to make an HTTP(S) request to
* @param {string} authorization HTTP Authorization header value. If "Bearer " or "Basic " prefixes are not included, "Bearer " will be assumed.
* @param {object} headers Custom HTTP request headers
* @param {object} params The request form payload
* @param {function} streamListener Callback to stream data to
* @returns {object} response
* @ {number} statusCode
* @ {object} headers
* @ {object} data
*/
module.exports = async (url, authorization = null, headers = {}, params = {}, streamListener = null) => {

  const boundary = generateBoundary();
  headers['Content-Type'] = `multipart/form-data; boundary=${boundary}`;
  const body = Object.keys(params).map(key => {

    const value = params[key];

    let encoding = 'utf8';
    let contentData = `Content-Disposition: form-data; name="${key}"`;
    let content = null;

    if (Buffer.isBuffer(value)) {
      if (value.filename || value.name) {
        contentData += `; filename="${value.filename || value.name}"`;
      }
      if (value.contentType || value.type) {
        contentData += `\r\nContent-Type: ${value.contentType || value.type}`;
      } else if (value.filename || value.name) {
        contentData += `\r\nContent-Type: ${mime.getType(value.filename || value.name)}`;
      } else {
        contentData += `\r\nContent-Type: application/octet-stream`;
      }
      if (value.contentTransferEncoding || value.encoding) {
        encoding = value.contentTransferEncoding || value.encoding;
        if (!VALID_ENCODINGS[encoding]) {
          throw new Error(`Invalid encoding: "${encoding}"`);
        }
        contentData += `\r\nContent-Transfer-Encoding: ${encoding}`;
        content = value.toString(encoding);
      } else {
        content = value.toString();
      }
    } else if (typeof value === 'object') {
      contentData += `\r\nContent-Type: application/json`;
      content = JSON.stringify(value);
    } else {
      contentData += `\r\nContent-Type: text/plain`;
      content = (value + '');
    }

    return [
      `--${boundary}`,
      contentData,
      ``,
      content,
    ].join(`\r\n`);
  }).join(`\r\n`) + (Object.keys(params).length ? `\r\n--${boundary}--` : ``);

  let result = await send('POST', url, {}, authorization, headers, null, body, streamListener);
  return {
    statusCode: result.statusCode,
    headers: result.headers,
    data: result.json
  };

};
