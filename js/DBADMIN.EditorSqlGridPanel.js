Ext.namespace('DBADMIN');

DBADMIN.EditorSqlGridPanel = Ext.extend(Ext.grid.EditorGridPanel, {
	
	initComponent: function() {
		
        // add custom events
        this.addEvents('syncStoreControls');  // attach an event listener to enable/disable Store buttons
       
        this.colModel = new Ext.grid.ColumnModel([]);
        
        this.view = new Ext.grid.GridView({
            //forceFit: this.forceFit, 
            getRowClass: this._getRowClass.createDelegate(this)
            // emptyText: '<div style="position:relative; height:60px; width:auto; top:50%; margin-top:-30px;">No data</div>'
        });
        
        
   	this.jrReader = new Ext.data.JsonReader();
        this._initStore();
       
        this._createButtons();
        if (this.mode == 'query') {this._createQueryFooter();} else {this._createTableFooter();}
        
		Ext.apply(this, {
            bbar: this._bbar,
            
  			keys: [{
				key: Ext.EventObject.DELETE,
				ctrl: true,
				scope: this,
				handler: this.delRow
			}, {
				key: Ext.EventObject.INSERT,
				scope: this, 
				handler: this.addRow
			}]
		});
		
		DBADMIN.EditorSqlGridPanel.superclass.initComponent.apply(this, arguments);
                
		this.on({
        'beforeedit': {
            fn: function(e) {
                //alert( e.field);
                //TRATAMIENTO SI ES UNA IMAGEN ---------------------------------------------------------------
		_server = this.serverId;
		_db     = this.dbName;
		_tbl 	= this.tblName;
		_file 	= e.field;
                                   
                nombrecampo      = e.field;
		nombrecampo      = nombrecampo.toLowerCase();
                servidor_db      = this.serverId;
                condicion_nombre = e.grid.getColumnModel().getDataIndex(0);
                condicion_valor  = e.record.get(condicion_nombre);
                campo_nombre     = e.field;
                campo_valor      = e.value;
                
				
                if(nombrecampo.indexOf("image")!=-1){
                  
                   //alert('carpeta:uploads/'+this.serverId +'/' +this.dbName +'/' +this.tblName );
                
                   var _ruta 	= this.serverId +'/' +this.dbName +'/' +this.tblName +'/';

                   //alert(_ruta);
                   //e.serverId = this.serverId;
                    this.gridUploadEditor = new DBADMIN.GridUploadEditor();
                    this.gridUploadEditor.editItem(e,_ruta,_server,_db,_tbl,_file);
					
                    this.gridUploadEditor._ruta 	= _ruta;
					this.gridUploadEditor._server 	= _server;
					this.gridUploadEditor._db 	= _db;
					this.gridUploadEditor._tbl 	= _tbl;
					this.gridUploadEditor._file 	= _file;
		
                    return false;
                }
				
                // if TEXT field
                var t = this._fieldsHash['_' + e.field];
               // alert(t);
                if (!t._blob) {return true;}           // if (t.indexOf('text') == -1) { return true; }

                if (! this.gridTxtEditor) {this.gridTxtEditor = new DBADMIN.GridTextEditor();}
                this.gridTxtEditor.editItem(e);
                return false;
            },
            scope: this
		},
        'afteredit': {
            fn: function(e){
                if (this._fieldsHash['_' + e.field]._calculated) {e.record.reject();}
            },
            scope: this
        }
        });
	},
//------------------------------------------------------------------------------------------------------------------------------------------------    
    afterRender: function() {
        DBADMIN.EditorSqlGridPanel.superclass.afterRender.apply(this, arguments);
        
        if (this.mode == 'table') {this._insertTBButtons();}
        
        if (this.mode == 'query') {
            for(var i = 0; i < 6; i++) {
                this._bbar.items.get(i).hide();
            }
        } else {
            
        }
        
    }, 
//------------------------------------------------------------------------------------------------------------------------------------------------    
    _insertTBButtons: function() {
        var bbar = this._bbar;
        
        bbar.insertButton(0, new Ext.Toolbar.Separator());
        bbar.insertButton(0, this._rowCountButton);
        bbar.insertButton(0, new Ext.Toolbar.Separator());
        bbar.insertButton(0, this._errButton);
        bbar.insertButton(0, new Ext.Toolbar.Fill());
        bbar.insertButton(0, new Ext.Toolbar.Separator());
        bbar.insertButton(0, this._cellMenuButton);
        bbar.insertButton(0, this._textForm);
        bbar.insertButton(0, new Ext.Toolbar.Separator());
        bbar.insertButton(0, new Ext.Toolbar.Separator());
        bbar.insertButton(0, this._cancelButton);
        bbar.insertButton(0, this._saveButton);
        bbar.insertButton(0, new Ext.Toolbar.Separator());
        bbar.insertButton(0, this._delRowButton);
        bbar.insertButton(0, this._addRowButton);
    },
//------------------------------------------------------------------------------------------------------------------------------------------------
    colHiddenChange: function() {
        var cm = this.getColumnModel();
        var colAry = [];
        var idxAry = this._serverResp.uniqueIndex;
        
        for (var i=0; i<cm.getColumnCount(); i++) {
            var fieldName = cm.getDataIndex(i);
            
            // fetch only visible & nonIndex fields
            if (! cm.isHidden(i) || idxAry.indexOf(fieldName) != -1 )
            colAry.push(fieldName);
        }
        
        this.tblColumns = colAry.join(',');
        this.getStore().baseParams.cols = this.tblColumns;
        
        // console.log(this.tblColumns);
    },
//------------------------------------------------------------------------------------------------------------------------------------------------
    _createButtons: function() {
        this._addRowButton = new Ext.Toolbar.Button({
            text: 'Add', 
            handler: this.addRow, 
            iconCls: 'icon-plus',
            hidden: false, 
            scope: this
        });
        this._delRowButton = new Ext.Toolbar.Button({
            text: 'Delete', 
            handler: this.delRow, 
            iconCls: 'icon-minus',
            hidden: true, 
            scope: this
        });
        
        this._saveButton = new Ext.Toolbar.Button({
            text: 'Save', 
            handler: this._onSaveBtnClick,
            iconCls: 'icon-save',
            hidden: true,
            disabled: true,
            scope: this
        });
        
        this._cancelButton = new Ext.Toolbar.Button({
            text: 'Cancel', 
            handler: this._onCancelBtnClick, 
            iconCls: 'icon-cancel',
            hidden: true, 
            disabled: true,
            scope: this
        });

        this._errButton = new Ext.Toolbar.Button({
            text: 'no errors', 
            handler: this._onErrBtnClick, 
            iconCls: 'icon-ok',
            hidden: false, 
            scope: this
        });
        
        this._rowCountButton = new Ext.Toolbar.TextItem({text: 'no data', scope: this});
       
            


        this._cellMenuButton = new Ext.Toolbar.Button({
            text: 'Cell', iconCls: 'icon-tbl_edit2', scope: this,
            menu: {
                items: [
                    {text: DBADMIN.NULL_VALUE,checked: true, handler: function() {this.cellUpdate('null')}, scope: this}, 
                    '-', 
                    {text: 'Uppercase', handler: function() {this.cellUpdate('uppercase')}, scope: this}, 
                    {text: 'Lowercase', handler: function() {this.cellUpdate('lowercase')}, scope: this}
                ]
            }
            
        });
           
        
        
    },
//------------------------------------------------------------------------------------------------------------------------------------------------
    _createQueryFooter: function() {
        
        this._bbar = new Ext.Toolbar([
            this._addRowButton,
            this._delRowButton,
            '-',
            this._saveButton, 
            this._cancelButton,
            '-',
            this._cellMenuButton,
           /* this._SearchMenuButton,*/
            /*this._combo,*/
            this._filterMenuButton,
            this._textForm,
			'->',
            this._errButton,
            '-',
            this._rowCountButton
        ]);
    },
//------------------------------------------------------------------------------------------------------------------------------------------------
    _createTableFooter: function() {
    var store_fields= new Ext.data.JsonStore({  
            url:'engine.php',  
            root: 'data',  
            totalProperty: 'num',  
            fields: [  
                {name:'id', type: 'string'},  
                {name:'value', type: 'string'} 
            ],
            baseParams : {
                cmd:"getComboFields",
                serverId:this.serverId,
                dbName:this.dbName,
                tblName:this.tblName
            }
    }); 
    this._filterMenuButton = new Ext.Toolbar.Button({
            text: 'Search', iconCls: 'icon-tbl_edit2', scope: this,
            items:[this.menu]
    });
    var combo_label = 'cmb_' + this.tblName;
    this._combo = new Ext.form.ComboBox({  
        fieldLabel:'cmbField', 
        autoload:true,
        name:'cmb_' + this.tblName,
        id:'cmb_' + this.tblName,
        forceSelection: true,  
        store: store_fields, //asignandole el store  
        emptyText:'pick one field...',  
        triggerAction: 'all',  
        editable:false,  
        displayField:'value',  
            valueField: 'id'  
    }); 
       var texto_label = 'txt_' + this.tblName;
       this.textbox = new Ext.form.TextField({
             xtype:'textfield',
             fieldLabel: 'Find',
             name:'txt_'+this.tblName,
             id:'txt_'+this.tblName,
             emptyText: 'write text to filter by....',
             iconCls: 'icon-tbl_edit2'
        })
        this._bbar = new Ext.PagingToolbar({  //  DBADMIN.myPagingToolbar
            pageSize: 20,
            store: this.store,
            displayInfo: false,
            listeners: {'change': {fn: this._syncStoreControls,  scope: this}},
            items:
                [
                this._combo,this.textbox,
                {
                    text: 'Search', iconCls: 'icon-tbl_edit2', scope: this,
                    handler: function() {
                            valueToFind = Ext.getCmp('txt_' + this.tblName).getValue();
                            fieldName = Ext.getCmp(combo_label).getValue();                            
                            this.colFilterSearch(fieldName , valueToFind);
                    }
                }
                ]
            
        });
    },
//-----------------------------------------------------------------------------------------------------------------------------------------------    
    _onCancelBtnClick: function() {
        // delete new records
        var ds = this.getStore();
        var records = ds.getModifiedRecords();
        for (var i=records.length-1; i>=0; i--) {
            var r = records[i];
            if (r.data._newRecord) {ds.remove(r);}
        }
        // cancel updates
        this.getStore().rejectChanges();
    },
//-----------------------------------------------------------------------------------------------------------------------------------------------
    _onSaveBtnClick: function() {
		var records = this.getStore().getModifiedRecords();
		if(!records.length) {
			return;
		}
		var data = {};
		data['update'] = [];
		data['insert'] = [];
		data['uniqueIndex'] = this._serverResp.uniqueIndex;
		data['autoIncCol'] = this._serverResp.autoIncCol;
		
		Ext.each(records, function(r, i) {
			var o = r.getChanges();
			
			// add the _gridId 
			o._gridId = r.get('_gridId');
			
			if(r.data._newRecord) {
				this._setImplicitDefaults(o);
				data['insert'].push(o);
                this._removeTimePart(o);  // JSON formats dates as: '2009-01-20T10:07:00'
			} else {
				data['update'].push([this._getRecIdx(r), o]);
                this._removeTimePart(o);
			}
			
		}, this);
		
		// console.dir(data);
		
		var p = {
			url: DBADMIN.ENGINE_URL,
			params: {
				cmd: 'tblSaveRows', data: Ext.encode(data),
				serverId: this.serverId, db: this._serverResp.dbName, tbl: this._serverResp.tblName
			},
            method: 'post',
			callback: this._callbackSaveRows,
			scope: this
		};
		Ext.Ajax.request(p); 
	},
//------------------------------------------------------------------------------------------------------------------------------------------------    
    _removeTimePart: function(o) {
        for (var field in o) {
            if (field == '_gridId') {continue;}
            if (this._fieldsHash['_' + field]['_ct'] == 'date' && o[field] !== null && typeof(o[field]) == 'object' ) {
                t = o[field].format('Y-m-d');
                o[field] = t;
            }
        }
    },
//------------------------------------------------------------------------------------------------------------------------------------------------
	_callbackSaveRows: function(options, success, response) {
		if(true !== success) {
			this._showError(response.responseText);
			return;
		}
		
		try {
			var data = Ext.decode(response.responseText);
		}
		catch(e) {
			this.showError(response.responseText, 'Cannot decode JSON object');
			return;
		}

		// if(true !== data.success) {
			// this._showError(data.error || 'Unknown error');
			// return;
		// }
        DBADMIN.logSql(data.debugSQL);
        
		switch(options.params.cmd) {
			case 'tblSaveRows':
				this._serverResp.errors = data.errors;
                this._serverResp.warnings = data.warnings;
                this._serverResp.msg = data.msg;
                this._showResultStatus();
                
                var records = this.getStore().getModifiedRecords();
				var a = [];
				Ext.each(records, function(r, i) {
					var gridId = r.data._gridId;
					if (data['update'][gridId]) {
						a.push(r); // r.commit();
					} else if (data['insert'][gridId]) {
						// update each field 
						this._updateInsertedRec(r, data['insert'][gridId]);
						
						// this record was already saved to DB, it is not a new one anymore
						delete(r.data._newRecord);
						a.push(r); // r.commit();
					}
				}, this);
				
				Ext.each(a, function(r) {r.commit();});
				// this.dsStore.commitChanges();
			break;

			case 'deleteData':
			break;
		}
	},
//------------------------------------------------------------------------------------------------------------------------------------------------	
	_showError: function(msg, title) {
		Ext.Msg.show({
            title:title || 'Error',
			msg:Ext.util.Format.ellipsis(msg, 2000),
			icon:Ext.Msg.ERROR,
			buttons:Ext.Msg.OK,
			minWidth:1200 > String(msg).length ? 360 : 600
		});
	},	
//------------------------------------------------------------------------------------------------------------------------------------------------
	_updateInsertedRec: function(rec, d) {
		// for (var i=0; i<sqlColAry.length; i++) {
			
		//Ext.each(d, function (colName, i) {
		for (var colName in d) { 
			
			if (this._fieldsHash['_' + colName] == 'date') {
				Date.parseDate(d[colName], "Y-m-d");
			} else {
				rec.set(colName, d[colName]);
			}

			// if (colName != 'add_date') { rec.set(colName, d[colName]); }
		}
	}, 
//------------------------------------------------------------------------------------------------------------------------------------------------
	// returns an ary of values that uniquely identifies a MODIFIED record
	_getRecIdx: function(r) {
		var a = [];
		var idx = this._serverResp.uniqueIndex;
        for (var i=0; i<idx.length; i++) {
			var idxField = idx[i];
			if (r.modified) {
                if (r.modified[idxField] == undefined) {
                    a.push(r.data[idxField]);
                } else {
                    a.push(r.modified[idxField]);
                }
            
            } else {
                a.push(r.data[idxField]);
            }
		}
		return a;
	},
//------------------------------------------------------------------------------------------------------------------------------------------------
	_setImplicitDefaults: function(o) {
		var cols = this._serverResp.colDefaults;
		for (var t in cols) {
			if (typeof (o[t]) == 'undefined') {
				o[t] = cols[t];
			}
		}
	},
//-----------------------------------------------------------------------------------------------------------------------------------------------
	addRow: function() {
		if (!this.isLiveGrid) {return;}
        
        var ds = this.getStore();
		if(ds.recordType) {
			var rec = new ds.recordType({'_newRecord': true, '_gridId': this._nextGridId});
            this._nextGridId++;
			
			rec.fields.each(function(f) {
				rec.data[f.name] = typeof(f.defaultValue) != 'undefined' ? f.defaultValue : null;
			});
			
			rec.commit();
            ds.add(rec);

            // Set the newly added record as DIRTY
            var t = rec.data._gridId;
            rec.beginEdit();
            rec.set('_gridId', t+1);
            rec.set('_gridId', t);
            rec.endEdit();

			// select record
			this.focus();
			this.getSelectionModel().select(ds.indexOf(rec), 0);
			// this.grid.getSelectionModel().selectRecords([rec]); // store.indexOf(rec), 0);

			return rec;
		}
	},
//------------------------------------------------------------------------------------------------------------------------------------------------
	delRow: function() {
		Ext.Msg.show({
			title: 'Confirm Row Delete',
			msg: 'Are you sure you want to delete row ?<br />There is no undo.',
			icon: Ext.Msg.QUESTION,
			buttons: Ext.Msg.YESNO,
			scope: this,
			fn: function(response) {
				var sm = this.getSelectionModel();
                var ds = this.getStore();
				if ('yes' !== response || ! sm.hasSelection()) {return;}
				var rec = ds.getAt(sm.getSelectedCell()[0]);
				
				// only live grid rows (except new ones) need to be deleted from the server
				if (!this.isLiveGrid || rec.data._newRecord) {
					var i = ds.indexOf(rec);
					ds.remove(rec);
					//ds.remove(rec);
					this.focus();
					if (ds.getCount() == i) {i--;}
                    this.getSelectionModel().select(i, 0);
                    
					return;
				} 
				
				/* var a = {};
                var idx = this._serverResp.uniqueIndex;
				for (var i=0; i<idx.length; i++) {
					var idxField = idx[i];
					a[idxField] = rec.data[idxField];
				} */
				//console.log(Ext.util.JSON.encode(a));
                
                var data = {};
                data['uniqueIndex'] = this._serverResp.uniqueIndex;
                data['row'] = this._getRecIdx(rec);
                
				
				// deleting a record from the DB
                Ext.Ajax.request({
					url: DBADMIN.ENGINE_URL,
					params: {
						cmd: 'tblDelRow', 
                        serverId: this.serverId, db: this._serverResp.dbName, tbl: this._serverResp.tblName,
                        rec: Ext.util.JSON.encode(data)
					},
					
					success: function (resp,opt) {
						var data = Ext.decode(resp.responseText);
                        DBADMIN.logSql(data.debugSQL);
                        if (data.affectedRows) {
							var i = ds.indexOf(rec);
							ds.remove(rec);
							this.focus();
                            if (ds.getCount() == i) {i--;}
                            this.getSelectionModel().select(i, 0);
						} else {
							this._serverResp.errors = data.errors;
                            this._serverResp.warnings = data.warnings;
                            this._serverResp.msg = data.msg;
                            this._showResultStatus();
						}
					},

					failure: function (resp,opt) {
						Ext.Msg.alert('Server Side Error','Unable to delete row');
					},
                    
                    scope: this
				});
				
				
//				console.info('Deleting record');
			}	
		});
	},
//------------------------------------------------------------------------------------------------------------------------------------------------    
    // op = [null, uppercase, lowercase]
    cellUpdate: function(op) {
		//alert(op);
		
        var cell = this.getSelectionModel().getSelectedCell();
        if (cell === null) {return;}
        
        var fieldName = this.getColumnModel().getDataIndex(cell[1]);
        
        // do not modify calculated columns
        if (this._fieldsHash['_' + fieldName]._calculated) {return;}
        
        var rec = this.getStore().getAt(cell[0]);
        var v = rec.data[fieldName];
       //alert(fieldName);
        if (op == 'null') {
            v = null;
        } else if (op == 'uppercase') {
            v = v.toUpperCase();
        } else if (op == 'lowercase')  {
            v = v.toLowerCase();
        }
        rec.set(fieldName, v);
    },
//------------------------------------------------------------------------------------------------------------------------------------------------    
    // op = [null, uppercase, lowercase]
    colFilterUpdate: function(op) {
        var cell = this.getSelectionModel().getSelectedCell();
        if (cell === null) {return;}
        
        var fieldName = this.getColumnModel().getDataIndex(cell[1]);
        
        // do not modify calculated columns
        if (this._fieldsHash['_' + fieldName]._calculated) {return;}
        
        var rec = this.getStore().getAt(cell[0]);
        var v = rec.data[fieldName];

        
        this._clearGrid();
        this.openTableFiltered(fieldName,v);
    },
//------------------------------------------------------------------------------------------------------------------------------------------------    
    // op = [null, uppercase, lowercase]
    colFilterSearch: function(fieldName , valueToFind) {
        msg = false;
        mensaje = "";
        if(fieldName==''){
          mensaje += 'Select a field <br>';
          msg = true;
        }else if(valueToFind==''){
         mensaje += 'Write a text to search <br>';
          msg = true;  
        }
        if(valueToFind=='' && fieldName==''){
          mensaje = 'Select a field <br>Write a text to search <br>';
          msg = true;  
        }
        if(msg==true){
            Ext.Msg.alert('Warning',mensaje);
        }else{        
        this._clearGrid();
        this.openTableFiltered(fieldName,valueToFind);
        }
    },
//------------------------------------------------------------------------------------------------------------------------------------------------
    _getRowClass: function(rec, idx, p, store) {
        // do not highlight rows when query is not Live
        if (! this.isLiveGrid) {return '';}
        
        // within this function "this" is actually the GridView
        if(rec.get('_newRecord')) {
            return 'ux-grid3-new-row';
        }
        if(rec.dirty) {
            return 'ux-grid3-dirty-row';
        }
        return '';
    },
//------------------------------------------------------------------------------------------------------------------------------------------------
    _onErrBtnClick: function() {
        
        // a temporary ugly Dialog, will be changed in the future
        
        var text = '<ol style="list-style-type: decimal; padding-left: 32px">';
        var a = this._serverResp.msg;
        for (var i=0; i<a.length; i++) {
            text += '<li><span style="background-repeat: no-repeat; padding-right: 18px; padding-bottom: 16px" class="';
            text += a[i]['Level'] == 'Error' ? 'icon-err' 
                                             : 'icon-warn';
            text += '"></span>' + a[i]['Message'] + "</li>";   // + (i+1) + '. '
        }
        text += '</ol>';
        
        Ext.Msg.show({
            // iconCls: 'icon-docsql',
            title: 'SQL messages: ' + this._errButton.getText(),
            msg: text,
            // icon: Ext.MessageBox.ERROR,
            buttons: Ext.MessageBox.OK
        });
        
    },
//------------------------------------------------------------------------------------------------------------------------------------------------
    _initStore: function() {
        // mode = [table | query]
        if (this.mode == 'table') {
            this.store = new Ext.data.Store({
                proxy: new Ext.data.HttpProxy({url: DBADMIN.ENGINE_URL, method: 'POST'}),
                baseParams: {cmd: 'fetchTableRows', serverId: this.serverId, db: this.dbName, tbl: this.tblName, cols: this.tblColumns},    // cols: this.tblColumns
                reader: this.jrReader,
                autoLoad: false,
                remoteSort: true,   // ServerSide sorting because not all rows will be fetched
                pruneModifiedRecords: true
            });
        } else {
            this.store = new Ext.data.Store({
                reader: this.jrReader,
                autoLoad: false,
                remoteSort: false,  // ClientSide sorting because ALL rows will be fetched from db.
                pruneModifiedRecords: true
            });
        
        }
        
        // attach event handlers
        this.store.on({
            'metachange':  {fn: this._storeMetaChange,    scope: this},
            'load':        {fn: this._storeLoad,          scope: this},
            'datachanged': {fn: this._syncStoreControls,  scope: this},
            'update':      {fn: this._syncStoreControls,  scope: this},
            'add':         {fn: this._storeNewRecord,     scope: this},
            'clear':       {fn: this._syncStoreControls,  scope: this},
            'remove':      {fn: this._syncStoreControls,  scope: this}
        });
    },
//------------------------------------------------------------------------------------------------------------------------------------------------
	_preserveNullValue: function(v) {
		return v == null ? null : v;
	},
//------------------------------------------------------------------------------------------------------------------------------------------------    
    _storeNewRecord: function(store, recAry) {
        /*
        for (var i=0; i<recAry.length; i++) {
            var rec = recAry[i];
            
            var t = rec.data._gridId;
            rec.beginEdit();
            rec.set('_gridId', t-1);
            rec.set('_gridId', t);
            rec.endEdit();
        }
        */
        this._syncStoreControls();
    },
//------------------------------------------------------------------------------------------------------------------------------------------------
    _storeMetaChange: function(store, meta) {
        var gridCols = [];
        //creates the selection model

        Ext.each(meta.fields, function(col) {
            // if header property is not specified do not add to column model
            // invisible columns represent columns from unique indexes and 
            // are automatically added when isLiveGrid == true
            if (col.header == undefined) {return;}
			//alert(col.header);

            // ColModel <-> Reader correspondence
            col.dataIndex = col.name;
           // alert(col.name);
            // if (col['type'] != 'date') { col['convert'] = this._preserveNullValue; }
            
			switch (col['type']) {
				case 'int':
					this._colSetupInt(col,this.serverId,this.dbName,this.tblName);
					break;
				case 'string':
					this._colSetupString(col,this.serverId,this.dbName,this.tblName);
					break;
				case 'float':
					this._colSetupFloat(col);
					break;
				case 'date':
					this._colSetupDate(col);
					break;
			}
            
            gridCols.push(col);
            
            
        }, this);
        
        
        
        var cm = new Ext.grid.ColumnModel(gridCols);
        
        if (meta.defaultSortable != undefined) {
            cm.defaultSortable = meta.defaultSortable;
        }
        
        // can change the store if we need to also, perhaps if we detect a groupField
        // config for example
        // meta.groupField or meta.storeCfg.groupField;
        var newStore = this.store;
        // Reconfigure the grid to use a different Store and Column Model. The View
        // will be bound to the new objects and refreshed.
        this.reconfigure(newStore, cm);
        this.colModel.on('hiddenchange', this.colHiddenChange, this);

    },
//------------------------------------------------------------------------------------------------------------------------------------------------
    _storeLoad: function(store, records) {
        // do not add the GridID extra column if it's a readonly dataset
        if (! this.isLiveGrid) {return true;}
        
        Ext.each(records, function(r, i) {
            // add a special column 
            r.data['_gridId'] = i+1;
            // r.commit();
        });
        this._nextGridId = records.length+1;
    },
//------------------------------------------------------------------------------------------------------------------------------------------------    
    _syncStoreControls: function() {
        var isModified = this.getStore().getModifiedRecords().length > 0;
        var t = this.getStore().getCount();
        if (t) {
            // this.cursor+1, this.cursor+count, this.store.getTotalCount()
            t = this.mode == 'table' ? (this._bbar.cursor+1) + ' - ' + (this._bbar.cursor+t) + ' of ' + this.getStore().getTotalCount()
                                     : 'rows: ' + t;
        } else {
            t = 'no data';
        }
        Ext.fly(this._rowCountButton.getEl()).update(t);
        
        if (isModified) {
            this._saveButton.enable();
            this._cancelButton.enable();
        } else {
            this._saveButton.disable();
            this._cancelButton.disable();
        }
        
        this.fireEvent('syncStoreControls', this, isModified);
    },
//------------------------------------------------------------------------------------------------------------------------------------------------
    openTable: function() {
        this.getEl().mask('Loading table: ' +this.tblName +'...','x-mask-loading');
        
        Ext.Ajax.request({
   			url: DBADMIN.ENGINE_URL,
			params: {
				cmd: 'execQuery',
                mode: 'table',
                serverId: this.serverId, 
                dbName: this.dbName,
                tbl: this.tblName,
                cols: this.tblColumns,
                limit: 20  // max number of items to fetch
			},
            success: this._execQueryCallback,
            scope: this
        });
    },
//------------------------------------------------------------------------------------------------------------------------------------------------
    openTableFiltered: function(fieldName,valor) {
        this.getEl().mask('Loading filter: ' +this.tblName +'...','x-mask-loading');
       // alert("varlor: "+valor);
        Ext.Ajax.request({
   		url: DBADMIN.ENGINE_URL,
		params: {
			cmd: 'getTableSearch',
                        mode: 'tableFiltered',
                        serverId: this.serverId, 
                        dbName: this.dbName,
                        tbl: this.tblName,
                        cols: this.tblColumns,
                        fieldName: fieldName,
                        valor: valor,
                limit: 200000  // max number of items to fetch
			},
            success: this._execQueryCallback,
            scope: this
        });
    },
//------------------------------------------------------------------------------------------------------------------------------------------------
    execQuery: function(dbName, st, multi) {
        this.getEl().mask('Loading...','x-mask-loading');
        
        Ext.Ajax.request({
   			url: DBADMIN.ENGINE_URL,
			params: {
				cmd: multi ? 'execMultiQuery' : 'execQuery',
                mode: 'query',
                serverId: this.serverId, 
                dbName: dbName,
                sql: st
			},
            success: this._execQueryCallback,
            scope: this
        });
    },
//------------------------------------------------------------------------------------------------------------------------------------------------
    _execQueryCallback: function(resp, opt) {
        //alert(resp.responseText);
        this._serverResp = Ext.util.JSON.decode(resp.responseText);
        this._adjustServerResp();
        this.isLiveGrid = this._serverResp['live'];
        this._nextGridId = 1;
        this._syncLiveControls();
        
        this._showResultStatus();
        DBADMIN.logSql(this._serverResp.debugSQL);
        
        // display results
        if (this._serverResp.rows) {this.getStore().loadData(this._serverResp);} else {this._clearGrid();}
        
        this.getEl().unmask();
    },
//------------------------------------------------------------------------------------------------------------------------------------------------
    _syncLiveControls: function() {
        var btb = this.getBottomToolbar();
        
//        if (this.mode == 'table') {
            //
//        } else {
            for(var i = 0; i < 6; i++) {
                var t = btb.items.get(i);
                this.isLiveGrid ? t.show() : t.hide();
            }
//        }
    },
//------------------------------------------------------------------------------------------------------------------------------------------------
    _showResultStatus: function() {
        // if (this.mode == 'table') { return; }
    
        var sr = this._serverResp;
        var bt = this._errButton;
        
        var t = 'no errors';
        
        var c = '';
        
        /* var info = '';  // tooltip
        if (sr.msg.length > 0) {
            info = sr.msg.toString();
        } */
        
        if (sr.errors) {
            bt.setIconClass('icon-err');
            t = sr.errors + ' errors';
            c = 'FF7070'; // 'ff0000';
            if (sr.warnings) {
                t += ' / ' + sr.warnings + ' warnings';
            }
        } else if (sr.warnings) {
            bt.setIconClass('icon-warn');
            c = 'ffff00';
            t = sr.warnings + ' warnings';
            
            if (sr.isAffected) {
                t += ' / ' + sr.affectedRows + ' rows affected';
            }
        } else if (sr.isAffected) {
            bt.setIconClass('icon-ok');
            t = sr.affectedRows + ' rows affected';
            c = '7CFF7E';     // '00ff00';
        } else {
            bt.setIconClass('icon-ok');
            // now messages to display
        }
        
        bt.setText(t);
        // bt.setTooltip() // wait for ExtJS 3.0
        
        if (c) {
            bt.getEl().highlight(c); // #FEFF49
            // bt.getEl().frame("ff0000", 1, { duration: 2 });
        }
        // bt.show();
    },
//------------------------------------------------------------------------------------------------------------------------------------------------
    _clearGrid: function() {
        var newStore = this.store;
        var cm = new Ext.grid.ColumnModel([]);
        this.reconfigure(newStore, cm);
        
        newStore.removeAll();
        
    },
//------------------------------------------------------------------------------------------------------------------------------------------------
// http://extjs.com/forum/showthread.php?p=284773
    _adjustServerResp: function() {
        var r = this._serverResp;
        if (!r.metaData) {return;}
        
        var idx = 0;
        
        var a = [];
        // for (var field in r.metaData.fields) {
        var ary = r.metaData.fields;
        for (var i=0; i<ary.length; i++) {
            field = ary[i];
            //alert('field:' +field.name );
            a[ '_' + field.name ] = field;    // we put an undescore ('_') because there are special key names like 'length' for example

            // preserve NULL values in source
            if (field.type != 'date') {field.convert = this._preserveNullValue;}

            if (field._key) {
                var t = 'idx';
                
                if (field._key == 'pri') {
                    t += '_pri';
                } else if (field._key == 'uni') {
                    t += '_uni';
                }
                
                idx++;
                t += idx;
                
                field.id = t;
            }
        }
        this._fieldsHash = a;
    },
//------------------------------------------------------------------------------------------------------------------------------------------------
    execMultiQuery: function(st) {
    },
//------------------------------------------------------------------------------------------------------------------------------------------------        
    editTable: function(dbName, tblName, tblColumns) {
    },
//------------------------------------------------------------------------------------------------------------------------------------------------
_colSetupInt: function (col, serverId, dbName, tblName) {
    if(col['_key']=='mul'){

    var store= new Ext.data.JsonStore({  
            url:'engine.php',  
            root: 'data',  
            totalProperty: 'num',  
            fields: [  
                {name:'id', type: 'int'},  
                {name:'value', type: 'string'} 
            ],
            baseParams : {cmd:"getForeignCombo",serverId:serverId,dbName:dbName,tblName:tblName,colName:col['name']}
    }); 
    
    //se crea el combo asignandole el store  
    col['editor'] =new Ext.form.ComboBox({  
        fieldLabel:'Data Base', 
        autoload:true,
        name:'cmb-DBs',  
        forceSelection: true,  
        store: store, //asignandole el store  
        emptyText:'pick one DB...',  
        triggerAction: 'all',  
        editable:false,  
        displayField:'value',  
            valueField: 'id'  
    });  
            }else{
                col['align'] = 'right';
                col['renderer'] = this._colRenderNumber;
                        // if (! this.isLiveGrid) { return }

                col['editor'] = new Ext.form.NumberField({
                                allowDecimals: false,
                                allowNegative: ! col['_unsigned']   // col['_ctl'].indexOf('unsigned') == -1
                                // maxValue: see MySql docs
                        });
            }
	},
//------------------------------------------------------------------------------------------------------------------------------------------------
	_colSetupFloat: function (col) {
		col['align'] = 'right';
		// if (! this.isLiveGrid) { return }
        
        col['editor'] = new Ext.form.NumberField({
			allowDecimals: true,
			allowNegative: ! col['_unsigned']      //  col['_ctl'].indexOf('unsigned') == -1
			// maxValue: see MySql docs
		});
	},
//------------------------------------------------------------------------------------------------------------------------------------------------
	_colSetupDate: function (col) {
		col['renderer'] = this._colRenderDate;
		// if (! this.isLiveGrid) { return }
        
        col['editor'] = new Ext.form.DateField({format: 'Y-m-d'});
        
	},
//------------------------------------------------------------------------------------------------------------------------------------------------	
	_colSetupString: function (col) {
            var  ct = col['_ct'];         // ColumnType     : int
            var ctl = col['_ctl'];    // ColumnTypeLong : int(10) unsigned
           
           
		if (ct.indexOf('char') > -1 || ct.indexOf('binary') > -1) {
                           // Ext.Msg.alert('Test','Title: '+ct);
                            nombrecampo = col['name'];
                            nombrecampo = nombrecampo.toLowerCase();
                            if(nombrecampo.indexOf("image")!=-1){
                                col['renderer'] = this._colRenderImage;
                                col['align'] = 'center';
                            }else{
                                col['renderer'] = this._colRenderString; // Ext.util.Format.htmlEncode;
                                col['align'] = 'center';
                            }
            col['editor'] = new Ext.form.TextField({
				maxLength: col['_maxLen'] || 255
			});

		} else if (ct == 'enum') {
			col['editor'] = new Ext.form.ComboBox({
				// displayField: 'val',
				// valueField: 'val',
				lazyRender: true,
				store: ctl.substring(6, ctl.indexOf(')')-1).split("','"),
				mode: 'local',
				selectOnFocus: 'false',
				triggerAction: 'all'
			});
    		} else if (ct.indexOf('text') > -1) {
			col['renderer'] = this._colRenderText;
			col['align'] = 'center';
                        
            // it will not be used ... should find another way to enable memo editing
            // ... maybe onDoubleClick etc
            col['editor'] = new Ext.form.TextField(); 
            
			// the DBADMIN.GridTextEditor will show onBeforeUpdate || onDblClick
            // col['editor'] = new Ext.form.TextArea({});
		} else if (ct.indexOf('blob') > -1) {
			col['renderer'] = this._colRenderBlob;
			col['align'] = 'center';

		} else {
			// for ALL other datatypes
                	col['editor'] = new Ext.form.TextField();
			col['renderer'] = this._colRenderString; // Ext.util.Format.htmlEncode;
		}
               if(ct =='binary'){                   
			// for ALL other datatypes
			//col['editor'] = new Ext.form.DateTime();                        
			col['renderer'] = this._colRenderImage;
                        col['align'] = 'center';
                        //col['editor'] = new DBADMIN.GridUploadEditor();
                       // col['editor'] = new DBADMIN.GridUploadEditor();

                       // col['editor'] = new Ext.form.FileUploadField();
                 }
	},
//------------------------------------------------------------------------------------------------------------------------------------------------    
	_colRenderNumber: function (val, cell, record, rowIndex, columnIndex, store) {
		if (val != 0 ) {
			return val;
		} else if (val !== null) {
			return '<span style="color:#AAA;">' + val + '</span>';
		} else {
            return DBADMIN.NULL_VALUE;
		}
	},
//------------------------------------------------------------------------------------------------------------------------------------------------	
	_colRenderString: function (val, cell, record, rowIndex, columnIndex, store) {
		if (val) {
			return Ext.util.Format.htmlEncode(val);
			// '<img style="height: 16px; width: 16px;" src="i/document_text_medium.png" />'; // '<span class="tbl-icon-text">&nbsp;</span>';
		} else if (val !== null) {
			return '';
		} else {
            return DBADMIN.NULL_VALUE;
		}
	},
//------------------------------------------------------------------------------------------------------------------------------------------------	
	_colRenderText: function (val, cell, record, rowIndex, columnIndex, store) {
		if (val) {
			// cell.attr = 'ext:qtip="<b>Size</b>: ' + Ext.util.Format.fileSize(val.length) + '"';
			// cell.css = 'tbl-icon-text';
			return '<img style="height: 13px; width: 10px;" src="i/doc.png" />'; // '<span class="tbl-icon-text">&nbsp;</span>';
		} else if (val != null) {
			return '';
		} else {
			return DBADMIN.NULL_VALUE;
		}
	},
//------------------------------------------------------------------------------------------------------------------------------------------------
	_colRenderBlob: function (val, cell, record, rowIndex, columnIndex, store) {
		if (val) {
			// cell.attr = 'ext:qtip="<b>Size</b>: ' + Ext.util.Format.fileSize(val.length) + '"';
			// cell.css = 'tbl-icon-text';
			return '<img style="height: 13px; width: 10px;" src="i/doc.png" />'; // '<span class="tbl-icon-text">&nbsp;</span>';
		} else if (val != null) {
			return '';
		} else {
            return DBADMIN.NULL_VALUE;
        }
	},
//------------------------------------------------------------------------------------------------------------------------------------------------
	_colRenderImage: function (val, cell, record, rowIndex, columnIndex, store) {

		if (val) {
			// cell.attr = 'ext:qtip="<b>Size</b>: ' + Ext.util.Format.fileSize(val.length) + '"';
			// cell.css = 'tbl-icon-text';
                        //('serverId:' +this.serverId +', dbName:' +this.dbName +', tblName' +this.tblName);
                        return '<img style="height: 13px; width: 10px;" src="i/img.png" />'; // '<span class="tbl-icon-text">&nbsp;</span>';
                       // alert('uploads/'+serverId +'/' +dbName +'/' +tblName +'/' +val);
			//return '<img style="height: 23px; width: 20px; align:center;" src="uploads/'+this.serverId +'/' +this.dbName +'/' +this.tblName +'/' +val +'" />'; // '<span class="tbl-icon-text">&nbsp;</span>';
		} else if (val != null) {
			return '';
		} else {
            return DBADMIN.NULL_VALUE;
        }
	},
//------------------------------------------------------------------------------------------------------------------------------------------------	
	_colRenderDate: function (val) {
		//Ext.util.Format.dateRenderer('m/d/Y')
		// console.log(val);
		if (val != null) {
            if (val == '') {
                return '';
            } else if (typeof(val) === 'string') {
                return val;
                // var parts = val.split(/-/);
                // var d = new Date();
                // d.setFullYear(parts[0]);  
                // d.setMonth(parts[1] - 1);  
                // d.setDate(parts[2]);  
                // return d;
            } else {
                return val.dateFormat('Y-m-d');
            }
        } else {
            return DBADMIN.NULL_VALUE;
        }
    }
//------------------------------------------------------------------------------------------------------------------------------------------------
});

