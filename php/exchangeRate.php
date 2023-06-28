<?php
    require '../vendor/autoload.php';
    $dotenv = Dotenv\Dotenv::createImmutable('../');
    $dotenv->load();
    $app_id = $_ENV['OPEN_EXCHANGE_RATE_API'];
    
    ini_set('display_errors', 'On');
    error_reporting(E_ALL);

    $executionStartTime = microtime(true);

    //$url='https://openexchangerates.org/api/latest.json?app_id=' . $app_id . '&symbols=' . $_REQUEST['symbols'];
    $url='https://openexchangerates.org/api/latest.json?app_id=' . $app_id;
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
    //$output['data'] = $decode['rates'];
    $ratesArr = $decode['rates'];
    $currencyRate = $ratesArr[$_REQUEST['symbols']];
    foreach($ratesArr as $code => &$rate) {
        $rate = $rate/$currencyRate;
    }

    $output['data'] = $ratesArr;

    header('Content-Type: application/json; charset=UTF-8');

    echo json_encode($output); 

?>
