<?php
require_once('config.php');
require_once('include/functions.php');

//user_tables it is a var session which contains the permitted tables for the current user, if the var is empty then we give access to all the tables.

if(isset($_SESSION['user_tables'])){ $user_tables = $_SESSION['user_tables']; }


if(!isset($_SESSION['user_verificated']) || $_SESSION['user_verificated']!='yes'){
	header("Location: login.php");
        exit();
}

/*
    DBADMIN - Web based MySql Manager
    Copyright (C) 2012  Salvador Gómez <salvador_gj@hotmail.com>  (http://www.stexas.es/)

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
global $databases;

$obj = new DBADMIN();
$obj->init();
$obj->main();


//-------------------------------------------------------------------------------------------------------------------------------------
class DBADMIN {

public function init() {
    require 'servers.php';
}

//-------------------------------------------------------------------------------------------------------------------------------------
public function main() {
	global $databases;
        if(isset($_POST['debugSQL'])){$this->isDebugSQL  = $_POST['debugSQL'];}
        if(isset($_REQUEST['debugSQL'])){$this->isDebugSQL  = $_REQUEST['debugSQL'];}
        $this->debugSQL = array();
        $this->is_admin = false;

        if(isset($_SESSION['is_admin'])){ $this->is_admin = $_SESSION['is_admin']; }
    
        if(isset($_POST['cmd'])){$cmd  = $_POST['cmd'];}
	if(isset($_REQUEST['cmd'])){$cmd = $_REQUEST['cmd'];}
        
	switch ($cmd) {
		case 'getMainTree': 
			$this->getMainTree();
			break;
		case 'getTableMeta': 
			$this->getTableMeta();    // Columns & Indexes for Browse/Edit Grid
			break;
		case 'fetchTableRows':
			$this->fetchTableRows();    // Table rows
			break;
                case 'execQuery':
                        $this->execQuery();
                        break;
                case 'execMultiQuery':
                        $this->execMultiQuery();
                        break;
                case 'debugQuery':
                        $this->debugQuery();
                        break;            
		case 'treeDelNodes':
			$this->treeDelNodes();
			break;
		case 'tblDelRow':
			$this->tblDelRow();
			break;
		case 'tblSaveRows':
			$this->tblSaveRows();
			break;
                case 'getForeignCombo':
                        $this->_getTbForeignKey_info();
                        break;
                case 'getTableFilter':
                        $this->_getTableFilter();
                        break;
                case 'getTableSearch':
                        $this->_getTableFilterSearch();
                        break;
                case 'getComboFields':
                        $this->_getComboFields();
                        break;
		default: 
			echo 'Unrecognized Command !!!';
			break;
	}
}
//-------------------------------------------------------------------------------------------------------------------------------------
function _getComboFields(){
    
    $this->_serverConnect($_POST['serverId']);
    $dbh = $this->dbh;

    
    $r = array();
    $r['msg'] = array(); // warnings & errors
    $r['errors'] = 0;
    $r['warnings'] = 0;
    $r['debugSQL'] = &$this->debugSQL;

    if ($_POST['dbName']) {
        $db = $_POST['dbName'];
        if (! get_magic_quotes_gpc()) { $db = addslashes($db); }
        $dbh->select_db($db);
        $r['initDbName'] = $db;  // when user didn't specified the DB in SELECT, use the default one
    }
    
    $dbName     = $_POST['dbName'];
    $tblName    = $_POST['tblName'];
    
    $st = "SELECT COLUMN_NAME AS name 
            FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='$dbName' AND TABLE_NAME='$tblName'";

    $result = $this->dbh->query($st);
    $i=0;
    if($result){	
	while($row = $result->fetch_array()){
            $data['data'][$i]['id'] = $row['name'];
            $data['data'][$i]['value'] = $row['name'];
            $i++;
        }
        echo json_encode($data);
    }
    
}
//-------------------------------------------------------------------------------------------------------------------------------------
public function _getTableFilterSearch() {
$this->_serverConnect($_POST['serverId']);
    $dbh = $this->dbh;

    $this->mode = $_POST['mode'];   // [table, query]
    
    $r = array();
    $r['msg'] = array(); // warnings & errors
    $r['errors'] = 0;
    $r['warnings'] = 0;
    $r['debugSQL'] = &$this->debugSQL;

    if ($_POST['dbName']) {
        $db = $_POST['dbName'];
        if (! get_magic_quotes_gpc()) { $db = addslashes($db); }
        $dbh->select_db($db);
        $r['initDbName'] = $db;  // when user didn't specified the DB in SELECT, use the default one
    }
    
    if ($this->mode == 'tableFiltered') {
        $r['dbName'] = $db;
        $r['tblName'] = $_POST['tbl'];
        
        $this->tblName = $_POST['tbl'];
        $tbl = '`' . $this->tblName . '`';        
        $cols = $_POST['cols'] or '*';
        $limit = $_POST['limit'] or 20;
        
        $value  = $_POST['valor'];
        $type   = "";
        $field  = $_POST['fieldName'];
        
         // COUNT(*) FROM tblName
        $stCount = 'SELECT COUNT(*) AS total FROM ' . $this->tblName;
        
        $st = "SELECT $cols FROM $tbl";
                    switch ($type){
                case 'numeric':
                            $st .= " where $field = '$value' ";
                            $stCount .= " where $field = '$value' ";
                            break;
                case 'string':
                            $st .= " where $field like '%$value%' ";
                            $stCount .= " where $field like '%$value%' ";
                            break;
                case 'date':
                            $st .= " where $field like '$value%' ";
                            $stCount .= " where $field like '$value%' ";
                            break;
                default:
                            $st .= " where $field like '%$value%' ";
                            $stCount .= " where $field like '%$value%' ";
                            break;
            }
            
        $st .= "";
       
        $result = $dbh->query($stCount);
        $row = $result->fetch_assoc();
        $r['rowCount'] = $row['total'];

    } 
    // Returns TRUE on success or FALSE on failure. For SELECT, SHOW, DESCRIBE or EXPLAIN mysqli_query() will return a result object. 
    $result = $dbh->query($st);
    $this->logSql($st, 4);
    
    // SQL failed
    if ($result === false) {
        $this->_appendSqlWarnings($dbh, $r);
        echo json_encode($r);
        return;
    }

    // append SHOW WARNINGS to the response (SHOW WARNINGS also shows Errors and Notes)
    if ($dbh->warning_count) { 
        $this->_appendSqlWarnings($dbh, $r);
    }
    
    // SQL didn't return a result set
    if ($result === true) {
        $r['affectedRows'] = $dbh->affected_rows;
        $r['isAffected'] = true;
        echo json_encode($r);
        return;
    } 
    
	$this->_fetchExecResult($dbh, $result, $r, $st, false);
    
    echo json_encode($r);
}
//-------------------------------------------------------------------------------------------------------------------------------------
public function _getTableFilter() {
        if(isset($_POST['serverId'])){$serverId  = $_POST['serverId'];}
	if(isset($_REQUEST['serverId'])){$serverId = $_REQUEST['serverId'];}
	$this->_serverConnect($serverId);
	$dbh = $this->dbh;
        
        if(isset($_POST['dbName'])){$dbName  = $_POST['dbName'];}
	if(isset($_REQUEST['dbName'])){$dbName = $_REQUEST['dbName'];}
        
        if(isset($_POST['tbl'])){$tblName  = $_POST['tbl'];}
	if(isset($_REQUEST['tbl'])){$tblName = $_REQUEST['tbl'];}
		
	$r = array();
	$cdf = array(); // Columns Defaults Values
	
	$st = "SELECT COLUMN_NAME AS name, COLUMN_DEFAULT AS df, IS_NULLABLE AS isnl, DATA_TYPE AS dt, CHARACTER_MAXIMUM_LENGTH AS maxl, " .
		  "COLUMN_TYPE AS ct, COLUMN_KEY AS ck, EXTRA AS ext " .
		  "FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='$dbName' AND TABLE_NAME='$tblName'";
	
    if ($this->isDebugSQL) { $this->debugSQL[] = $st; }
    
	$colAry = array();
	$result = $this->dbh->query($st);
        $alternativa ='{"filters":[';
	while ($row = $result->fetch_assoc()) { 
            $type = $this->_dtToFilter($row['dt']);
            $dataIndex = $row['name'];
            
            $alternativa .="{type:'".$type."'";
            $alternativa .=",dataIndex:'" .$dataIndex ."'},";
		$cdf[]['dataIndex'] = $row['name'];
                $cdf[]['type'] = $this->_dtToFilter($row['dt']);
		$colAry[] = $row;
	}
        $alternativa = substr($alternativa, 0, -1);
        $alternativa .=']}';
	$result->free();
	

	$r['filters'] = $cdf;
       
        echo $alternativa;
}
private function _dtToFilter($dt){
   $devolver = "string";
              switch ($dt){
                case 'int':
                case 'float':
                case 'money':
                            $devolver = "numeric";
                            break;
                case 'varchar':
                case 'text':
                            $devolver = "string";
                            break;
                case 'datetime':
                            $devolver = "date";
                            break;
                default:
                            $devolver = "string";
                            break;
            }
return $devolver;
    
}
//-------------------------------------------------------------------------------------------------------------------------------------
//  determine the default value of a column
//  http://dev.mysql.com/doc/refman/5.0/en/data-type-defaults.html
public function _getImplicitDefaultValue(&$col) {
	$ct = $col['ct'];
	if (strpos($ct, 'int') || in_array($ct, array('decimal', 'numeric', 'decimal', 'bit', 'float', 'real', 'double'))) {
		return 0;
	} else if (strpos($ct, 'char') || strpos($ct, 'binary') || $ct == 'set' || strpos($ct, 'text') || strpos($ct, 'blob')) {
		return '';
	} else if ($ct == 'date') {
		// return '1970-01-01';
        return '0000-00-00';
	} else if ($ct == 'datetime') {
        // return '1970-01-01 00:00:00';
        return '0000-00-00 00:00:00';
	} else if ($ct == '$year') {
		return '0000';
	} else if ($ct == 'enum') {
		$t = $col['ctl'];   // enum('a','b','c')
		$k1 = strpos($t, "'") + 1;
		$k2 = strpos($t, "'", $k1);
		return substr($t, $k1, $k2 - $k1);
	} else {
		return '';
	}
}
//-------------------------------------------------------------------------------------------------------------------------------------
public function execMultiQuery() {
    $this->_serverConnect($_POST['serverId']);
    $dbh = $this->dbh;

    $r = array();
    $r['msg'] = array(); // warnings & errors
    $r['errors'] = 0;
    $r['warnings'] = 0;
    $r['affectedRows'] = 0;
    $r['debugSQL'] = &$this->debugSQL;
    
    if ($_POST['dbName']) {
        $db = $_POST['dbName'];
        if (! get_magic_quotes_gpc()) { $db = addslashes($db); }
        $dbh->select_db($db);
        $r['dbName'] = $db;  // when user specified the db (SELECTs without dbName)
    }
    
    $st = $_POST['sql'];
    
    if ($dbh->multi_query($st)) {
        do {
          $result = $dbh->store_result();
          
          // do we have a result set?
          if ($result) {
              // only the last result set will be sent back to the client
              unset($r['rows'], $r['metaData'],$r['filterData']);
              
              $this->_fetchExecResult($dbh, $result, $r, '', true);
          } else if ($dbh->affected_rows) {
              $r['isAffected'] = true;
              $r['affectedRows'] += $dbh->affected_rows;
          }
          
          if ($dbh->warning_count) { 
              $r['warnings'] += $dbh->warning_count;
              // we can't execut SHOW WARNINGS in the middle of a multi_query, 
              // ... waiting for the mysqli->get_warnings implementation: http://md.php.net/manual/en/mysqli.get-warnings.php
              // $this->_appendSqlWarnings($dbh, $r); 
          }
        } while ($dbh->next_result()); 
    }
    
    if ($dbh->warning_count) { 
        $this->_appendSqlWarnings($dbh, $r);
    }

    echo json_encode($r);
}
//-------------------------------------------------------------------------------------------------------------------------------------
public function execQuery() {
    $this->_serverConnect($_POST['serverId']);
    $dbh = $this->dbh;

    $this->mode = $_POST['mode'];   // [table, query]
    
    $r = array();
    $r['msg'] = array(); // warnings & errors
    $r['errors'] = 0;
    $r['warnings'] = 0;
    $r['debugSQL'] = &$this->debugSQL;

    if ($_POST['dbName']) {
        $db = $_POST['dbName'];
        if (! get_magic_quotes_gpc()) { $db = addslashes($db); }
        $dbh->select_db($db);
        $r['initDbName'] = $db;  // when user didn't specified the DB in SELECT, use the default one
    }
    
    if ($this->mode == 'table') {
        $r['dbName'] = $db;
        $r['tblName'] = $_POST['tbl'];
        
        $this->tblName = $_POST['tbl'];
        $tbl = '`' . $this->tblName . '`';        
        $cols = $_POST['cols'] or '*';
        $limit = $_POST['limit'] or 20;
        
        
        // COUNT(*) FROM tblName
        $st = 'SELECT COUNT(*) AS total FROM ' . $this->tblName;
        $result = $dbh->query($st);
        $row = $result->fetch_assoc();
        $r['rowCount'] = $row['total'];

        $st = "SELECT $cols FROM $tbl LIMIT $limit";
    } else {
        $st = $_POST['sql'];
    }
    
    // Returns TRUE on success or FALSE on failure. For SELECT, SHOW, DESCRIBE or EXPLAIN mysqli_query() will return a result object. 
    $result = $dbh->query($st);
    $this->logSql($st, 4);
    
    // SQL failed
    if ($result === false) {
        $this->_appendSqlWarnings($dbh, $r);
        echo json_encode($r);
        return;
    }

    // append SHOW WARNINGS to the response (SHOW WARNINGS also shows Errors and Notes)
    if ($dbh->warning_count) { 
        $this->_appendSqlWarnings($dbh, $r);
    }
    
    // SQL didn't return a result set
    if ($result === true) {
        $r['affectedRows'] = $dbh->affected_rows;
        $r['isAffected'] = true;
        echo json_encode($r);
        return;
    } 
    
	$this->_fetchExecResult($dbh, $result, $r, $st, false);
    
    echo json_encode($r);
}
//-------------------------------------------------------------------------------------------------------------------------------------
private function _fetchExecResult($dbh, $result, &$r, $st, $multi) {
    
    $resFields = $result->fetch_fields();
    
    // only simple queries can be LIVE
    if ($multi) {
        $r['live'] = false;
    } else {
        // based on sql query & result fields determine if the query is 'editable'
        // Note: the result should have a set of fields that represent a unique key
        $this->_LiveQueryCheck($dbh, $r, $st, $resFields);
        
    }
    $this->_createQueryMetaData($dbh, $r, $resFields);
    
    // fetch resutls
    if ($this->mode != 'table') {
        $r['rowCount'] = $result->num_rows;
    }
    
    $data = array();
	while ($row = $result->fetch_assoc()) { 
		$data[] = $row;
	}
    $r['rows'] = $data;
    
    // in some cases, for ex: "SHOW COLUMNS FROM viewName"  where viewName is a VIEW
    // the 'orgname' and 'name' properties of $result->fetch_fields() are not correct:
    // the 'orgname' is not as the same as data returned using $result->fetch_assoc()
    $this->_fixStoreFieldNames($r);
    
    $result->free();
}
//-------------------------------------------------------------------------------------------------------------------------------------
private function _fixStoreFieldNames(&$r) {
    if (! $r['rowCount']) {return;}
    $rec = $r['rows'][0];
    foreach ($r['metaData']['fields'] as &$field) {
        $t = $field['name'];
        // property_exists
        // if(!array_key_exists($rec, $t)) { $field['name'] = $field['header']; }
        if(!array_key_exists($t, $rec)) { $field['name'] = $field['header']; }
    }
}
//-------------------------------------------------------------------------------------------------------------------------------------
private function _createQueryMetaData($dbh, &$r, &$resFields) {
    $meta = array();
    $filter_data = array();
    $meta['totalProperty'] = 'rowCount';
    $meta['root'] = 'rows';
    $meta['defaultSortable'] = true;
    
    if ($r['live']) {
        $tblCols = $this->_getTableMeta($dbh, $r);
    }
    
    $filter_data['filters']= array();
    $meta['fields'] = array();
    foreach ($resFields as $d) {
        $col = array();
        $col2 = array();
        
        $col['header'] = $d->name;
        
        // is this a real column or a calculated one
        if ($d->orgname) {
            $col['name'] = $d->orgname;            
            $col['_calculated'] = false;
        } else {
            $col['name'] = $d->name;
            $col['_calculated'] = true;
        }
        $col2['dataIndex']= $col['name'];
        
        // add more details about result columns: defaulValue, type, _ct(ColumnType), _ctl(ColumnTypeLong)
        if ($r['live']) {
            $t = $tblCols[ $col['name'] ]; //  $r['columns'][ $col['name'] ];
            
            $this->_setupCol($col, $d);
            
            if ($col['_calculated']) {
                $col['type'] = $this->intSqlType2extType($d->type);
                $col2['type'] = $this->sqlType2extFILTERType($d->type);
            } else {
                $col['type'] = $this->sqlType2extType($t['ct']);
                $col2['type'] = $this->sqlType2extFILTERType($t['ct']);
                if ($t['ct'] == 'timestamp' || $t['ext'] == 'auto_increment') {
                    $col['defaultValue'] = null;
                } else {
                    $col['defaultValue'] = $t['df'];
                }
                $col['_ct'] = $t['ct'];
                $col['_ctl'] = $t['ctl'];
            }
        } else {
            $this->_setupCol($col, $d);
        }
        if ($col['type'] == 'date') { $col['dateFormat'] = 'Y-m-d'; }
        //$col2['type'] = $col['type'];
        
        
        $meta['fields'][] = $col;
        $meta['filters'][] = $col2;
        //$filter_data['filters'][]= $col2;
    }
    
    
    // for Live queries, the Record should have the definition of all table columns
    // to properly set default values when new rows are added and 
    // to find the newly added row in the DB 
    if ($r['live']) {
        $missingCols = array_diff($r['tblCols'], $r['rCols']);
        foreach ($missingCols as $d) {
            $t = $tblCols[ $d ];
            
            $col = array();
            $col2 = array();
            
            $col['name'] = $d;
            $col2['dataIndex']= $col['name'];
            $col['_calculated'] = false;
            $col['type'] = $this->sqlType2extType($t['ct']);
            $col2['type'] = $this->sqlType2extFILTERType($t['ct']);
            $col['defaultValue'] = $t['df'];
            $col['_ct'] = $t['ct'];
            $col['_ctl'] = $t['ctl'];
            
            $meta['fields'][] = $col;
            $meta['filters'][] = $col2;
        }
        
    }
    
    $r['metaData'] = $meta;

}
//-------------------------------------------------------------------------------------------------------------------------------------
private function _getTableMeta($dbh, &$r) {
	$dbName = $r['dbName'];
	$tblName = $r['tblName'];

	$st = "SELECT COLUMN_NAME AS name, COLUMN_DEFAULT AS df, IS_NULLABLE AS isnl, DATA_TYPE AS ct, CHARACTER_MAXIMUM_LENGTH AS maxl, " .
		  "COLUMN_TYPE AS ctl, COLUMN_KEY AS ck, EXTRA AS ext " .
		  "FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='$dbName' AND TABLE_NAME='$tblName'";

	$columns = array();  // Table Columns
  	$colDefaults = array(); // Columns Default Values
	
    $result = $dbh->query($st);
    $this->logSql($st, 3);
    
    $tblCols = array();    
    while ($row = $result->fetch_assoc()) { 
		if ($row['ext'] == 'auto_increment') {
			$r['autoIncCol'] = $row['name'];  // this table has an auto_increment column
            // !!! we should also check if the auto_inc col is present in query result fields
            // if not ... the Live should be set to false :(
		}
		
		// auto_inc and timestamp columns doesn't have fixed default values
		if ($row['ext'] != 'auto_increment' && $row['ct'] != 'timestamp') {
			
			if (is_null($row['df']) && $row['isnl'] == 'NO') {
				// set implicit default value
				$colDefaults[ $row['name'] ] = $this->_getImplicitDefaultValue($row);
			} else {
				$colDefaults[ $row['name'] ] = $row['df'];
			}
            $row['df'] = $colDefaults[ $row['name'] ];
			
			if ($row['ct'] != 'date') { $row['df'] = $colDefaults[ $row['name'] ]; }
		}
		
		$columns[ $row['name'] ] = $row;
        $tblCols[] = $row['name'];
	}
	$result->free();

    $r['colDefaults'] = $colDefaults;
    $r['tblCols'] = $tblCols; // ALL table columns 
    
    
    return $columns;
    // $r['columns'] = $columns;
	
}
//-------------------------------------------------------------------------------------------------------------------------------------
//  check if the query is 'editable',
//  if yes, determine the 'dbName' and 'tblName'
private function _LiveQueryCheck($dbh, &$r, $st, &$resFields) {
    // Check Nr1: are all fields from the same Table ?
    
    $tblName = '';
    $r['live'] = false;
    
    // a query can be live if the response columns a from single table only
    $rCols = array();
    foreach ($resFields as $d) { 
        if ($d->table && $tblName && ($d->table != $tblName)) { return; }
        if ($d->table) { $tblName = $d->table; }
        
        // is this a real table column ?
        if ($d->orgname) { $rCols[] = $d->orgname; }
    }
    
    // the select statement didn't use a table at all
    if (!$tblName) {return; }
    
    if ($this->mode == 'query') { 
        $r['dbName'] = $this->_extractDbName($r, $st, $tblName);
        if (! $r['dbName']) { return; }
        $r['tblName'] = $tblName;
    }
    
    // Check Nr2: search results has fields of a unique index?
    $idxCols = $this->_getTblUniqueIdx($dbh, $r['dbName'], $r['tblName']);
    if (!$idxCols) { return; }  // in the future, add ALL columns if st == 'SELECT * FROM'
  
    // correctly handle multiple instances of a column: 'SELECT id, title, id FROM ...'
    $rCols = array_unique($rCols);

    // ALL $idxCols should be in the result set
    if (count($idxCols) != count(array_intersect($rCols, $idxCols))) { return; }
    
    $r['uniqueIndex'] = $idxCols;
    $r['rCols'] = $rCols;   // real table columns from result set
    $r['live'] = true;
}
//-------------------------------------------------------------------------------------------------------------------------------------
private function _extractDbName(&$r, $st, $tblName) {
    if (preg_match("/\sfrom\s+`([^`.]+?)`\.`?$tblName`?\s?/i", $st, $matches)) { return $matches[1]; }
    if (preg_match("/\sfrom\s+([^\s]+?)\.`?$tblName`?\s?/i", $st, $matches)) { return $matches[1]; }
    return $r['initDbName'];
}
//-------------------------------------------------------------------------------------------------------------------------------------
//  returns an array of tblColumns
private function _getTblUniqueIdx($dbh, $dbName, $tblName) {

	// fetch Table Indexes and search for a UNIQUE index with a minimum number of columns
	// PRIMARY index will be used even if it has more columns than a simple UNIQUE index
	$st = "SELECT INDEX_NAME, GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS idxColumns, " .
		  "MIN(NON_UNIQUE) AS idxNonUnique, COUNT(*) AS colTotal FROM INFORMATION_SCHEMA.STATISTICS " .
		  "WHERE TABLE_SCHEMA='$dbName' AND TABLE_NAME='$tblName' AND NON_UNIQUE=0 " .
		  "GROUP BY INDEX_NAME ORDER BY colTotal DESC";
	$result = $dbh->query($st);
    $this->logSql($st, 3);
    
	$idxCols = '';
	while ($row = $result->fetch_assoc()) { 
		if (! $idxCols) { $idxCols = $row['INDEX_NAME']; }
		if ($row['INDEX_NAME'] == 'PRIMARY') {
			$idxCols = $row['idxColumns'];
			break;
		}
	}
    $result->free();
	
    // if there are no unique indexes, use ALL fields as the index
    if ($idxCols) { 
        $a = explode(',', $idxCols);
    } else {
        $st = "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='$dbName' AND TABLE_NAME='$tblName'";
        $result = $dbh->query($st);
        $this->logSql($st, 3);
        
        $a = array();
        while ($row = $result->fetch_assoc()) { 
            $a[] = $row['COLUMN_NAME'];
        }
        $result->free();
        // return null; 
    }
    
    return $a;
}
//-------------------------------------------------------------------------------------------------------------------------------------
// http://dev.mysql.com/doc/refman/5.0/en/show-warnings.html
private function _appendSqlWarnings($dbh, &$r) {
//     try {
    $this->logSql('SHOW WARNINGS', 5);
    $result = $dbh->query('SHOW WARNINGS');
    if ($result === false) { 
        error_log($dbh->error);
        error_log(json_encode(debug_backtrace()));
        return; 
    }
    
	while ($row = $result->fetch_assoc()) { 
		$r['msg'][] = $row;
        
        if ($row['Level'] == 'Warning') { 
            $r['warnings']++; 
        } else if ($row['Level'] == 'Error') {
            $r['errors']++; 
        } else {
            // Notes are treated as Warnings
            $r['warnings']++;
        }
	}
	$result->free();
}
//-------------------------------------------------------------------------------------------------------------------------------------
public function getTableMeta() {
	$this->_serverConnect($_POST['serverId']);
	$dbh = $this->dbh;
	$dbName = $_POST['db'];
	$tblName = $_POST['tbl'];
		
	$r = array();
	$cdf = array(); // Columns Defaults Values
	
	$st = "SELECT COLUMN_NAME AS name, COLUMN_DEFAULT AS df, IS_NULLABLE AS isnl, DATA_TYPE AS dt, CHARACTER_MAXIMUM_LENGTH AS maxl, " .
		  "COLUMN_TYPE AS ct, COLUMN_KEY AS ck, EXTRA AS ext " .
		  "FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='$dbName' AND TABLE_NAME='$tblName'";

	
    if ($this->isDebugSQL) { $this->debugSQL[] = $st; }
    
	// fetch Table Columns
	$colAry = array();
	$result = $this->dbh->query($st);
	while ($row = $result->fetch_assoc()) { 
		if ($row['ext'] == 'auto_increment') {
			$r['aiColumn'] = $row['name'];  // this table has an auto_increment column
		}
		
		// auto_inc and timestamp columns doesn't have fixed default values
		if ($row['ext'] != 'auto_increment' && $row['dt'] != 'timestamp') {
			
			if (is_null($row['df']) && $row['isnl'] == 'NO') {
				// set implicit default value
				$cdf[ $row['name'] ] = $this->_getImplicitDefaultValue($row);
			} else {
				$cdf[ $row['name'] ] = $row['df'];
			}
                        //for foreigns fields --- eg. country_id clave foreign key of id in a country table.
			if(strtolower($row['ck'])=='mul'){
                            //$this->_getTbForeignKey_info($dbName, $tblName, $colName);
                            $row['tabla_referencia'] ='ok';
                        }else{
                            $row['tabla_referencia'] ='vacia';
                        }
			if ($row['dt'] != 'date') { $row['df'] = $cdf[ $row['name'] ]; }
		}
		
		$colAry[] = $row;
	}
	$result->free();
	
	// fetch Table Indexes and search for a UNIQUE index with a minimum number of columns
	// PRIMARY index will be used even if it has more columns than a simple UNIQUE index
	$st = "SELECT INDEX_NAME, GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS idxColumns, " .
		  "MIN(NON_UNIQUE) AS idxNonUnique, COUNT(*) AS colTotal FROM INFORMATION_SCHEMA.STATISTICS " .
		  "WHERE TABLE_SCHEMA='$dbName' AND TABLE_NAME='$tblName' AND NON_UNIQUE=0 " .
		  "GROUP BY INDEX_NAME ORDER BY colTotal DESC";
    if ($this->isDebugSQL) { $this->debugSQL[] = $st; }
    $result = $dbh->query($st);
	$idxCols = '';
	while ($row = $result->fetch_assoc()) { 
		if (! $idxCols) { $idxCols = $row['INDEX_NAME']; }
		if ($row['INDEX_NAME'] == 'PRIMARY') {
			$idxCols = $row['idxColumns'];
			break;
		}
	}
	
	// if there are no unique indexes, use ALL fields as the index
	if (! $idxCols) { 
		foreach ($colAry as $row) { $idxCols .= $row['name'] . ','; }
		$idxCols = rtrim($idxCols, ',');
	}
	
	$r['indexes'] = $idxCols;
	$r['columns'] = $colAry;
	$r['cdf'] = $cdf;
	
	echo json_encode($r);
	// echo "{indexes:'$idxCols', columns:" . json_encode($colAry) . '}';	
}
//-------------------------------------------------------------------------------------------------------------------------------------
 /*
 * data from a relational table which is foreign from another one,
 *          eg: Resorts contains a field called country_id
 *              country_id is a field in table countries
 *  tlbName: table containig the foreign key
 *  colName: foreign key
 */
