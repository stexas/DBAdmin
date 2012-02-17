<?php
require_once('config.php');

//Here we can configure as many servers as we want. 
global $server,$server_user,$server_pass;
global $server_slin,$server_user_slin,$server_pass_slin;
    $this->servers = array(
                  $server   => array('text' => 'nixiweb', 'host' => $server, 'port' => '3306',
                                       'user' => $server_user, 'pass' => $server_pass,
                                       'init' => "SET NAMES 'utf8'"),
				  $server_slin =>  array('text' => 'another_server', 'host' => $server_slin, 'port' => '3306',
                                       'user' => $server_user_slin, 'pass' => $server_pass_slin,
                                       'init' => "SET NAMES 'utf8'")
				 );
?>