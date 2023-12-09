<?php
    require '../vendor/autoload.php';
    $dotenv = Dotenv\Dotenv::createImmutable('../');
    $dotenv->load();
    $key = $_ENV['WINDY_API'];
    
    ini_set('display_errors', 'On');
    error_reporting(E_ALL);

    $executionStartTime = microtime(true);

    $url='https://api.windy.com/webcams/api/v3/webcams?lang=en&limit=30&offset=0&sortKey=popularity&sortDirection=desc&include=images,location,player&countries=' . $_REQUEST['countryCode'];
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_URL,$url);
    curl_setopt($ch, CURLOPT_HTTPHEADER, array('X-WINDY-API-KEY: ' . $key));

    $result=curl_exec($ch);

    curl_close($ch);

    $decode = json_decode($result,true);	

    $output['status']['code'] = "200";
    $output['status']['name'] = "ok";
    $output['status']['description'] = "success";
    $output['status']['returnedIn'] = intval((microtime(true) - $executionStartTime) * 1000) . " ms";
    $output['data'] = $decode['webcams'];

    header('Content-Type: application/json; charset=UTF-8');

    echo json_encode($output); 

?>
