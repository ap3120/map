<?php
require '../vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createImmutable('../');
$dotenv->load();
$key = $_ENV['NEWS_API'];

ini_set('display_errors', 'On');
error_reporting(E_ALL);

$executionStartTime = microtime(true);

//$url='http://newsapi.org/v2/top-headlines?country=' . $_REQUEST['countryCode'] . '&pageSize=5&page=1&apiKey=' . $key;
$url='https://newsdata.io/api/1/news?apikey=' . $key . '&country=' . $_REQUEST['countryCode'];
$ch = curl_init();
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_URL,$url);

$result=curl_exec($ch);

curl_close($ch);

$decode = json_decode($result,true);	

$output['status']['code'] = "200";
$output['status']['name'] = "ok";
$output['status']['description'] = "success";
$output['status']['returnedIn'] = intval((microtime(true) - $executionStartTime) * 1000) . " ms";

if ($decode['status'] === 'success') {
    if (count($decode['results']) > 4) {
        $res = array_slice($decode['results'], 0, 4);
        $output['data'] = $res;
    } else {
        $output['data'] = $decode['results'];
    }
} else {
    $output['data'] = $decode['results'];
}

header('Content-Type: application/json; charset=UTF-8');

echo json_encode($output); 

?>
