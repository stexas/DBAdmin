Ext.namespace('DBADMIN');

DBADMIN.About = Ext.extend(Ext.Window, {
	
	initComponent: function() {

var s = '<div style="line-height: 1.7">';

        s += 'Powered By:';
        s += '<table style="width: 100%; background-color: #fff"><tr>';
        s += '<td><a onclick="window.open(this.href); return false;" href="http://www.extjs.com/"><img src="i/logo_extjs.png" width="90" height="22" alt="ExtJS - A foundation you can build on" title="ExtJS - A foundation you can build on" /></a></td>';
        s += '<td style="text-align: center"><a onclick="window.open(this.href); return false;" href=""><img src="i/logo_php.gif" width="44" height="26" alt="PHP - Hypertext Preprocessor" title="PHP - Hypertext Preprocessor" /></a></td>';
        s += '<td style="text-align: right"><a onclick="window.open(this.href); return false;" href="http://mysql.com/"><img src="i/logo_mysql.gif" width="65" height="29" alt="MySql - The world\'s most popular open source database" title="MySql - The world\'s most popular open source database" /></a></td>';
        s += '</tr></table>';
        
        Ext.apply(this, {
			title: 'About DBAdmin',
			plain: true,
			closable: true,
			iconCls: 'icon-info',
			// items: [grid],
			height: 180,
			width: 300,
			layout: 'fit',
			// closeAction: 'hide',
			border: false,
            html: s,
            resizable: false,
			buttonAlign: 'center',
            buttons: [
				{text: 'OK', handler: function() {this.close()}, scope: this} // iconCls: 'icon-ok',
			]
		});
		
		// .superclass.initComponent.call(this);        
		DBADMIN.About.superclass.initComponent.apply(this, arguments);
	}
//------------------------------------------------------------------------------------------------------------------------------------------------	
	
})
// END -------------------------------------------------------------------------------------------------------------------------------------------
