<?php
session_start();
header('Access-Control-Allow-Origin: http://localhost:8000');
header('Access-Control-Allow-Credentials: true');
$db = new SQLite3('ratings.db');

$user = null;
if(isset($_SESSION['id'])) {
	$res = $db->query('SELECT id,name FROM users WHERE id='.$_SESSION['id']);
	$user = $res->fetchArray();
	$res->finalize();
}
if(!$user) {
	$db->query('INSERT INTO users (name) VALUES ("")');
	$rowid = $db->lastInsertRowID();
	$result = $db->query('SELECT id,name FROM users WHERE rowid='.$rowid);
	$row = $result->fetchArray();
	$_SESSION['id'] = $row['id'];
	$user = $row;
	$result->finalize();
}

function get() {
	global $db, $user;
	echo "you: ".json_encode($user);
	echo "<BR>";
	$results = $db->query('SELECT * FROM users');
	while ($row = $results->fetchArray()) {
		echo json_encode($row);
	}
	$results->finalize();
	compute_points();
}

function compute_points() {
	global $db,$user;
	$results = $db->query('SELECT name,ratings FROM users');
	$points = array();
	$point_scheme = [12,10,8,7,6,5,4,3,2,1];
	while($row = $results->fetchArray()) {
		?><h3><?= $row['name'] ?></h3><?php
		$ratings = json_decode($row['ratings']);
		for($i=0;$i<count($point_scheme);$i++) {
			if($i<count($ratings)) {
				?><p><?= $point_scheme[$i] ?>: <?= $ratings[$i] ?></p><?php
				$points[$ratings[$i]] += $point_scheme[$i];
			}
		}
	}
	arsort($points);
	echo json_encode($points);
}

function set_name() {
	global $db,$user;
	$stmt = $db->prepare('UPDATE users SET name=:name WHERE id=:id');
	$stmt->bindValue(':id',$user['id'],SQLITE3_INTEGER);
	$stmt->bindValue(':name',$_POST['name'],SQLITE3_TEXT);
	$stmt->execute();
}
function set_ratings() {
	global $db,$user;
	$stmt = $db->prepare('UPDATE users SET ratings=:ratings WHERE id=:id');
	$stmt->bindValue(':id',$user['id'],SQLITE3_INTEGER);
	$stmt->bindValue(':ratings',$_POST['ratings'],SQLITE3_TEXT);
	$stmt->execute();
}

function post() {
	$command = $_POST['command'];
	echo $command;
	switch($command) {
		case 'set_name':
			set_name();
			break;
		case 'set_ratings':
			set_ratings();
			break;
	}
}

if($_SERVER['REQUEST_METHOD'] === 'POST') {
	post();
} else {
	get();
}
