express = require('express');
router = express.Router();
request = require('request-json');

var client = request.createClient('https://cloud.xee.com');

router.post('/public/proxy/', function(req, res, next) {
    client.headers = req.body.headers

    console.log(req.body)
    var respondBack = function(err, response, body) {
        res.status(response.statusCode).send(body);

    };
    if (req.body.type.toLowerCase() === 'post') {
        client.post(req.body.path, req.body.data, respondBack);
    } else if (req.body.type.toLowerCase() === 'get') {
        client.get(req.body.path, respondBack);
    }
});

// Export the router instance to make it available from other files.
module.exports = router;
