<?php
header('Access-Control-Allow-Origin: http://localhost:8000');
header('Access-Control-Allow-Credentials: true');
$db = new SQLite3('ratings.db');


function get_user_with_token($token) {
	global $db;
	$stmt = $db->prepare('SELECT id,name,token FROM users WHERE token=:token');
	$stmt->bindValue(':token',$token,SQLITE3_TEXT);
	$res = $stmt->execute();
	$user = $res->fetchArray();
	$res->finalize();
	return $user;
}

function get_user() {
	global $db;
	if(isset($_GET['token'])) {
		$token = $_GET['token'];
		if($user = get_user_with_token($token)) {
			return $user;
		}
	} 
	$token = uniqid();
	$db->query('INSERT INTO users (name, token) VALUES ("","'.$token.'")');
	return get_user_with_token($token);
}

function get() {
	switch($_GET['command']) {
		case 'leaderboard':
			get_leaderboard();
			break;
		default:
			show();
	}
}

function show() {
	global $db, $user;
	echo "you: ".json_encode($user);
	echo "<BR>";
	$results = $db->query('SELECT * FROM users');
	while ($row = $results->fetchArray()) {
		echo json_encode($row)."<br>";
	}
	$results->finalize();
}

function compute_leaderboard() {
	global $db,$user;
	$results = $db->query('SELECT name,ratings FROM users');
	$points = array();
	$point_scheme = [12,10,8,7,6,5,4,3,2,1];
	while($row = $results->fetchArray()) {
		if($row['name']) {
			$ratings = json_decode($row['ratings']);
			for($i=0;$i<count($point_scheme);$i++) {
				if($i<count($ratings)) {
					$points[$ratings[$i]] += $point_scheme[$i];
				}
			}
		}
	}
	arsort($points);
	$leaderboard = [];
	foreach($points as $country=>$score) {
		$leaderboard[] = ["country"=>$country,"score"=>$score];
	}
	return $leaderboard;
}

function get_leaderboard() {
	echo json_encode(compute_leaderboard());
}

function set_name() {
	global $db,$user;
	$stmt = $db->prepare('UPDATE users SET name=:name WHERE id=:id');
	$stmt->bindValue(':id',$user['id'],SQLITE3_INTEGER);
	$stmt->bindValue(':name',$_POST['name'],SQLITE3_TEXT);
	$stmt->execute();
	respond(array());
}
function set_ratings() {
	global $db,$user;
	$stmt = $db->prepare('UPDATE users SET ratings=:ratings WHERE id=:id');
	$stmt->bindValue(':id',$user['id'],SQLITE3_INTEGER);
	$stmt->bindValue(':ratings',$_POST['ratings'],SQLITE3_TEXT);
	$stmt->execute();
	respond(array());
}

function respond($response) {
	global $user;
	$response['token'] = $user['token'];
	echo json_encode($response);
}

function post() {
	$command = $_POST['command'];
	switch($command) {
		case 'set_name':
			set_name();
			break;
		case 'set_ratings':
			set_ratings();
			break;
		case 'leaderboard':
			get_leaderboard();
			break;
	}
}

if($_SERVER['REQUEST_METHOD'] === 'POST') {
	$user = get_user();
	post();
} else {
	if($_GET['token']) {
		echo "token: ".$_GET['token']."<BR>";
		$user = get_user();
		echo "USER: ".json_encode($user)."<BR>";
	}
	get();
}
