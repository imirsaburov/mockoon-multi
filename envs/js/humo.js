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
    }
};

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
