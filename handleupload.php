<?
error_reporting(0);
ini_set("display_errors",0);
require_once('config.php');
require_once('include/functions.php');
if(!isset($_SESSION['user_verificated']) || $_SESSION['user_verificated']!='yes'){header("Location: login.php");}

if(isset ($_FILES)){
    
    $server = $_REQUEST['server'];
    $database = $_REQUEST['bd'];
    $table = $_REQUEST['table'];
    $file_name = $_REQUEST['file_name'];
    $file_value = $_REQUEST['file_value'];
    $condition_name = $_REQUEST['condition_name'];
    $condition_value = $_REQUEST['condition_value'];
	
    $size = $_FILES["photo-path"]['size'];
    $type = $_FILES["photo-path"]['type'];
    $picture = $_FILES["photo-path"]['name'];
    $prefix = substr(md5(uniqid(rand())),0,6);
    

    foreach($_FILES as $key => $value){
        foreach ($value as $llave => $val){
            if($llave=="name"){  $picture = $val;      }
            if($llave=="type"){  $type = $val;      }
            if($llave=="size"){  $size = $val;      }
            if($llave=="tmp_name"){ $binary = $val;}
        }
    }
    
    if($picture==''){echo "{success: false, message: 'no recibimos archivo'}";}

    if ($picture != "" && $server !="" && $database !="" && $table !="" && $file_name !="" && $condition_name !="" && $condition_value !="") {

    $carpetas= "";
	check_directory($carpetas ."uploads/" .$server);
	check_directory($carpetas ."uploads/" .$server."/" .$database);
	check_directory($carpetas ."uploads/" .$server."/" .$database ."/" .$table);

	if($file_value==''){
			   $file_name = $prefix.$picture;
               $destino = "uploads/" .$server."/" .$database ."/" .$table."/".$file_name;
	}else{
		$file_name = $prefix.$file_value;
		$destino = $carpetas."uploads/" .$server."/" .$database ."/" .$table."/".$file_name;
	}
        if (move_uploaded_file($binary,$destino)) {
            chmod($destino,0777);
            $status = "'Done!'";
        } else {
            echo "{success: false, message: 'failed uploading file (*)', file:'$destino'}";
            $status = "'failed uploading file (*)'";
            exit();
        }
    } else {        
         echo "{success: false, message: 'failed uploading file (**)', file:'$destino'}";
        $status = "'failed uploading file (**)'";
        exit();
    }
    echo "{success: true, message: 'file uploaded correctly!! file name:', file:'$file_name'}";
    exit();
}else{
    echo "file not uploaded";
}
function check_directory($dir){
 if(!is_dir($dir)){
	 mkdir($dir);
 }
}
?>