const request = require('superagent');
const { createRequest, obtainResult } = require('../ob-util');
const log = require('debug')('log');
const errorLog = require('debug')('error');
const debug = require('debug')('debug');
const assert = require('assert');
const util = require('util');

const buildAccountRequestData = Permissions => ({
  Data: { Permissions },
  Risk: {},
});

const verifyHeaders = (headers) => {
  assert.ok(headers.sessionId, 'sessionId missing from headers');
};

/*
 * For now only support Client Credentials Grant Type (OAuth 2.0).
 * @resourceServerPath e.g. http://example.com/open-banking/v1.1
 */
const postAccountRequests = async (resourceServerPath, headers) => {
  try {
    verifyHeaders(headers);
    const body = buildAccountRequestData(headers.permissions);
    const accountRequestsUri = `${resourceServerPath}/open-banking/v1.1/account-requests`;
    log(`POST to ${accountRequestsUri}`);
    const call = createRequest(request.post(accountRequestsUri), headers);
    const response = await call.send(body);
    debug(`${response.status} response for ${accountRequestsUri}`);

    const result = await obtainResult(call, response, Object.assign({}, headers, { scope: 'accounts' }));
    return result;
  } catch (err) {
    errorLog(util.inspect(err));
    const error = new Error(err.message);
    error.status = err.response ? err.response.status : 500;
    throw error;
  }
};

/*
 * For now only support Client Credentials Grant Type (OAuth 2.0).
 * @resourceServerPath e.g. http://example.com/open-banking/v1.1
 */
const getAccountRequest = async (accountRequestId, resourceServerPath, headers) => {
  try {
    verifyHeaders(headers);
    const accountRequestsUri = `${resourceServerPath}/open-banking/v1.1/account-requests/${accountRequestId}`;
    log(`GET to ${accountRequestsUri}`);
    const response = await createRequest(request.get(accountRequestsUri), headers)
      .send();
    debug(`${response.status} response for ${accountRequestsUri}`);
    return response.body;
  } catch (err) {
    errorLog(util.inspect(err));
    const error = new Error(err.message);
    error.status = err.response ? err.response.status : 500;
    throw error;
  }
};

const deleteAccountRequest = async (accountRequestId, resourceServerPath, headers) => {
  try {
    verifyHeaders(headers);
    const accountRequestDeleteUri = `${resourceServerPath}/open-banking/v1.1/account-requests/${accountRequestId}`;
    log(`DELETE to ${accountRequestDeleteUri}`);
    const response = await createRequest(request.del(accountRequestDeleteUri), headers)
      .send();
    debug(`${response.status} response for ${accountRequestDeleteUri}`);
    if (response.status === 204) {
      return true;
    }
    throw new Error('Bad Request');
  } catch (err) {
    errorLog(util.inspect(err));
    const error = new Error(err.message);
    error.status = err.response ? err.response.status : 400;
    throw error;
  }
};

exports.buildAccountRequestData = buildAccountRequestData;
exports.postAccountRequests = postAccountRequests;
exports.getAccountRequest = getAccountRequest;
exports.deleteAccountRequest = deleteAccountRequest;
