Ext.namespace('DBADMIN'); 

DBADMIN.ENGINE_URL = 'engine.php'; 
Ext.BLANK_IMAGE_URL = 'i/extjs-blank.gif'; // '/ext/resources/images/default/s.gif'; // reference local blank image
DBADMIN.NULL_VALUE = '<img style="width: 24px; height: 11px; vertical-align: middle" src="i/null.png" />'

// DBADMIN.debugSQL = 1;


//-------------------------------------------------------------------------------------------

hljs.initHighlightingOnLoad();

// application main entry point
Ext.onReady(function() {
 
    
    Ext.QuickTips.init();
	// Apply a set of config properties to the singleton
    
    Ext.Ajax.extraParams = {
        'debugSQL': 0   // if true, every AJAX response will contain an array of SQL statements: Array $r['debugSQL']
    };

    
	Ext.apply(Ext.QuickTips.getQuickTip(), {
		// maxWidth: 200,
		// minWidth: 100,
		showDelay: 1500
		// trackMouse: true
	});

	var pnWnd = new Ext.TabPanel({
		region: 'center',
		// xtype: 'tabpanel',
		items: [{
			title: 'Dashboard',
			xtype: 'panel'
		}]
		// , layoutOnTabChange: true
	});
	
    DBADMIN.mainTabPanel = pnWnd;
    
	var pnInfo = new Ext.Panel({
		region: 'south',
        height: 160,
        collapsible: true,
		split: true,
        bodyStyle: 'background-color: #eee;',
        autoScroll: true,
        title: 'Info',
        iconCls: ''
        // titleCollapse: true
    });
    
    var dbTree = new DBADMIN.DBTree ({
		region: 'center',
		title: '',
		// xtype: 'meDBTree',
		width: 250,
		autoScroll: true,
		split: true,
		pnWnd: pnWnd,      // where to open tabsheets
        pnInfo: pnInfo     // where to display additional node info
	});
    
    var pnLeft = new Ext.Panel({
        region: 'west',
        collapsible: true,
        collapseMode: 'mini',
		split: true,
        animate: false,        
        border: false,
        width: 250,
        layout: 'border',
        items: [dbTree, pnInfo]
    });
 
    var vp = new Ext.Viewport({
	    layout: 'border',
	    items: [
		{
	        region: 'north',
	        xtype: 'toolbar',
			items: [{
				text: 'Server',
				menu: {
					items: [{text: 'Process List', disabled: true}, 
                            '-', 
                            {text: 'System Variables', disabled: true}, {text: 'Status Variables', disabled: true}, 
                            '-', 
                            {text: 'Flush...', disabled: true},
                            
                            {text: 'Exit',  handler: function() { 
                                    document.location ='logout.php';
                                     }, scope: this }
                    ]
				}
			}, {
				text: 'Database',
				menu: {
					items: [{text: 'Create Database...', disabled: true}, {text: 'Drop Database', disabled: true}]
				}
			}, {
				text: 'Table',
				menu: {
					items: [
                            {text: 'Edit Data', iconCls: 'icon icon-tbl_edit', handler: dbTree.onTblEdit, scope: dbTree},
                            '-',
                            {text: 'Filter Columns', iconCls: 'icon-col_filter', disabled: false},
                            {text: 'Manage Columns', iconCls: 'icon-col_man', disabled: true}, 
                            {text: 'Manage Indexes', iconCls: 'icon-idx_man', disabled: true}
                           ]
				}
			}, 
            '-',
            {
                text: 'Tools',
                menu: {
                    items: [{text: 'SQL Monitor', iconCls: 'icon-terminal', handler: SqlMonitorClick, scope: this}]
                }
            },
			'->',
            {text: 'About', iconCls: 'icon-info', handler: function() { var t = new DBADMIN.About(); t.show(); }, scope: this},
			{text: 'Homepage', iconCls: 'icon-globe', handler: function(){ window.open('http://www.stexas.es/dbadmin/','homepage');} }
			]
		},        
		pnLeft,
		pnWnd
	    ]
	});
	
    DBADMIN.logSql = function(items) {
        var pn = Ext.getCmp('pnSqlMonitor');
        if (!pn) {return;}
        
        pn.log(items);
    }
    
    setTimeout(function(){
        Ext.get('loading').remove();
        Ext.fly('loading-mask').fadeOut({
			remove:true,
			callback : function() {
			}
		
		});
    }, 250);

});  
//------------------------------------------------------------------------------------------------------------------------------------------------
function SqlMonitorClick() {
    var tpMain = DBADMIN.mainTabPanel;
    var pn = Ext.getCmp('pnSqlMonitor');
    if (pn) {
        tpMain.setActiveTab(pn);
    } else {
        pn = new DBADMIN.Monitor({id: 'pnSqlMonitor'});
        tpMain.add(pn);
        tpMain.setActiveTab(pn);
        tpMain.doLayout();
    }
}
//------------------------------------------------------------------------------------------------------------------------------------------------