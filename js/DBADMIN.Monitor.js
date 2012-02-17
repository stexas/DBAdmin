Ext.namespace('DBADMIN'); 

DBADMIN.Monitor = Ext.extend(Ext.Panel, {
	initComponent: function() {
		
        Ext.Ajax.extraParams = {
            'debugSQL': 5   // if true, every AJAX response will contain an array of SQL statements: Array $r['debugSQL']
        };
        
        // this.memoLog = new Ext.form.TextArea();
        
        Ext.apply(this, {
			title: 'SQL Monitor',
			// id: 'pnSqlMonitor',
            closable: true,
			iconCls: 'icon-terminal',
            bodyStyle: 'background-color: #F0F0F0; padding: 5px',
            autoScroll: true,
			layout: 'fit',
            border: false,
            // items: [this.memoLog],
            tbar: [
                {text: 'Clear', iconCls: 'icon-cancel', handler: function(){ this.logData = ''; this.body.update(''); }, scope: this},
                '->',
                {text: 'Options', iconCls: 'icon-gear', disabled: true,
                 scope: this
                }
            ]
		});
		
		// DBADMIN.DBTable.superclass.initComponent.call(this);        
		DBADMIN.Monitor.superclass.initComponent.apply(this, arguments);
        
        this.on('beforedestroy', function(){ Ext.Ajax.extraParams = {'debugSQL': 0}; }, this);
	},
//------------------------------------------------------------------------------------------------------------------------------------------------
    log: function(msg) {
        if (! this.logData) { this.logData = ''; }
        
        if (!msg) {return;}
        
        if (typeof(msg) == 'string') {
            this.logData += msg + "\n\n";
        } else {
            for (var i=0; i<msg.length; i++) {
                this.logData += msg[i] + "\n\n";
            }
        }
        
        // this.logData = Ext.util.Format.trim(this.logData);
        
        // Ext.util.Format.htmlEncode(
        // viewDiv.innerHTML = '<pre><code class="'+selectedLang+'">'+t1.value.escape()+"</code></pre>";
        var obj = hljs.highlight('sql', this.logData);
        var t = '<pre><code class="sql">' + obj.value + '</code></pre>';
        this.body.update(t);
        // this.memoLog.setValue(t);
    }
//------------------------------------------------------------------------------------------------------------------------------------------------
});