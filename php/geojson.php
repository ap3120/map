<?php
require '../vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createImmutable('../');
$dotenv->load();
$path = $_ENV['PATH_TO_COUNTRY_BORDERS'];

ini_set('display_errors', 'On');
error_reporting(E_ALL);

$executionStartTime = microtime(true);

$url=$path;

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

$arr = array();

if ($_REQUEST['q'] === 'ACN') { # All countries names

  for ($i=0; $i<count($decode['features']); $i+=1) {
    $arr[] = array(
      'iso_a2'=>$decode['features'][$i]['properties']['iso_a2'],
      'name'=>$decode['features'][$i]['properties']['name']
    );
  }

} else if ($_REQUEST['q'] === 'ACG') { # All countries geometry
  $arr = $decode['features']; 
} else if ($_REQUEST['q'] === 'SC') { # Single country
  $item = null;
  foreach($decode['features'] as $struct) {
    if ($_REQUEST['iso_a2'] == $struct['properties']['iso_a2']) {
      $item = $struct;
      break;
    }
  }
  $arr[] = $struct;
}

$output['data'] = $arr;
header('Content-Type: application/json; charset=UTF-8');

echo json_encode($output); 

?>
