const humoData = require('./data/humo-data');

const temp = {};

module.exports = {
    name: 'humo-sms',

    routes(app) {
        app.post('/v1/send/sms', (req, res) => {

            const {pan, msisdn} = req.body.params;

            const card = humoData
                .CARDS
                .filter(card => card.pan === pan)[0];

            let response;

            if (card) {
                response = {
                    id: req.body.id,
                    result: {
                        message: 'OTP code has been sent to mobile number',
                        msisdn: msisdn
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
        app.post('/v1/send/code', (req, res) => {

            const {pan, code} = req.body.params;

            const card = humoData
                .CARDS
                .filter(card => card.pan === pan)[0];

            let response;

            if (card) {
                if (code === "000000") {
                    response = {
                        id: req.body.id,
                        result: {
                            message: 'Successfully permission granted"',
                            token: "PFID00000000"
                        }
                    }
                } else {
                    response = {
                        id: req.body.id,
                        error: {
                            code: 404,
                            message: 'Code is invalid"'
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
