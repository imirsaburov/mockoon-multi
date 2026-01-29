const humoData = require('./data/humo-data');


module.exports = {
    name: 'humo',

    routes(app) {
        app.post('/cs/v1/customer/cards/by-person-code/pan', (req, res) => {

            const {pan, person_code} = req.body.params;

            const card = humoData
                .CARDS
                .filter(card => card.pan === pan)[0];

            let response;

            if (card) {
                response = {
                    id: req.body.id,
                    result: card.pinfl == person_code ? "Yes" : "No"
                }
            } else {
                response = {
                    id: req.body.id,
                    error: {
                        code: 404,
                        message: 'Card not found'
                    }
                }
            }
            res.json(response);
        });
        app.post('/v3/iiacs/card', (req, res) => {

            const {primaryAccountNumber, mb_flag} = req.body.params;

            const card = humoData
                .CARDS
                .filter(card => card.pan === primaryAccountNumber)[0];

            let response;

            if (card) {
                response = {
                    id: req.body.id,
                    result: {
                        listSize: 1,
                        card: {
                            institutionId: "AsiaAllianc",
                            primaryAccountNumber: card.pan,
                            effectiveDate: "2023-06-14T06:05:15Z",
                            updateDate: "2023-06-22T13:09:42Z",
                            prefixNumber: 2,
                            expiry: card.expDate,
                            cardSequenceNumber: 1,
                            cardholderId: "00008764",
                            nameOnCard: "Humo",
                            cardholderPassword: "Humo",
                            accountRestrictionsFlag: "E",
                            commissionGroup: "01001",
                            cardUserId: "00008764",
                            additionalInfo: "BRD00820000101IDN006104894CBS0011AGN0071038248",
                            riskGroup: "A",
                            riskGroup2: "A",
                            bankC: "09",
                            pinTryCount: 1,
                            statuses: {
                                item: [
                                    {
                                        type: "user",
                                        actionCode: "000",
                                        actionDescription: "Approved"
                                    }
                                ]
                            }
                        },
                        account: [
                            {
                                institutionId: "AsiaAllianc",
                                accountId: "35773",
                                bankAccountId: "0901095000024544",
                                currency: "860",
                                cardholderId: "00008764",
                                effectiveDate: "2023-06-22T11:26:22Z",
                                updateDate: "2023-06-22T11:31:00Z",
                                accountType: "DEFAULT",
                                initialAmount: 0,
                                lockedBackofficeAmount: 0,
                                lockTime: "2023-06-21T16:08:20Z",
                                shadowAmount: 0.0,
                                priority: 1,
                                status: "Active",
                                availableAmount: card.balance
                            }
                        ],
                        balance: {
                            currency: "860",
                            initialAmount: 0,
                            bonusAmount: 0,
                            creditLimit: 0,
                            lockedBackofficeAmount: 0,
                            lockedBackofficeAmountOffline: 0,
                            lockedAmount: 0,
                            availableAmount: card.balance
                        },
                        mb: {
                            state: "on",
                            phone: card.phone,
                            message: "Status of the customer mobile agreement is active"
                        }
                    }
                }
            } else {
                response = {
                    id: req.body.id,
                    error: {
                        code: 404,
                        message: 'Card not found'
                    }
                }
            }
            res.json(response);
        });
    }
};

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
