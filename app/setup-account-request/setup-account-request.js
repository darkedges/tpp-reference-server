const { accessTokenAndResourcePath } = require('../authorise');
const { postAccountRequests } = require('./account-requests');

const createRequest = async (resourcePath, headers) => {
  const response = await postAccountRequests(resourcePath, headers);
  let error;
  if (response.Data) {
    const status = response.Data.Status;
    if (status === 'AwaitingAuthorisation' || status === 'Authorised') {
      if (response.Data.AccountRequestId && response.Data.Permissions) {
        return {
          accountRequestId: response.Data.AccountRequestId,
          permissions: response.Data.Permissions,
        };
      }
    } else {
      error = new Error(`Account request response status: "${status}"`);
      error.status = 500;
      throw error;
    }
  }
  error = new Error('Account request response missing payload');
  error.status = 500;
  throw error;
};

const setupAccountRequest = async (headers) => {
  const { authorisationServerId } = headers;
  const { accessToken, resourcePath } = await accessTokenAndResourcePath(authorisationServerId);
  const headersWithToken = Object.assign({ accessToken }, headers);
  const accountRequestIdAndPermissions = await createRequest(resourcePath, headersWithToken);
  return accountRequestIdAndPermissions;
};

exports.setupAccountRequest = setupAccountRequest;