DBADMIN.myPagingToolbar = Ext.extend(Ext.PagingToolbar,{
    //Re order your buttons here
    onRender : function(ct, position){
        Ext.PagingToolbar.superclass.onRender.call(this, ct, position);
    	this.first = this.addButton({
            tooltip: this.firstText,
            iconCls: "x-tbar-page-first",
            disabled: true,
            handler: this.onClick.createDelegate(this, ["first"])
        });
        this.prev = this.addButton({
            tooltip: this.prevText,
            iconCls: "x-tbar-page-prev",
            disabled: true,
            handler: this.onClick.createDelegate(this, ["prev"])
        });
        this.addSeparator();
        this.add(this.beforePageText);
        
        this.field = Ext.get(this.addDom({
           tag: "input",
           type: "text",
           size: "3",
           value: "1",
           cls: "x-tbar-page-number"
        }).el);
        this.field.on("keydown", this.onPagingKeydown, this);
        this.field.on("focus", function(){this.dom.select();});
        this.afterTextEl = this.addText(String.format(this.afterPageText, 1));
        this.field.setHeight(18);
        this.addSeparator();
        this.next = this.addButton({
            tooltip: this.nextText,
            iconCls: "x-tbar-page-next",
            disabled: true,
            handler: this.onClick.createDelegate(this, ["next"])
        });
        this.last = this.addButton({
            tooltip: this.lastText,
            iconCls: "x-tbar-page-last",
            disabled: true,
            handler: this.onClick.createDelegate(this, ["last"])
        });
        this.addSeparator();
        this.loading = this.addButton({
            tooltip: this.refreshText,
            iconCls: "x-tbar-loading",
            handler: this.onClick.createDelegate(this, ["refresh"])
        });

        if(this.displayInfo){
			this.displayEl = Ext.fly(this.el.dom).createChild({cls:'x-paging-info'});
        }
		
        if(this.dsLoaded){
            this.onLoad.apply(this, this.dsLoaded);
        }
    }
});