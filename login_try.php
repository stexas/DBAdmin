<?
require_once('config.php');
require_once('include/functions.php');

global $dbconfig,$databases;

if(isset($_REQUEST['user_name']) && $_REQUEST['user_name']!=''){ 
	$user = trim(strtolower($_REQUEST['user_name']));
	$user = _clean_input($user);	
}
if(isset($_REQUEST['password']) && $_REQUEST['password']!=''){ 
	$password = trim(strtolower($_REQUEST['password']));
	$password = _clean_input($password);	
}
if($user!='' && $password!=''){

	$conn = mysql_connect($dbconfig['db_host_name'],$dbconfig['db_user_name'],$dbconfig['db_password']);
	mysql_select_db($dbconfig['db_name'], $conn);
	
	$query = "select * from __database_users where user='$user' and password='$password'";

	$results = mysql_query($query, $conn)  or die(mysql_error());

	$i = 0;	
	if(mysql_num_rows($results) != 0)
	{
	  $noofrows = mysql_num_rows($results);
	
	  for($i==0; $i<$noofrows; $i++)
	  {
		$user_databases       = mysql_result($results,$i,"databases");
		$user_tables_visibles = mysql_result($results,$i,"tables_visibles");

		$_SESSION['user_verificated'] = "yes";

		$databases = _set_databases_list($user_databases);
		$_SESSION['user_name']  	= $_REQUEST['user_name'];
		$_SESSION['user_databases'] = $databases;
		$_SESSION['user_tables'] 	= $user_tables_visibles;
		echo '{"success":true,"error":"No error"}';
		}//end for
	}else{
		echo '{"success":false,"error":"Error"}';
	}
	
}else{
	echo '{"success":false,"error":"Error"}';
}
function _clean_input($value){
	$dictionary = array(
		"\'",
		"cast",
		"@",
		"set",
		"declare",
		"varchar",
		"nvarchar",
		"CAST",
		"=",
		";",
		"as",
		"-",
		"x",
		"script",
		"src",
		"http",
		"www",
		"<",
		"DECLARE",
		"@S",
		"NVARCHAR",
		"SET",
		"(",
		")",
		"EXEC"
		);
		
	$value = str_replace("'","''",$value);
	
	foreach ($dictionary as $word){
				$word = strtolower($word);	
				if(strpos($value, $word, false)!='')
				{
					$value ="";
				}
	}
	

	return $value;
}
?>