function _getTbForeignKey_info(){
    
    $this->_serverConnect($_POST['serverId']);
    $dbh = $this->dbh;

    
    $r = array();
    $r['msg'] = array(); // warnings & errors
    $r['errors'] = 0;
    $r['warnings'] = 0;
    $r['debugSQL'] = &$this->debugSQL;

    if ($_POST['dbName']) {
        $db = $_POST['dbName'];
        if (! get_magic_quotes_gpc()) { $db = addslashes($db); }
        $dbh->select_db($db);
        $r['initDbName'] = $db;  // when user didn't specified the DB in SELECT, use the default one
    }
    
    $dbName     = $_POST['dbName'];
    $tblName    = $_POST['tblName'];
    $colName    = $_POST['colName'];

    $st = "SELECT TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME,REFERENCED_COLUMN_NAME 
        from  information_schema.KEY_COLUMN_USAGE 
        WHERE 
        KEY_COLUMN_USAGE.TABLE_SCHEMA ='$dbName' AND 
        KEY_COLUMN_USAGE.TABLE_NAME ='$tblName'  AND 
        KEY_COLUMN_USAGE.COLUMN_NAME ='$colName'";
    
    
    if ($this->isDebugSQL) { $this->debugSQL[] = $st; }
    
    $result = $this->dbh->query($st);
	
	while ($row = $result->fetch_assoc()) { 
            $table_name = $row['REFERENCED_TABLE_NAME'];
            $col_id     = $row['REFERENCED_COLUMN_NAME'];
	}
    /* * loading from foreign table **/
    $st = "select * from $table_name";
    
    
    if ($this->isDebugSQL) { $this->debugSQL[] = $st; }
    $result = $this->dbh->query($st);
    $i=0;
    
    if($result){	
	while($row = $result->fetch_array()){
            $data['data'][$i]['id'] = $row[$col_id];
            $data['data'][$i]['value'] = $row[1];
            $i++;
        }
        echo json_encode($data);
    }
}	
//-------------------------------------------------------------------------------------------------------------------------------------
public function tblSaveRows() {
	$this->_serverConnect($_POST['serverId']);
	$dbh = $this->dbh;

    $dbName = $_POST['db'];
    if (! get_magic_quotes_gpc()) { $dbName = addslashes($dbName); }
    $dbh->select_db($dbName);  // we should USE DB because triggers complains (notes): NO database selected

	$data = json_decode($_POST['data']);
	$idxAry = $data->uniqueIndex;
	
	$tbl = '`' . $dbName . '`.`' . $_POST['tbl'] . '`';
	
	$r = array();
	$r['success'] = true;
	$r['errors'] = 0;
    $r['warnings'] = 0;
	$r['msg'] = array();
	
	$r['update'] = array();
    $r['debugSQL'] = &$this->debugSQL; // for SQL Monitor
		
	$r['insert'] = array();
	
	
	// UPDATE rows
    $st = "UPDATE $tbl SET ";
	foreach ($data->update as $d) {
		$t = $st . $this->_rec2mysql($d[1]) . ' WHERE ' . $this->_makeSqlKey($idxAry, $d[0]);
		
        $this->logSql($t, 1);
        if ($dbh->query($t)) {
			$r['update'][$d[1]->_gridId] = 1;
            if ($dbh->warning_count) { 
                $this->_appendSqlWarnings($dbh, $r);
            }
		} else {
			$this->_appendSqlWarnings($dbh, $r);
		}
	}
	
	// INSERT rows
	$st = "INSERT INTO $tbl SET ";
	foreach ($data->insert as $d) {

        $a = array();  // INSERT: the new record: column=value
        $a2 = array(); // SELECT: the same as $a but with "column IS NULL" 
        
		foreach($d as $k => $v) {
            if ($k == '_gridId') { continue; }
		    if (! is_null($v) and ! get_magic_quotes_gpc()) { $v = addslashes($v); }
		    if (is_null($v)) { 
                $a[] = "$k=NULL";
                $a2[] = "$k IS NULL";
            } else { 
                $a[] = "$k='$v'";
                $a2[] = "$k='$v'";
            }
		}
		$t = $st . implode(', ', $a);
		
        // if user specified values for a unique index, 
        // find the newly added record by that index
        $findByIdx = 1;
        $rowIdx = array();
        foreach ($data->uniqueIndex as $idxField) {
            // ALL fields of the unique index should be specified
            if (! property_exists($d, $idxField)) { $findByIdx = 0; break; }
            
            $v = $d->$idxField;
            
            // ... I'm not sure MySql allows NULL in indexed fields
            if (is_null($v)) { 
                $rowIdx[] = "$idxField IS NULL";
            } else {
                $rowIdx[] = "$idxField='$v'";
            }
        }
        
        $this->logSql($t, 1);
        //  if INSERT == OK, fetch the new row
        if ($dbh->query($t)) {
			if ($dbh->warning_count) { 
                $this->_appendSqlWarnings($dbh, $r);
            }
            
            // the table has an AUTO_INCREMENT column ?
			if ($data->autoIncCol) {
			    $lastId = $dbh->insert_id;
				$aiColumn = $data->autoIncCol;
				$t = "SELECT * FROM $tbl WHERE $aiColumn=$lastId";
			} else {
				$t = "SELECT * FROM $tbl WHERE ";
                $t .= $findByIdx ? implode(' AND ', $rowIdx) 
                                 : implode(' AND ', $a2);
			}
			$this->logSql($t, 1);
            $result = $dbh->query($t);
			$row = $result->fetch_assoc();
			
			$r['insert'][$d->_gridId] = $row;
			$result->free();
		} else {
            // return the SQL error message
            $this->_appendSqlWarnings($dbh, $r);
		}
	}
	
	echo json_encode($r);
}
//-------------------------------------------------------------------------------------------------------------------------------------
public function _makeSqlKey(&$idxAry, &$recAry) {
	$st = '';
	$a = array();
	for ($i=0; $i<count($idxAry); $i++) {
		
        $a[] = $recAry[$i] === null ? "$idxAry[$i] IS NULL"
                                    : "$idxAry[$i]='$recAry[$i]'";
	}

	$t = implode(' AND ', $a);
	return $t;
}

