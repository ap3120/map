## Requirements
1. Apache web server
2. npm
3. composer

## Installation
`npm install`</br>
`composer install`

## APIs
This application uses multiple APIs.</br>
To run it properly, you need to create a .env file at the root of the project following the .env-sample</br>
Then get your free APIs keys from the following APIs:
1. https://opencagedata.com/ --> `OPEN_CAGE_API=`
2. https://rapidapi.com/apininjas/api/holidays-by-api-ninjas/ --> `HOLIDAYS_API=`
3. https://openexchangerates.org --> `OPEN_EXCHANGE_RATE_API=`
4. https://api.windy.com --> `WINDY_API=`
5. https://www.geonames.org --> `GEONAMES_USERNAME=`
6. https://www.visualcrossing.com/weather-api/ --> `VISUAL_CROSSING_API=`
7. https://newsapi.org --> `NEWS_API=`
8. https://rapidapi.com/wirefreethought/api/geodb-cities --> `GEODB_API=`

## Running the application
Make sure the Apache server is running.</br>
For example on Linux: `sudo service apache2 start`</br>
If using apache2 the code needs to be at the following location: `/var/www/html`</br>
In your browser url type `http://localhost/map`
