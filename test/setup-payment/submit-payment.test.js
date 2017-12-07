const assert = require('assert');
const proxyquire = require('proxyquire');
const sinon = require('sinon');

const authorisationServerId = 'testAuthorisationServerId';
const fapiFinancialId = 'testFinancialId';
const fapiInteractionId = 'interaction-1234';
const PAYMENT_SUBMISSION_ID = 'PS456';

describe('submitPayment called with authorisationServerId and fapiFinancialId', () => {
  const accessToken = 'access-token';
  const resourceServer = 'http://resource-server.com';
  const resourcePath = `${resourceServer}/open-banking/v1.1`;
  const paymentId = '88379';
  const idempotencyKey = '2023klf';
  const idempotencyKeyUnhappy = 'ee15fea57';
  let submitPaymentProxy;

  const PaymentsSubmissionSuccessResponse = () => ({
    Data: {
      PaymentSubissionId: PAYMENT_SUBMISSION_ID,
      Status: 'AcceptedSettlementInProcess',
    },
  });

  const PaymentsSubmissionRejectedResponse = () => ({
    Data: {
      PaymentSubissionId: PAYMENT_SUBMISSION_ID,
      Status: 'Rejected',
    },
  });

  const creditorAccount = {
    SchemeName: 'SortCodeAccountNumber',
    Identification: '01122313235478',
    Name: 'Mr Kevin',
    SecondaryIdentification: '002',
  };
  const instructedAmount = {
    Amount: '100.45',
    Currency: 'GBP',
  };

  const paymentsSuccessStub = sinon.stub().returns(PaymentsSubmissionSuccessResponse());
  const paymentsRejectedStub = sinon.stub().returns(PaymentsSubmissionRejectedResponse());
  const accessTokenAndResourcePathProxy = sinon.stub().returns({ accessToken, resourcePath });
  const retrievePaymentDetailsStub = sinon.stub().returns({
    PaymentId: paymentId,
    CreditorAccount: creditorAccount,
    InstructedAmount: instructedAmount,
  });

  const setup = paymentStub => () => {
    submitPaymentProxy = proxyquire('../../app/setup-payment/submit-payment', {
      '../setup-request': { accessTokenAndResourcePath: accessTokenAndResourcePathProxy },
      './payments': { postPayments: paymentStub },
      './persistence': { retrievePaymentDetails: retrievePaymentDetailsStub },
    }).submitPayment;
  };

  describe('When Submitted Payment is in status AcceptedSettlementInProcess', () => {
    before(setup(paymentsSuccessStub));

    it('Returns PaymentSubmissionId from postPayments call', async () => {
      const id = await submitPaymentProxy(
        authorisationServerId, fapiFinancialId,
        idempotencyKey, fapiInteractionId,
      );
      assert.equal(id, PAYMENT_SUBMISSION_ID);
      assert.ok(paymentsSuccessStub.calledWithExactly(
        resourcePath,
        '/open-banking/v1.1/payment-submissions',
        accessToken,
        {}, // headers
        {}, // opts
        {}, // risk
        creditorAccount,
        instructedAmount,
        fapiFinancialId,
        idempotencyKey,
        paymentId,
      ));
    });
  });

  describe('When Payment Submission Rejected', () => {
    before(setup(paymentsRejectedStub));
    it('returns an error from postPayments call', async () => {
      try {
        await submitPaymentProxy(
          authorisationServerId, fapiFinancialId,
          idempotencyKeyUnhappy, fapiInteractionId,
        );
      } catch (err) {
        assert.equal(err.status, 500);
        assert.ok(paymentsRejectedStub.calledWithExactly(
          resourcePath,
          '/open-banking/v1.1/payment-submissions',
          accessToken,
          {}, // headers
          {}, // opts
          {}, // risk
          creditorAccount,
          instructedAmount,
          fapiFinancialId,
          idempotencyKeyUnhappy,
          paymentId,
        ));
      }
    });
  });
});
