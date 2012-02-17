Ext.namespace('DBADMIN'); 

DBADMIN.SqlQuery = Ext.extend(Ext.Panel, {
	initComponent: function() {
		
        this.queryEdit = new Ext.form.TextArea({
            value: '',  // "SELECT * FROM test LIMIT 20"
                        // "SELECT id, title, add_date, modified, concat(title, ' ', id) FROM cnaa_temp.site  WHERE id > 7945 LIMIT 10",
            enableKeyEvents: true,
            listeners: {
                'keypress': {fn: function(item, e) {
                        if(e.getKey() == e.ENTER && e.ctrlKey) { this.execSql(false); }   // !e.isNavKeyPress() || (
                },
                scope: this
            }
        }});
        
        this._execButton = new Ext.SplitButton({
            text: 'Execute', iconCls: 'icon-sql', handler: function() { this.execSql(false) }, scope: this,
            menu: { items: [
                {text: 'Execute Batch', iconCls: 'icon-sql_multi', handler: function() { this.execSql(true) }, scope: this},
                {text: 'Execute Script...', iconCls: 'icon-docsql', disabled: true, scope: this}
            ]}
        });
        
        this._forceFitButton = new Ext.menu.CheckItem({disabled: true, text: 'ForceFit',  handler: function(item, checked) { this.sqlGrid.forceFit = checked }, scope: this});
        //this._forceFitButton = new Ext.Button({enableToggle: true, text: 'ForceFit',  toggleHandler: function(bt, state) { this.sqlGrid.forceFit = state }, scope: this});
        
        this.createDbCombo();
                
        this.queryPanel = new Ext.Panel({
            region: 'north',
            split: true,
            height: 120,
            minSize: 50,
            layout: 'fit',
            border: false,
            tbar: [
                this.icDbCombo,
                '-',
                {text: 'Explain', iconCls: 'icon-info', handler: this.explainQuery, scope: this},
                this._execButton,
                '->',
                {text: 'Options', iconCls: 'icon-gear', disabled: true,
                 menu: { items: [this._forceFitButton] },
                 scope: this
                },
                '-',
                {text: 'Export', iconCls: 'icon-tbl_disk', disabled: true, scope: this}
            ],
            items: [this.queryEdit]
        });
		
        this.resEdit = new Ext.form.TextArea({title: 'Fields'});
        this.sqlGrid = new DBADMIN.EditorSqlGridPanel({
            region: 'center', 
            border: false,
            mode: 'query', 
            serverId: this.serverId,
            forceFit: true
        });
        
        // this.resultTabPanel = new Ext.TabPanel({region: 'center', border: false, activeItem: 0, items: [this.sqlGrid, this.resEdit]});
        
        Ext.apply(this, {
            title: 'Query [' + this.serverTitle + ']',
			closable: true,
			iconCls: 'icon-sql',
			layout: 'border',
            border: false,
            items: [this.queryPanel, this.sqlGrid]
		});
		
		// DBADMIN.DBTable.superclass.initComponent.call(this);        
		DBADMIN.SqlQuery.superclass.initComponent.apply(this, arguments);
        
        this.queryEdit.on('render', function() {
            this.queryEdit.focus();
            var ddt = new Ext.dd.DropTarget(this.queryEdit.getEl(), {
                ddGroup: 'DBADMIN',
                notifyDrop: function(dd, e, data) {
                    this.queryEdit.setValue(this.queryEdit.getValue() + ' ' + data.node.attributes.pid);
                    // this.queryEdit.focus();
                    return true; 
                }.createDelegate(this)
            });    // onNodeDrop
            } ,
        this
        ); 
        
	},
//------------------------------------------------------------------------------------------------------------------------------------------------        
    
    afterRender: function() {
        DBADMIN.SqlQuery.superclass.afterRender.apply(this, arguments);
        
        // this.queryEdit.focus();
    }, 
//------------------------------------------------------------------------------------------------------------------------------------------------        
    createDbCombo: function() {
        var a = [['[none]', 'icon-warn']];
        for (var i=0; i<this.dbList.length; i++) {
            a.push([this.dbList[i], 'icon-db']);
        }
        
        v = this.dbName || '[none]';
        
        this.icDbCombo = new Ext.ux.IconCombo({
            // xtype:'iconcombo',
            // fieldLabel:'IconCombo',
            width: 150,
            store: new Ext.data.SimpleStore({
                fields: ['dbName', 'icon'],
                data: a
            }),
            valueField: 'dbName',
            displayField: 'dbName',
            iconClsField: 'icon',
            triggerAction: 'all',
            mode: 'local',
            value: v,
            listeners: {change: {fn: function(combo, v) { this.dbName = v == '[none]' ? null : v; }, scope: this}}
        });
        
        
        // this.icDbCombo.setValue(v);
    },
//------------------------------------------------------------------------------------------------------------------------------------------------
/*    execBatch: function() {
        var st = this.queryEdit.getValue();
        // this.sqlGrid.execMultiQuery(st);
    }, 
*/    
//------------------------------------------------------------------------------------------------------------------------------------------------
    explainQuery: function() {
        var st = 'EXPLAIN ' + this.queryEdit.getValue();
        this.sqlGrid.execQuery(this.dbName, st, false);
    },
//------------------------------------------------------------------------------------------------------------------------------------------------
    execSql: function(multi) {
        var st = this.queryEdit.getValue();
        this.sqlGrid.execQuery(this.dbName, st, multi);
    }
});