//-------------------------------------------------------------------------------------------------------------------------------------
public function _rec2mysql(&$r) {
	$a = array();
	while (list($k, $v) = each($r)) {
		if ($k == '_gridId') { continue; }
		if ($v === null) {
            $a[] = "$k=NULL";
        } else {
            if (! get_magic_quotes_gpc()) { $v = addslashes($v); }
            $a[] = "$k='$v'";
        }
	}
	$t = implode(', ', $a);
	
	return $t;
}

//-------------------------------------------------------------------------------------------------------------------------------------
//  deletes a row 
public function tblDelRow() {
	$this->_serverConnect($_POST['serverId']);
	$data = json_decode($_POST['rec']);
   
	$st = "DELETE FROM `" . $_POST['db'] . '`.`' . $_POST['tbl'] . "` WHERE ";

	$uniqueIdx = $data->uniqueIndex;
    $row = $data->row;
    
    $a = array();
    for($i=0; $i<count($uniqueIdx); $i++) {
        $k = $uniqueIdx[$i];
        $v = $row[$i];
        if ($v === null) { 
            $v = 'NULL'; 
        } else {
            if (! get_magic_quotes_gpc()) { $v = addslashes($v); }
            $v = "'$v'";
        }
        $a[] = "$k=$v";
    }
    
	$st .= implode(' AND ', $a);
	
	$r = array();
	$r['success'] = true;
	$r['errors'] = 0;
    $r['warnings'] = 0;
	$r['msg'] = array();
    $r['debugSQL'] = &$this->debugSQL;
   
	$dbh = $this->dbh;
    
    $this->logSql($st, 1);
	$result = $dbh->query($st);
    if ($result === true) {
        $r['isAffected'] = true;
        $r['affectedRows'] = $dbh->affected_rows;
        if ($dbh->warning_count) { 
            $this->_appendSqlWarnings($dbh, $r);
        }
    } else {
        $this->_appendSqlWarnings($dbh, $r);
        // can't delete row
    }
    
    echo json_encode($r);
}
//-------------------------------------------------------------------------------------------------------------------------------------
public function fetchTableRows() {
	$this->_serverConnect($_POST['serverId']);
	$dbh = $this->dbh;
	
	$tbl = '`' . $_POST['db'] . '`.`' . $_POST['tbl'] . '`';
        if(isset($_POST['start'])){
            $start = $_POST['start'];
        }else{
            $start = 0;
        }
        if(isset($_POST['start'])){
            $limit = $_POST['limit'];
        }else{
            $limit = 20;
        }
	$cols = $_POST['cols'] or '*';
    
	$st = "SELECT $cols FROM $tbl ";
        
        //Filter
        if(isset($_POST['filter'])){            
            $value  = $_POST['filter'][0]['data']["value"];            
            $type   = $_POST['filter'][0]['data']["type"];
            $field  = $_POST['filter'][0]["field"];
            
            switch ($type){
                case 'numeric':
                            $st .= " where $field = '$value' ";
                            break;
                case 'string':
                            $st .= " where $field like '%$value%' ";
                            break;
                case 'date':
                            $st .= " where $field like '$value%' ";
                            break;
                default:
                            $st .= " where $field like '%$value%' ";
                            break;
            }
        }
        
	if (isset ($_POST['sort'])) {
		$st .= ' ORDER BY ' . $_POST['sort'] . ' ' . $_POST['dir'];
	}
	$st .= " LIMIT $start, $limit";

	if (!$result = $dbh->query($st)) {
		echo "{success: false, st: '" . addslashes($st) . "'}";  // cols: '" . addslashes($cols) . "'
		return;
	}
	
	$data = array();
	while ($row = $result->fetch_assoc()) { 
		$data[] = $row;
	}
	$result->free();

	$st = "SELECT COUNT(*) AS total FROM $tbl";
	$result = $dbh->query($st);
	$row = $result->fetch_assoc();
	$total = $row['total'];
	
	echo '{success: true, rowCount:'.$total.',rows:'.json_encode($data).'}';
}
//-------------------------------------------------------------------------------------------------------------------------------------
// populates the main Left Tree
public function getMainTree() {
	$pids = explode('/', $_POST['crumb']);
	
	array_shift($pids);  // remove emtpy item
	array_shift($pids);  // remove 'root' item
	
	switch (count($pids)) {
		case 0:   
			$this->_getMainTree_servers();     // root node: get server list
			break;
		case 1: 
			$this->_getMainTree_db($pids[0]);   // server node: connect & get DB list
			break;
		case 2: 
			$this->_getMainTree_dbFolders($pids);  // common DB folders: tables, views, triggers, functions
			break;
		case 3: 
			$this->_getMainTree_dbContents($pids); // depending on dbFolder: a list of tables, functionc etc
			break;
		case 4: 
			$this->_getMainTree_tblFolders($pids);
			break;
		case 5: 
			$this->_getMainTree_tblContents($pids);
			break;
	}
}
//-------------------------------------------------------------------------------------------------------------------------------------
private function _getMainTree_servers() {
	$r = array ();
	reset($this->servers);
	while (list($key, $d) = each($this->servers)) {
		$a = array('pid' => $key, 'text' => $d['text'], 'iconCls' => 'icon-server');
		array_push($r, $a);
	}
	echo json_encode($r);
}
//-------------------------------------------------------------------------------------------------------------------------------------
private function _getMainTree_db($serverId) {
	global $databases;
	$this->_serverConnect($serverId);
	
	$dbh = $this->dbh;
	$st = 'SELECT * FROM INFORMATION_SCHEMA.SCHEMATA';
	if($_SESSION['user_databases']=="('*')"){
	$st = "SELECT SCHEMATA.CATALOG_NAME, SCHEMATA.SCHEMA_NAME, SCHEMATA.DEFAULT_CHARACTER_SET_NAME,
                SCHEMATA.DEFAULT_COLLATION_NAME, SCHEMATA.SQL_PATH 
               FROM INFORMATION_SCHEMA.SCHEMATA ";
	}else{
	$st = "SELECT SCHEMATA.CATALOG_NAME, SCHEMATA.SCHEMA_NAME, SCHEMATA.DEFAULT_CHARACTER_SET_NAME,
                SCHEMATA.DEFAULT_COLLATION_NAME, SCHEMATA.SQL_PATH 
               FROM INFORMATION_SCHEMA.SCHEMATA 
               where SCHEMATA.SCHEMA_NAME in " .$_SESSION['user_databases'];
	}
    $this->logSql($st, 3);
    $result = $dbh->query($st);    // SHOW DATABASES
	
	$r = array();
	while ($row = $result->fetch_assoc()) { 
		$info = array();
        $info[] = array('k' => 'charset', 'v' => $row['DEFAULT_CHARACTER_SET_NAME']);
        $info[] = array('k' => 'collation', 'v' => $row['DEFAULT_COLLATION_NAME']);
        
        $a = array('pid' => $row['SCHEMA_NAME'], 'text' => $row['SCHEMA_NAME'], 'iconCls' => 'icon-db', '_info' => $info);
		array_push($r, $a);
	}
	$result->free();
	
	echo json_encode($r);
}
//-------------------------------------------------------------------------------------------------------------------------------------
private function _getMainTree_dbFolders($pids) {
	$this->_serverConnect($pids[0]);
	$dbName = $pids[1];
	
    $dbh = $this->dbh;
    
	// count TABLEs
    if($_SESSION['user_tables']!=''){
        $st = "SELECT COUNT(*) AS tblCount FROM INFORMATION_SCHEMA.TABLES WHERE table_schema = '$dbName' AND TABLE_TYPE<>'VIEW' and TABLE_NAME IN " .$_SESSION['user_tables'] .""; // BASE TABLE
    }else{
        $st = "SELECT COUNT(*) AS tblCount FROM INFORMATION_SCHEMA.TABLES WHERE table_schema = '$dbName' AND TABLE_TYPE<>'VIEW'"; // BASE TABLE
    }
	$this->logSql($st, 3);
    $result = $dbh->query($st);	$row = $result->fetch_row(); 
    $tblCount = $row[0];
    $result->free();
    
    // count VIEW's
    $st = "SELECT COUNT(*) AS viewCount FROM INFORMATION_SCHEMA.VIEWS WHERE table_schema = '$dbName'";
	$this->logSql($st, 3);
    $result = $dbh->query($st);	$row = $result->fetch_row(); 
    $viewCount = $row[0];
    $result->free();

    // count FUNCTION's
    $st = "SELECT COUNT(*) AS funcCount FROM INFORMATION_SCHEMA.ROUTINES WHERE ROUTINE_SCHEMA = '$dbName'";
	
    $t = "$st AND ROUTINE_TYPE='FUNCTION'";
    $this->logSql($t, 3);
    $result = $dbh->query($t);
    $row = $result->fetch_row(); 
    $funcCount = $row[0];
    $result->free();
    
    // count PROCEDURE's
    $t = "$st AND ROUTINE_TYPE='PROCEDURE'";
    $result = $dbh->query($t);
    $this->logSql($t, 3);
    $row = $result->fetch_row(); 
    $procCount = $row[0];
    $result->free();

    // count TRIGGERS's
    $st = "SELECT COUNT(*) AS trigCount FROM INFORMATION_SCHEMA.TRIGGERS WHERE TRIGGER_SCHEMA = '$dbName'";
    $this->logSql($st, 3);
    $result = $dbh->query($st);
    $row = $result->fetch_row(); 
    $trigCount = $row[0];
    $result->free();
	
    if($this->is_admin){
        $r = array($this->_createDbChildNode('tables', 'Tables', $tblCount),
                   $this->_createDbChildNode('views', 'Views', $viewCount),
                   $this->_createDbChildNode('procs', 'Stored Procs', $procCount),
                   $this->_createDbChildNode('funcs', 'Functions', $funcCount),
                   $this->_createDbChildNode('trigs', 'Triggers', $trigCount)
                   );
    }else{
        $r = array($this->_createDbChildNode('tables', 'Tables', $tblCount)                   
                   );
    }
	
    echo json_encode($r);
}
//-------------------------------------------------------------------------------------------------------------------------------------
private function _createDbChildNode($pid, $text, $total) {
    $a = array('pid' => $pid);
    
    if ($total) {
        $a['text'] = "$text <span class=\"gr\">[$total]</span>";
    } else {
        $a['text'] = $text;
        $a['leaf'] = true;
        $a['iconCls'] = 'icon-folder';
    }
    
    return $a;
}
//-------------------------------------------------------------------------------------------------------------------------------------
private function _getMainTree_dbContents($pids) {
	$this->_serverConnect($pids[0]);
	
	$type = $pids[2];   // type=[tables,views,procs...]
	$dbName = $pids[1];
	
	$r = array();
	switch ($type) {
		case 'tables':
                    
                        if($_SESSION['user_tables']!=''){
                            $st = "SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE table_schema = '$dbName' AND TABLE_TYPE <> 'VIEW' and TABLE_NAME IN " .$_SESSION['user_tables'] ."";
                        }else{
                            $st = "SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE table_schema = '$dbName' AND TABLE_TYPE <> 'VIEW'";
                        }
			$result = $this->dbh->query($st);
			while ($row = $result->fetch_assoc()) { 
			
				$t = $row['TABLE_NAME']; 
				$a = array('pid' => $row['TABLE_NAME'], 'text' => $t, 'iconCls' => 'icon-tbl2', '_info' => $this->getTableInfo($row)); 
				$r[] = $a;			
			}
			break;
        case 'views':
			$st = "SELECT * FROM INFORMATION_SCHEMA.VIEWS WHERE table_schema = '$dbName'";

			$result = $this->dbh->query($st);
			while ($row = $result->fetch_assoc()) { 
				$t = $row['TABLE_NAME']; 
				$iconCls = $row['IS_UPDATABLE'] == 'YES' ? 'icon-tblview2' : 'icon-tblview_off2';
                
                $a = array('pid' => $row['TABLE_NAME'], 'text' => $t, 'allowChildren' => false, '_info' => $this->getViewInfo($row),
                           'iconCls' => $iconCls, 'leaf' => true);  
				$r[] = $a;
			}
            
            break;
        case 'procs':
            $st = "SELECT * FROM INFORMATION_SCHEMA.ROUTINES WHERE ROUTINE_SCHEMA = '$dbName' AND ROUTINE_TYPE='PROCEDURE'";
            $result = $this->dbh->query($st);
   			while ($row = $result->fetch_assoc()) { 
				$t = $row['ROUTINE_NAME']; 
                $iconCls = 'icon-proc';
                
                $a = array('pid' => $row['ROUTINE_NAME'], 'text' => $t, 'allowChildren' => false, '_info' => $this->getProcInfo($row),
                           'iconCls' => $iconCls, 'leaf' => true);  
				$r[] = $a;
			}
            break;
        case 'funcs':
            $st = "SELECT * FROM INFORMATION_SCHEMA.ROUTINES WHERE ROUTINE_SCHEMA = '$dbName' AND ROUTINE_TYPE='FUNCTION'";
            $result = $this->dbh->query($st);
   			while ($row = $result->fetch_assoc()) { 
				$t = $row['ROUTINE_NAME']; 
                $iconCls = 'icon-func';
                
                $a = array('pid' => $row['ROUTINE_NAME'], 'text' => $t, 'allowChildren' => false, '_info' => $this->getFuncInfo($row),
                           'iconCls' => $iconCls, 'leaf' => true);  
				$r[] = $a;
			}
            break;
        case 'trigs':
            $st = "SELECT * FROM INFORMATION_SCHEMA.TRIGGERS WHERE TRIGGER_SCHEMA = '$dbName'";
            $result = $this->dbh->query($st);
   			while ($row = $result->fetch_assoc()) { 
				$t = $row['TRIGGER_NAME']; 
                $iconCls = $row['ACTION_TIMING'] == 'BEFORE' ? 'icon-flagg' : 'icon-flagr';
                
                $a = array('pid' => $row['TRIGGER_NAME'], 'text' => $t, 'allowChildren' => false, '_info' => $this->getTrigInfo($row),
                           'iconCls' => $iconCls, 'leaf' => true);
				$r[] = $a;
			}
            break;
		default:
			echo 'Unknown type!';
			break;
	}
	if ($result) { $result->free(); }
    
    echo json_encode($r);
}
//-------------------------------------------------------------------------------------------------------------------------------------
private function getTableInfo(&$row) {
    $a = array();
    $a[] = array('k' => 'rows', 'v' => number_format($row['TABLE_ROWS']));
    $a[] = array('k' => 'data', 'v' => bytesConvert($row['DATA_LENGTH']));
    $a[] = array('k' => 'index', 'v' => bytesConvert($row['INDEX_LENGTH']));
    $a[] = array('k' => 'engine', 'v' => $row['ENGINE']);
    $a[] = array('k' => 'rowFormat', 'v' => $row['ROW_FORMAT']);
    $a[] = array('k' => 'created', 'v' => $row['CREATE_TIME']);
    $a[] = array('k' => 'updated', 'v' => $row['UPDATE_TIME']);
    $a[] = array('k' => 'collation', 'v' => $row['TABLE_COLLATION']);
	return $a;
}
//-------------------------------------------------------------------------------------------------------------------------------------
private function getViewInfo(&$row) {
    $a = array();
    $a[] = array('k' => 'check', 'v' => strtolower($row['CHECK_OPTION']));
    $a[] = array('k' => 'updatable', 'v' => strtolower($row['IS_UPDATABLE']));
    $a[] = array('k' => 'security', 'v' => strtolower($row['SECURITY_TYPE']));    
    $a[] = array('k' => 'definer', 'v' => strtolower($row['DEFINER']));
	return $a;
}
//-------------------------------------------------------------------------------------------------------------------------------------
private function getProcInfo(&$row) {
    $a = array();
    $a[] = array('k' => 'deterministic', 'v' => strtolower($row['IS_DETERMINISTIC']));
    $a[] = array('k' => 'dataAccess', 'v' => strtolower($row['SQL_DATA_ACCESS']));    
    $a[] = array('k' => 'created', 'v' => strtolower($row['CREATED']));    
    $a[] = array('k' => 'altered', 'v' => strtolower($row['LAST_ALTERED']));    
    $a[] = array('k' => 'security', 'v' => strtolower($row['SECURITY_TYPE']));        
    $a[] = array('k' => 'definer', 'v' => strtolower($row['DEFINER']));
	return $a;
}
//-------------------------------------------------------------------------------------------------------------------------------------
private function getFuncInfo(&$row) {
    $a = array();
    $a[] = array('k' => 'deterministic', 'v' => strtolower($row['IS_DETERMINISTIC']));
    $a[] = array('k' => 'dataAccess', 'v' => strtolower($row['SQL_DATA_ACCESS']));
    $a[] = array('k' => 'created', 'v' => strtolower($row['CREATED']));    
    $a[] = array('k' => 'altered', 'v' => strtolower($row['LAST_ALTERED']));    
    $a[] = array('k' => 'security', 'v' => strtolower($row['SECURITY_TYPE']));        
    $a[] = array('k' => 'definer', 'v' => strtolower($row['DEFINER']));
	return $a;    
}
//-------------------------------------------------------------------------------------------------------------------------------------
private function getTrigInfo(&$row) {
    $a = array();
    $a[] = array('k' => 'event', 'v' => $row['EVENT_MANIPULATION']);
    $a[] = array('k' => 'table', 'v' => strtolower($row['EVENT_OBJECT_TABLE']));
    $a[] = array('k' => 'timing', 'v' => $row['ACTION_TIMING']);
    $a[] = array('k' => 'definer', 'v' => strtolower($row['DEFINER']));
	return $a;    
}
//-------------------------------------------------------------------------------------------------------------------------------------
private function _getMainTree_tblFolders($pids) {
	$this->_serverConnect($pids[0]);
	
	$dbName = $pids[1];
	$tblName = $pids[3];
	
	$st = "SELECT COUNT(*) AS colTotal FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='$dbName' AND TABLE_NAME='$tblName'";
	$result = $this->dbh->query($st);
	$row = $result->fetch_assoc();
	$colTotal = $row['colTotal'];
	
	$st = "SELECT COUNT(DISTINCT(INDEX_NAME)) AS idxTotal FROM INFORMATION_SCHEMA.STATISTICS " .
		  "WHERE TABLE_SCHEMA='$dbName' AND TABLE_NAME='$tblName'";
	$result = $this->dbh->query($st);
	$row = $result->fetch_assoc();
	$idxTotal = $row['idxTotal'];

	$r = array(array('pid' => 'col', 'text' => 'Columns' . $this->_appendNodeTotal($colTotal)),
			   array('pid' => 'idx', 'text' => 'Indexes' . $this->_appendNodeTotal($idxTotal))
	);
	
    echo json_encode($r);
}
//-------------------------------------------------------------------------------------------------------------------------------------
private function _appendNodeTotal(&$total) {
	if (! $total) { 
		$t = '';
	} else {
		$t = ' <span class="gr">[' . $total . ']</span>';
	}
	return $t;
}
//-------------------------------------------------------------------------------------------------------------------------------------
private function _getMainTree_tblContents($pids) {
	$this->_serverConnect($pids[0]);
	
	$dbName = $pids[1];
	$tblName = $pids[3];
	$type = $pids[4];   // type=[col, idx]	
	
	$r = array();
	switch ($type) {
		case 'col':
			$st = "SELECT COLUMN_NAME, IS_NULLABLE, COLUMN_TYPE, COLUMN_KEY, EXTRA " .
			      "FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='$dbName' AND TABLE_NAME='$tblName'";

			$result = $this->dbh->query($st);
			while ($row = $result->fetch_assoc()) { 
				$t = $row['COLUMN_NAME'] . ' <span class="gr">' . $row['COLUMN_TYPE'];
				if ($row['IS_NULLABLE'] == 'YES') { $t .= ', NULL'; }
				if ($row['EXTRA']) { $t .= ', ' . $row['EXTRA']; }
				$t .= '</span>';
				
				$iconCls = 'icon-col';
				if ($row['COLUMN_KEY']) {
					$iconCls = $row['COLUMN_KEY'] == 'PRI' ? 'icon-idx_pri' : 'icon-idx'; //icon-col_key';
				}
				
				$a = array('pid' => $row['COLUMN_NAME'], 'text' => $t, 'iconCls' => $iconCls, 'leaf' => true);
				array_push($r, $a);
			}
			break;
		case 'idx':
			$st = "SELECT INDEX_NAME, GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS idxColumns, " .
				  "MIN(NON_UNIQUE) AS idxNonUnique, COUNT(*) AS colTotal FROM INFORMATION_SCHEMA.STATISTICS " .
				  "WHERE TABLE_SCHEMA='$dbName' AND TABLE_NAME='$tblName' " .
				  "GROUP BY INDEX_NAME ORDER BY INDEX_NAME";
			$result = $this->dbh->query($st);
			while ($row = $result->fetch_assoc()) { 
				$t = $row['INDEX_NAME'];
				$iconCls = 'icon-idx';
				
				if ($row['INDEX_NAME'] == 'PRIMARY') {
					$iconCls = 'icon-idx_pri';
					$t = "..".$row['idxColumns'];
				} else {
					$t = $row['INDEX_NAME'];
					if ($row['idxColumns'] != $row['INDEX_NAME']) { $t .= ' <span class="gr">' . $row['idxColumns'] . '</span>'; }
					if (! $row['idxNonUnique']) { $iconCls = 'icon-idx_uni'; }
				}
				
				$a = array('pid' => $row['INDEX_NAME'], 'text' => $t, 'iconCls' => $iconCls, 'leaf' => true);
				if ($row['INDEX_NAME'] == 'PRIMARY') {
					array_unshift($r, $a);
				} else {
					array_push($r, $a);
				}
				
			}
			break;
	}

	echo json_encode($r);
}
//-------------------------------------------------------------------------------------------------------------------------------------
public function treeDelNodes() {
    $ary = explode(',', $_POST['crumbs']);
    
    $r = array();
    $r['success'] = true;
    $r['msg'] = array(); // warnings & errors
    $r['debugSQL'] = &$this->debugSQL;
    $r['errors'] = 0;
    $r['warnings'] = 0;
    $r['affectedRows'] = 0;
    $r['deletedNodes'] = array();   // an array of nodeCrumb to be removed from TreePanel at clientside

    for ($i=0; $i<count($ary); $i++) {
        $crumb = $ary[$i];
        $this->_treeDelNode($crumb, $r);
    }
    
    echo json_encode($r);
}
//-------------------------------------------------------------------------------------------------------------------------------------
private function _treeDelNode($crumb, &$r) {
	$pids = explode('/', $crumb);
	array_shift($pids);  // remove emtpy item
	array_shift($pids);  // remove 'root' item

	$this->_serverConnect($pids[0]);
	$dbh = $this->dbh;
    
    $dbName = $pids[1];
	
	$st = '';
    switch (count($pids)) {
		case 2: 
            $st = "DROP DATABASE `$dbName`";
            break;
        case 4:
            $type2mysql = array('tables' => 'TABLE', 'views' => 'VIEW', 'procs' => 'PROCEDURE', 'funcs' => 'FUNCTION', 'trigs' => 'TRIGGER');
            $type = $type2mysql[$pids[2]];   // type=[tables,views,procs,funcs,trigs]
            
            if ($type) {
                $st = "DROP $type `$dbName`.`$pids[3]`";
            }
            
            break;
        case 6:   
			$type = $pids[4];   // type=[col,idx]	
			if ($type == 'col') {
				$st = "ALTER TABLE `$dbName`.`$pids[3]` DROP COLUMN $pids[5]";
			} elseif ($type == 'idx') {
				$st = "ALTER TABLE `$dbName`.`$pids[3]` DROP INDEX $pids[5]";
			}
			break;
	}
    
    // no SQL statement provided, we don't know how to delete this node
    if (!$st) { return; }
    $this->logSql($st, 1);
    
    
    if ($dbh->query($st)) {
        if ($dbh->affected_rows) {
            $r['affectedRows'] += $dbh->affected_rows;
        }
        $r['deletedNodes'][] = $crumb;
    } else {
        $r['success'] = false;  // notify the client that there were errors
    }
    
    if ($dbh->warning_count) { 
        $this->_appendSqlWarnings($dbh, $r);
    }
}
//-------------------------------------------------------------------------------------------------------------------------------------
private function _serverConnect($serverId) {
	// do not connect to the same server twice, check if we are already connected to it
    if (isset($this->_connectedServer) and $this->_connectedServer == $serverId && isset($this->dbh)) return true;
	
	$opt = $this->servers[$serverId];
	if (! isset($opt['port'])) { $opt['port'] = 3306; }
	
	@ $this->dbh = new mysqli($opt['host'], $opt['user'], $opt['pass'], '', $opt['port']);

	if (mysqli_connect_errno()) {
		
		echo mysqli_connect_error();
		exit;
	} else {
		if (!empty($opt['init'])) { $this->dbh->query($opt['init']); }
        
        $this->_connectedServer = $serverId; // remember to which server we are connected
        return true;
	}
}
//-------------------------------------------------------------------------------------------------------------------------------------
public function __construct() {
}
//-------------------------------------------------------------------------------------------------------------------------------------
public function __destruct() {
	if (isset($this->dbh)) { $this->dbh->close(); }
}
//-------------------------------------------------------------------------------------------------------------------------------------
private function _setupCol(&$col, &$field) {
    $col['type'] = $this->intSqlType2extType($field->type);
    $col2['type'] = $this->intSqlType2extfILTERType($field->type);
    $col['_ct'] = 'varchar';
    $col['_maxLen'] = $field->length;
    
    $ft = $field->type;
    $ff = $field->flags;

    if ($ft >= 249 && $ft <= 252) {
        $col['_blob'] = true;
    }
    if ($ff && 32) {
        $col['_unsigned'] = true;
    }
    
    // check if column is part of an index
    $col['tabla_referencia'] ='';
    if ($ff & 2) {
        $col['_key'] = 'pri';
        $col['tabla_referencia'] ='';
        // $col['id'] = 'idx_pri1';
    } else if ($ff & 4) {
        $col['_key'] = 'uni';
        $col['tabla_referencia'] ='';
        // $col['id'] = 'idx1';
    } else if ($ff & 8) {
        $col['_key'] = 'mul';
        $col['tabla_referencia'] ='foranea';
        // $col['id'] = 'idx1';
    }
    
    if ($col['type'] == 'string' && isset($col['_blob'])) {
        $col['_ct'] = 'text';
    }
}
//------------------- MYSQL FLAGS --------------------------------------------------------------
// http://dev.mysql.com/sources/doxygen/mysql-5.1/mysql__com_8h-source.html
/*
NOT_NULL_FLAG   1               Field can't be NULL
PRI_KEY_FLAG    2               Field is part of a primary key 
UNIQUE_KEY_FLAG 4                Field is part of a unique key 
MULTIPLE_KEY_FLAG 8              Field is part of a key 
BLOB_FLAG       16               Field is a blob (deprecated: use field->type to check if BLOB)
UNSIGNED_FLAG   32               Field is unsigned 
ZEROFILL_FLAG   64               Field is zerofill 
BINARY_FLAG     128              Field is binary   
 
The following are only sent to new clients 
ENUM_FLAG       256             field is an enum 
AUTO_INCREMENT_FLAG 512         field is a autoincrement field 
TIMESTAMP_FLAG  1024            Field is a timestamp 
SET_FLAG        2048            field is a set 
NO_DEFAULT_VALUE_FLAG 4096      Field doesn't have default value 
NUM_FLAG        32768            Field is num (for clients) 
*/
//-------------------------------------------------------------------------------------------------------------------------------------
public function sqlType2extType($t) {
    if ((strpos($t, 'int') > -1) || ($t == 'bit')) {
        return 'int';
    } else if ($t == 'float' || $t == 'double' || $t == 'decimal' || $t == 'numeric') {
        return 'float';
    } else if ($t == 'date') {
        return 'date';
    } else {
        return 'string';
    }
}
public function sqlType2extFILTERType($t) {
   
    if ((strpos($t, 'int') > -1) || ($t == 'bit')) {
        return 'numeric';
    } else if ($t == 'float' || $t == 'double' || $t == 'decimal' || $t == 'numeric') {
        return 'numeric';
    } else if ($t == 'date') {
        return 'date';
    } else {
        return 'string';
    }
}
public function _data_combo_foreign(){
    $dataDB = array(  
                array(  
                    "id"=>1,  
                    "value"=>"English"
                ),  
                array(  
                    "id"=>2,  
                    "value"=>"French"
                ),
                array(  
                    "id"=>3,  
                    "value"=>"Spanish"
                ),
                array(  
                    "id"=>4,  
                    "value"=>"Portuguese"
                )
    );  
  
    $o = array(  
            "num"=>count($dataDB),  
            "data"=>$dataDB  
        );  
    echo json_encode($o);  
}
//-------------------------------------------------------------------------------------------------------------------------------------
public function logSql($st, $logLevel) {
    $k = $this->isDebugSQL;
    if (! $k) { return; }
    
    if ($logLevel <= $k ) { $this->debugSQL[] = $st; }
}
public function intSqlType2extfILTERType($i) {
    
    if ($i <= 3 || $i == 8 || $i == 9 || $i == 13) {
        return 'numeric';
    } else if ($i == 4 || $i == 5) {
        return 'float';
    } else if ($i == '10' || $i == 14) {
        return 'date';
    } else {
        return 'string';
    }
    
    }
//-------------------------------------------------------------------------------------------------------------------------------------
public function intSqlType2extType($i) {
    
    if ($i <= 3 || $i == 8 || $i == 9 || $i == 13) {
        return 'int';
    } else if ($i == 4 || $i == 5) {
        return 'float';
    } else if ($i == '10' || $i == 14) {
        return 'date';
    } else {
        return 'string';
    }

}

}
//---  END of DBADMIN -------------------------------------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------------------------------------------
function bytesConvert($bytes)
{
    $ext = array('B', 'KB', 'MB', 'GB', 'TB');
    $unitCount = 0;
    for(; $bytes >= 1024; $unitCount++) $bytes /= 1024;
    return number_format($bytes, 0) . ' ' . $ext[$unitCount];
}
//-------------------------------------------------------------------------------------------------------------------------------------
?>
