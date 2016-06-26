var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');
var request = require('request');
var Uber = require('uber-api')({
    server_token: 'cepnsST9mZ0VJPuWT4y6h_82P9-xxLLpA4ZmBfIi',
    version: 'v1'
});

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.set('port', process.env.PORT || 9000);

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);

/**
 * Get estimate price from current location to destination with Uber API
 */
function getEstimatePriceUber(start_lat, start_long, end_lat, end_long, cb) {
    Uber.getPriceEstimate({
        sLat: start_lat,
        sLng: start_long,
        eLat: end_lat,
        eLng: end_long
    }, function(err, response) {
        if (!err) {
            cb(null, response);
        }
        console.log(err);
    });
}

/**
 * Request a ride from Uber.
 */
function getEstimateTimeUser(start_lat, start_long, cb) {
    Uber.getTimeEstimate({
        sLat: start_lat,
        sLng: start_long,
    }, function(err, response) {
        if (!err) {
            cb(null, response);
        }
        console.log(err);
    });
}

/**
 * Convert lat and long to Address formatted_address.
 */
function latLongToAddress(lat, long, cb) {
    var URL = "http://maps.googleapis.com/maps/api/geocode/json?address=" + lat + "," + long + "&sensor=false";
    request(URL, function(err, res, body) {
        if (!err) {
            cb(null, JSON.parse(body).results[0].formatted_address);
        }
        console.log(err);
    });
}

/**
 * Get list of all nearby restaurants.
 * GrubHub API made with love and beast-mode activated by Rohit.
 */
function findRestuarant(lat, long, food, cb) {
    request.post({
        url: "https://api-gtm.grubhub.com/auth",
        json: {
            "brand": "GRUBHUB",
            "client_id": "beta_UmWlpstzQSFmocLy3h1UieYcVST",
            "scope": "anonymous",
            "device_id": -901860116
        }
    }, function(err, res, body) {
        request.get("https://api-gtm.grubhub.com/restaurants/search?orderMethod=delivery&locationMode=DELIVERY&facetSet=umami&pageSize=20&hideHateos=true&queryText=" + food + "&location=POINT(" + long + "%20" + lat + ")&variationId=default-impressionScoreBaseBuffed-20160317&countOmittingTimes=true", {
            'auth': {
                'bearer': body.session_handle.access_token
            }
        }, function(err, res, body) {
            console.log(err);
            console.log(body);
            cb(null, body);
        });
    });
}

/**
 * Get all movie based on current location.
 */
function findMovie(lat, long, date, cb) {
    var URL = "http://data.tmsapi.com/v1.1/movies/showings?startDate=" + date + "&lat=" + lat + "&lng=" + long + "&radius=20&units=mi&api_key=b5fnfgd9nnzkxs8qnk2jzxsu";
    request(URL, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            cb(null, JSON.parse(body));
        }
    });
}

/**
 * Convert date to yyyy-mm-dd format
 */
function formatDate(date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
}

/**
 * Wingman API to get Uber estimate price, restaurants and movies
 */
app.use('/wingman', function(req, res, next) {
    var start_lat = req.body.start_lat;
    var start_long = req.body.start_long;
    var end_lat = req.body.end_lat;
    var end_long = req.body.end_long;
    var food = req.body.food;
    var money = req.body.money;
    var movie = req.body.movie;
    var uber = req.body.uber;
    // Welcome to the world of callback hell.
    getEstimatePriceUber(42.3601, -71.0589, 42.3601, -71, function(err, price) {
        if (!err) {
            getEstimateTimeUser(42.3601, -71.0589, function(err, time) {
                if (!err) {
                    findMovie(42.3601, -71.0589, formatDate(new Date()), function(err, movies) {
                        if (!err) {
                            findRestuarant(42.3601, -71.0589, "Chinese", function(err, restaurants) {
                                if (!err) {
                                    res.json({
                                        time: time,
                                        movies: movies,
                                        price: price,
                                        restaurants: restaurants
                                    });
                                    next();
                                }
                                console.log(err);
                            });
                        }
                        console.log(err);
                    });
                }
                console.log(err);
            });
        }
        console.log(err);
    });
});

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: err
    });
});

app.listen(app.get("port"));
console.log("Server is listening at port: " + (process.env.PORT || 9000));

module.exports = app;