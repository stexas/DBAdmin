<?

function _set_databases_list($databases){
			if($databases=='All'){
			//DatabaseList
			//e.g.: $databases ="('database1','database2')";	
			$databases ="()";
		}else{
			$databases_list = explode(",",$databases);
			
			$databases = "(";	
			$i=0;
			$total = count($databases_list)-1;
			foreach($databases_list as $database_item){
				$databases .= "'$database_item'";
				if($i<$total){
					$databases .= ",";
				}
				$i++;				
			}
			$databases .= ")";	
		}
		return $databases;
}


?>