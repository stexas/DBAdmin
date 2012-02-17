Ext.namespace('DBADMIN');

DBADMIN.GridTextEditor = Ext.extend(Ext.Window, {
	
	initComponent: function() {
		
		this.txtPanel = new Ext.Panel({title: 'Text', layout: 'fit'});
		this.htmlPanel = new Ext.Panel({title: 'HTML', layout: 'fit'});
		
		this.tp = new Ext.TabPanel({
			xtype: 'tabpanel',
			border: true,
			hideBorders: true,
			plain: true,
			layoutOnTabChange: true,
			tabPosition: 'bottom',
			items: [this.txtPanel, this.htmlPanel],
			listeners: {
				beforetabchange: {fn: this.prepareTabPanel, scope: this},
				tabchange: {buffer: 10, fn: function(tp, pn){ pn == this.txtPanel ? this.txtEdit.focus() : this.htmlEdit.focus() }, scope: this}
			}
		});
		
		Ext.apply(this, {
			// title: this.editObj.field,
			plain: true,
			closable: true,
			iconCls: 'icon-txt',
			// items: [grid],
			height: 420,
			width: 550,
			layout: 'fit',
			closeAction: 'hide',
			border: false,
			items: [this.tp],
			buttons: [
				{text: 'OK', iconCls: 'icon-ok', handler: this.saveItem, scope: this},
				{text: 'Cancel', iconCls: 'icon-cancel', handler: this.cancelItem, scope: this}
			]
		});
		
		// .superclass.initComponent.call(this);        
		DBADMIN.GridTextEditor.superclass.initComponent.apply(this, arguments);
		
		this.on('show', 
				function() {
                    this.tp.getActiveTab() == this.txtPanel ? this.txtEdit.focus()
                                                            : this.htmlEdit.focus();
				},
				this,
				{buffer: 10}
		);
        
		this.on('hide', 
				function() {
                    var e = this._editObj;
                    e.grid.getView().focusCell(e.row, e.column);
                    // this._editObj.grid.focus(); 
                },
				this,
				{buffer: 50}
		);        

	},
//------------------------------------------------------------------------------------------------------------------------------------------------	
	prepareTabPanel: function(tp, newTab, currentTab) {
		if (newTab.title == 'Text') {
			// create the TextEditor
			if (! this.txtEdit) {
				this.txtEdit = new Ext.form.TextArea({});
				newTab.add(this.txtEdit);
                                
				// newTab.doLayout();
			}
			
			// Get&Set Value
			if (this.htmlEdit) { v = this.htmlEdit.getValue(); } else { v = this._editObj.value }
			this.txtEdit.setValue(v);
		} else {
			// create the HtmlEditor
			if (! this.htmlEdit) {
				this.htmlEdit = new Ext.form.HtmlEditor({});
				newTab.add(this.htmlEdit);
				// newTab.doLayout();
			}
			
			// Get&Set Value
			if (this.txtEdit) { v = this.txtEdit.getValue(); } else { v = this._editObj.value }
			this.htmlEdit.setValue(v);
		}
		
	},
//------------------------------------------------------------------------------------------------------------------------------------------------
	saveItem: function() {
		var v = this.tp.getActiveTab() == this.txtPanel ? this.txtEdit.getValue() : this.htmlEdit.getValue();
		this._editObj.record.set(this._editObj.field, v);
		this.hide();
        // this.recordForm.show(record, grid.getView().getCell(row, col));
	},
//------------------------------------------------------------------------------------------------------------------------------------------------	
	cancelItem: function() {
		this.hide();
	},
	
	editItem: function(e) {
           // alert('hola lola');
		this._editObj = e;
		this.setTitle(e.field);
		
		var t = this.tp.getActiveTab();
		if (t == this.txtPanel) {
			this.txtEdit.setValue(e.value);
		} else if (t == this.htmlPanel) {
			this.htmlEdit.setValue(e.value);
		} else {
			// by default, Text editor is used
			this.tp.activate(this.txtPanel);
		}
		
		this.show();
	}
	
})
// END ----------------------------------------------------------------------------------------------------------------------------------------
