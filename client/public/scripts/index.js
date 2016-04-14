CLIENT_ID = 'xSXsNcpDM4Ca6p21T0pw';
APP_AUTH = 'eFNYc05jcERNNENhNnAyMVQwcHc6ZG9lZVpIazRZblZzalpqdm9sU2c='
REDIRECT_URI = 'https://guillaumejacquart.cozycloud.cc/public/dumpxee/redirect.html'
SCOPE = 'user_get email_get car_get data_get location_get address_all accelerometer_get';


//
// Init - has AccessToken --> "check token"
//   |
//   ---- hasn't AccessToken --> button connect <-- show xee auth page.
//   -- redirect : getAccessToken, get base infos.


var proxy = function(options) {
    return new Promise(function(resolve, reject) {
        $.ajax({
            type: 'post',
            url: './proxy',
            data: $.param(options),
            success: resolve,
            error: reject
        });
    });
};

var proxyGet = function(path) {
    return proxy({ type: 'get', path: path });
};

var Account = {

    getAccessToken: function() {
        return localStorage.getItem('access_token');
    },

    getAuthUrl: function() {
        return 'https://cloud.xee.com/v1/auth/auth?'
            + $.param({
                client_id: CLIENT_ID,
                scope: SCOPE,
                redirect_uri: REDIRECT_URI
            });
    },


    fetchAccessToken: function(code) {
        return proxy({
            type: 'post',
            path: '/v1/auth/access_token.json',
            data: {
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: REDIRECT_URI,
                scopes: SCOPE,
            },
            headers: {
                'Authorization': 'Basic ' + APP_AUTH,
            }
        }).then(function(data) {
                console.log("success");
                console.log(data);
                localStorage.setItem('access_token', data.access_token);
        }).catch(console.log.bind(console));
    },

};

var API = {
    getUserAndCars: function() {
        var accessToken = null;
        return new Promise(function(resolve, reject) {
            accessToken = Account.getAccessToken();
            if (!accessToken) {
                reject(new Error('no access_token'));
            } else {
                resolve(accessToken);
            }
        }).then(function(accessToken) {
            return proxyGet('/v1/user/me.json?access_token=' + accessToken);
        }).then(function(data) {
            // Get cars
            console.log(data);
            var userId = data.id;
            return proxyGet('/v1/user/'
                + userId
                + '/car.json?access_token='
                + accessToken);
        });
    },

    getData: function(carId, command, maxRow) {
        if (command === 'carstatus') {
            return API._getData(carId, command);
        }

        var promises = [];
        var offset = 0;
        while(offset < maxRow ) {
            promises.push(API._getData(carId, command, {
                limit: Math.min(maxRow - offset, 200),
                offset: offset,
            }));
            offset += 200;
        }

        return Promise.all(promises).then(function(data) {
            return data.reduce(function(agg, rows) {
                return agg.concat(rows);
            }, []);
        });
    },


    _getData: function(carId, command, param) {
        param = param || {};
        param.access_token = Account.getAccessToken();
        return proxyGet('/v1/car/' + carId + '/' + command + '.json?' + $.param(param));
    },

};

var toCSV = function(jsonArray) {
    console.log(jsonArray);
    if (jsonArray.length === 0) {
        return '';
    }

    var fields = Object.keys(jsonArray[0]).sort();
    var rows = [fields.join(',')];

    rows = rows.concat(jsonArray.map(function(row){
        return fields.map(function(fieldName){
                return '"' + (row[fieldName] || '') + '"';
            }).join(',');
        }));

    return rows.join('\n');

};


       /* </script>
        <ul>
        <li><a onclick="authenticate();">authenticate</a></li>
        <li><a onclick="accessToken();">access</a></li>
        <li><a onclick="window.open('https://cloud.xee.com/v1/user/me.json?access_token=' + accessResponse.access_token);">Pour accéder à l'utilisateur courant, effectuer la requête</a></li>
        <li><a onclick="window.open('https://cloud.xee.com/v1/user/5104/car.json?access_token=' + accessResponse.access_token);">Accéder à la liste des voitures</a></li>
        <li><a onclick="window.open('https://cloud.xee.com/v1/car/' + carId +'/event.json?access_token=' + accessResponse.access_token);">Accéder aux données techniques de la voiture</a></li>
        <li><a onclick="window.open('https://cloud.xee.com/v1/car/' + carId +'/event.json?access_token=' + accessResponse.access_token);">
        <li><a onclick="window.open('https://cloud.xee.com/v1/car/' + carId + '/carstatus.json?access_token=' + accessResponse.access_token);">L'état actuel de la voiture</a></li>
        <li><a onclick="window.open('https://cloud.xee.com/v1/car/' + carId +'/location.json?access_token=' + accessResponse.access_token);">Accéder aux données GPS de la voiture</a></li>
        <li><a onclick="window.open('https://cloud.xee.com/v1/car/' + carId +'/accelerometer.json?access_token=' + accessResponse.access_token);">Accéder aux d'accéléromètre de la voiture</a></li>


    </body>
</html>*/
