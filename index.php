<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    
    <link rel="stylesheet" type="text/css" href="ext/resources/css/ext-all.css" />
    <link rel="stylesheet" type="text/css" href="dbadminsql.css" />
    <link rel="stylesheet" type="text/css" href="fileuploadfield.css"/>

 
    <title>DbAdmin</title>
    
    <style type="text/css">
#loading-mask{
        position:absolute;
        left:0;
        top:0;
        width:100%;
        height:100%;
        z-index:20000;
        background-color:white;
    }
    #loading{
        position:absolute;
        left:45%;
        top:40%;
        padding:2px;
        z-index:20001;
        height:auto;
    }
    #loading a {
        color:#225588;
    }
    #loading .loading-indicator{
        background:white;
        color:#444;
        font:bold 18px tahoma,arial,helvetica;
        padding:10px;
        margin:0;
        height:auto;
    }
    #loading-msg {
        font: normal 10px arial,tahoma,sans-serif;
    }
	.x-grid3-hd-row td.ux-filtered-column {   
        font-style: italic;  
        font-weight: bold;
    }	
</style>
</head>
<body>
<?
require_once('config.php');
require_once('include/functions.php');


if(!isset($_SESSION['user_verificated']) || $_SESSION['user_verificated']!='yes'){
	header("Location: login.php");
}
?>
<div id="loading-mask" style=""></div>
<div id="loading">
    <div class="loading-indicator">
    <img src="i/loading.gif" width="41" height="39" style="margin-right:8px;float:left;vertical-align:top;"/>
    <span style="color: #003399;">Admin</span><span style="color: #3AAF00;">SQL</span><br /><span id="loading-msg">Loading styles and images...</span>
    </div>
</div>

    <script type="text/javascript">document.getElementById('loading-msg').innerHTML = 'Loading ExtJS Core API...';</script>    
    <script type="text/javascript" src="ext/adapter/ext/ext-base.js"></script>
    <script type="text/javascript">document.getElementById('loading-msg').innerHTML = 'Loading ExtJS UI Components...';</script>
    <script type="text/javascript" src="ext/ext-all.js"></script>
    
    <!-- Common Styles for the examples -->
    <link rel="stylesheet" type="text/css" href="ext/examples/samples.css" />
    
    <script type="text/javascript" src="ext/examples/form/FileUploadField.js"></script>
	<script type="text/javascript" src="ext/examples/grid-filtering/menu/EditableItem.js"></script>
    
    
	<script type="text/javascript">document.getElementById('loading-msg').innerHTML = 'Initializing...';</script>
        
    <script type="text/javascript" src="js/hl/hlsql.js"></script>
    
    <script type="text/javascript" src="js/app.js"></script>
    <script type="text/javascript" src="js/DBADMIN.DBTree.js"></script>
    <script type="text/javascript" src="js/DBADMIN.DBTable.js"></script>
    
    <script type="text/javascript" src="js/DBADMIN.GridTextEditor.js"></script>
    
    <script type="text/javascript" src="js/DBADMIN.SqlQuery.js"></script>
    <script type="text/javascript" src="js/DBADMIN.EditorSqlGridPanel.js"></script>
    <script type="text/javascript" src="js/DBADMIN.Monitor.js"></script>
    <script type="text/javascript" src="js/DBADMIN.About.js"></script>
    
   
    <script type="text/javascript" src="js/DBADMIN.GridUploadEditor.js"></script>
    


</body>
</html>