Ext.namespace('DBADMIN');
        
DBADMIN.DBTable = Ext.extend(Ext.Panel, {
	
	initComponent: function() {
      
        
        this.sqlGrid = new DBADMIN.EditorSqlGridPanel({
            border: false,
            mode: 'table', 
            serverId: this.serverId,
            forceFit: true,
            dbName: this.dbName,
            tblName: this.tblName,
            tblColumns: '*',
            enableColLock: false,
            loadMask: true
        });
        
        this.add(this.sqlGrid);
		Ext.apply(this, {
			title: this.dbName + '.' + this.tblName,
			closable: true,
			iconCls: 'icon-tbl',
			layout: 'fit',
                        items: [this.sqlGrid],
                        tbar: [
                            {text: 'Manage Columns', iconCls: 'icon-col_man', disabled: false, scope: this},
                            {text: 'Manage Indexes', iconCls: 'icon-idx_man', disabled: false, scope: this}
                        ]
		});
		DBADMIN.DBTable.superclass.initComponent.apply(this, arguments);
	},
//------------------------------------------------------------------------------------------------------------------------------------------------
	afterRender: function(options) {
        // call parent
        DBADMIN.DBTable.superclass.afterRender.apply(this, arguments);
        // create the Grid
        this.sqlGrid.openTable.defer(100, this.sqlGrid);
	}

});