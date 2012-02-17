<?
global $server,$server_user,$server_pass, $dbuser ,$databases, $site_name;
global $server_slin,$server_user_slin,$server_pass_slin;

// This user has to have all the rights in the mysql server, because we will controll the permisions in a special Database
// called AdminDB_datase (you can change the database name optionally).
$server = 'mysql.nixiweb.com';
$server_user = 'u559090533_test';
$server_pass = 'testtest';


$server2 = 'mysql.nixiweb.com';
$server_user2 = 'u559090533_test';
$server_pass2 = 'testtest';


session_start();
//Here we configure the databse where we have the users permisions.
$dbconfig['db_host_name'] = 	'mysql.nixiweb.com:3306';
$dbconfig['db_user_name'] = 	'u559090533_test';
$dbconfig['db_password'] = 	'testtest';
$dbconfig['db_name'] = 		'u559090533_test';
$dbconfig['db_type'] = 'mysql';

$site_name = "AdminDB Demo";

?>