const express = require('express');
const cache = require('./cache');

const app = express();
const port = 3000;
const path = require("path");
let publicPath = path.resolve(__dirname, 'public');

// OpenWeatherMap Weather API key
const APIkey = "28343bec635c6b79aed2506444c96ac9";

app.use(express.static(publicPath));

// App listening to 
app.listen(port, () => console.log(`App listening on port ${port}!`));

// Homepage: upon entering the homepage, the index.html file is sent to the client-side
// and loaded
app.get('/', function (req, res) {
    res.sendFile(path.join(publicPath, '/index.html'));
});

// Results page: when user enters a location, the homepage is switched to the result page
app.get('/search/:city', function (req, res) {
    res.sendFile(path.join(publicPath, '/search.html'));
    console.log("Results page requested");
});

// As soon as the results page loads, a request to GET weather data is sent.
// The results are also cached.
app.get('/search/results/:city', cache.cacheURL(600),sendLocation);

// This function makes API calls to receive weather data for the given location
async function sendLocation(req, res) {
    try {
        // Use location in URL as a variable for the location
        const city = req.params.city;
        console.log(`sendLocation called for ${city}`);
        // According to OpenWeatherMap's docs, the weather API needs the latitude and longitude of the
        // location in order to return a 5-day weather forecast. Their built-in Geocoder is deprecated.
        const [lat, lon] = await getCoords(city);

        if (lat != null && lon != null) {
            // Get weather data
            const weather = await fetch(`http://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${APIkey}&units=metric`);
            const weatherData = await weather.json();

            // Get pollution data
            const airPollution = await fetch(`http://api.openweathermap.org/data/2.5/air_pollution/forecast?lat=${lat}&lon=${lon}&appid=${APIkey}`);
            const airPollutionData = await airPollution.json();

            // Send both datas together as a JSON.
            res.send({
                wData: weatherData,
                apData: airPollutionData
            });
        }
        // If no latitude or longitude was returned, throw an exception.
        else {
            throw new Error('Location not found');
        }
    } 
    //If an error is caught, print it to console and send the error as a response
    catch (error) {
        console.log(error);
        return res.status(400).send({
            message: 'Error caught!'
        });
    }

}


// This function gets the longitude and latitude using OpenWeatherMap's Geocoding API.
async function getCoords(city) {
    try {
        const geocode = await fetch(`http://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${APIkey}`);
        const data = await geocode.json();

        //Multiple locations are returned, however for the purpose of my application
        // only the first one is needed.
        if (Object.keys(data).length > 0) {
            const item = data[0];
            return [item.lat, item.lon];
        }
        // If the list of places is empty, return an error as the location was not found.
        else {
            throw new Error('Location not found');
        }
    } catch (error) {
        console.log(error);
        return [null, null];
    }
}