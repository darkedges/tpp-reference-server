const { fapiFinancialIdFor } = require('../authorisation-servers');
const uuidv4 = require('uuid/v4');
const { getUsername } = require('./session');

const extractHeaders = async (headers) => {
  const sessionId = headers['authorization'];
  const authorisationServerId = headers['x-authorization-server-id'];
  const fapiFinancialId = await fapiFinancialIdFor(authorisationServerId);
  const interactionId = headers['x-fapi-interaction-id'] || uuidv4();
  const username = await getUsername(sessionId);
  const validationRunId = headers['x-validation-run-id'];
  let permissions = headers['x-permissions'];
  if (permissions) {
    permissions = permissions.split(' ');
  }

  return {
    authorisationServerId,
    fapiFinancialId,
    interactionId,
    sessionId,
    username,
    validationRunId,
    permissions,
  };
};

exports.extractHeaders = extractHeaders;
