Ext.namespace('DBADMIN'); 

DBADMIN.DBTree = Ext.extend(Ext.tree.TreePanel, {
	
	initComponent: function() {
        
		Ext.apply(this, {
			loader: new Ext.tree.TreeLoader({
				dataUrl: DBADMIN.ENGINE_URL,
				baseParams: {cmd: 'getMainTree'}
			}),
			tbar: [
                {text: '', iconCls: 'icon-plus', handler: this.addNewObj, scope: this, disabled: true},
				{text: '', iconCls: 'icon-minus', handler: this.onDeleteNodes, scope: this},
                '-',
                {iconCls: 'icon-edit', handler: this.editNode, scope: this, disabled: true},
                {iconCls: 'icon-gear', handler: this.manageNode, scope: this, hidden: true},
                '-',
                {iconCls: 'icon-sql', handler: this.newSqlQuery, scope: this},
                '->',
                {text: '',
				 iconCls: 'x-tbar-loading', // 'icon-refresh',
				 scope: this,
				 handler: function() { Ext.each(this.getSelectionModel().getSelectedNodes(), function(node) { node.reload() }, this); }
                }
			], 
        	root: new Ext.tree.AsyncTreeNode({
	            expanded: false,
				pid: 'root'
	        }),
			keys: [{
				key: Ext.EventObject.DELETE,
				scope: this,
				handler: this.onDeleteNodes
			}],
	        trackMouseOver: false,
            ddGroup: 'DBADMIN',
            rootVisible: false,
			enableDD: true,
            animate: false,
			containerScroll: true,    // True to register this container with the Scrollmanager for auto scrolling during drag operations. 
            selModel: new Ext.tree.MultiSelectionModel()
	/**        listeners: {
	            click: function(n) {
	                Ext.Msg.alert('Navigation Tree Click', 'You clicked: "' + n.attributes.text + '"');
	            }
	        } */
        });

		
		// DBADMIN.DBTree.superclass.initComponent.call(this);
		DBADMIN.DBTree.superclass.initComponent.apply(this, arguments);
		
        this.tplInfo = new Ext.XTemplate('<table class="node-info"><tpl for="_info"><tr><td><b>{k}</b></td><td>{v}</td></tr></tpl></table>',
                                         {compiled: true});
        
        this.on('beforemovenode', this.onBeforeMoveNode, this);
        this.on('beforeclick', this.onBeforeClick, this);
		this.on('contextmenu', this.onContextMenu, this);
        this.on('expandnode', function(node) { if (node === this.root) { this.root.childNodes[0].select(); }}, this);
	
		// Add NodePath to the params
		this.loader.on('beforeload', function(treeLoader, node) {
			this.baseParams.crumb = node.getPath('pid');   //node.attributes.category;
		}, this.loader);

		// display an ErrorMessage if a node can't be expanded
		this.loader.on('loadexception', function(loader, node, response) {
			node.leaf = false; //force it to folder?
            node.loaded = false;
            // node.reload.defer(10,node);  // autoreload after 10 miliseconds
			// Ext.Msg.alert('Error' + response.responseText);
			Ext.Msg.show({
				title: 'Error',
				msg: response.responseText,
				buttons: Ext.Msg.OK,
				icon: Ext.Msg.ERROR
			});
		}, this.loader);
		
		// Load Server List
		this.root.expand();
	}, 
//------------------------------------------------------------------------------------------------------------------------------------------------
    onContextMenu: function(node, e) {
        // Don't forget to add {stopEvent:true} when registering contextmenu handlers, otherwise the browser menu will also show.
        e.stopEvent();
        
        // select the node only if user didn't select multiple nodes
        if (this.getSelectionModel().getSelectedNodes().length < 2) {
            node.select();
        }
        
        var cm; // = node.getOwnerTree().contextMenu;
        var ico = node.attributes.iconCls; // level = node.getDepth();
        
        if (ico == 'icon-server') {
            cm = this.getContextMenu('server');
        } else if (ico == 'icon-db') {
            cm = this.getContextMenu('db');
        } else if (ico == 'icon-tbl2' || ico == 'icon-tblview2' || ico == 'icon-tblview_off2') {
            cm = this.getContextMenu('table');
        } else {
            return; // no context menu
        }

        // Register the context node with the menu so that a Menu Item's handler function can access
        // it via its parentMenu property.

        cm.contextNode = node;
        cm.showAt(e.getXY());
    },
//------------------------------------------------------------------------------------------------------------------------------------------------
	afterRender: function() {
        // call parent
        DBADMIN.DBTree.superclass.afterRender.apply(this, arguments);
    },
//------------------------------------------------------------------------------------------------------------------------------------------------
    onBeforeMoveNode: function(tree, node, oldParent, newParent, index) {
        return false;
    },
//------------------------------------------------------------------------------------------------------------------------------------------------
    onBeforeClick: function(node, e) {
        // this.pnInfo.body.update(Ext.encode(node.attributes._info));
        if (node.attributes._info) {
            this.tplInfo.overwrite(this.pnInfo.body, node.attributes);
        } else {
            this.pnInfo.body.update('');
        }
        this.pnInfo.setTitle(node.text);  // ,node.attributes.iconCls
        
        return true;
    },
//------------------------------------------------------------------------------------------------------------------------------------------------
    manageNode: function() {
        this.selectPath('/root/neonetMD/biomass/tables/site', 'pid');
    },
//------------------------------------------------------------------------------------------------------------------------------------------------
    newSqlQuery: function() {
		
        var ary = this.getSelectionModel().getSelectedNodes();
        if (!ary) { return; } // { ary = [this.getRootNode().childNodes[0]] }
        
		// if (!node) { node = this.getRootNode().childNodes[0] }
        
        for (var i=0; i<ary.length; i++) {
            var node = ary[i];
            this.openSqlQuery(node, i+1 == ary.length);
        }
    },
//------------------------------------------------------------------------------------------------------------------------------------------------    
    openSqlQuery: function(node, withLayout) {
        var pids = this._explodePids(node.getPath('pid'));
        
        var serverId = pids[0];
        var serverNode = this.getRootNode().findChild('pid', serverId);
        var serverTitle = serverNode.text;
        var dbName = pids[1] || null; 
		dbList = [];
        
        // for (var n in serverNode.childNodes) {
        for (var i=0; i<serverNode.childNodes.length; i++) {
            var n = serverNode.childNodes[i];
            dbList.push(n.text);
        }
        
		var pn = new DBADMIN.SqlQuery({serverId: serverId, serverTitle: serverTitle, dbName: dbName, dbList: dbList});
		
		this.pnWnd.add(pn);
		if (withLayout) {
            this.pnWnd.setActiveTab(pn);
            this.pnWnd.doLayout();
        }
},    
//------------------------------------------------------------------------------------------------------------------------------------------------
	_delNodes: function(nodes) {
		
        // get all crumbs, join them
        // ...
        var ary = [];
        Ext.each(nodes, function(n){ ary.push(n.getPath('pid')) }, this);
        var crumbs = ary.join(',');
        
        Ext.Ajax.request({        
			url: DBADMIN.ENGINE_URL,
			params: {
				cmd: 'treeDelNodes', 
                crumbs: crumbs
			},
			
			success: function (resp,opt) {
				var r = Ext.decode(resp.responseText);
				
                DBADMIN.logSql(r.debugSQL);
                //ary = [];
                //Ext.each(r['deletedNodes'], function(crumb){ ary.push(crumb) }, this);
                
                // removing successfully deleted nodes on the server
                // Ext.each(nodes, function(n) {} ....  bad code: removing nodes invalidates the iterator.
                // for (var i=0; i<nodes.length; i++) {  // this also doesn't work: nodes.length changes with each iteration
                for (var i=nodes.length-1; i>=0; i--) {
                    var n = nodes[i];
                    if (! n) { continue; }
                    if (r['deletedNodes'].indexOf(n.getPath('pid')) != -1) { n.remove(); }
                }
                
                // check for the overall success flag
                if (!r.success) {
					Ext.Msg.show({
						title: 'Error',
						msg: Ext.encode(r.msg), //r.error,
						buttons: Ext.Msg.OK,
						icon: Ext.Msg.ERROR
					});
				}
			}.createDelegate(this),

			failure: function (resp,opt) {
				Ext.Msg.show({
					title: 'Server Error',
					msg: 'An Internal Server Error occured',
					buttons: Ext.Msg.OK,
					icon: Ext.Msg.ERROR
				});
				
			}
		});
	},
	
//------------------------------------------------------------------------------------------------------------------------------------------------
	onDeleteNodes: function() {
            /*
		nodes = this.getSelectionModel().getSelectedNodes();
		if (! nodes.length) { return; }
		
        if (nodes.length > 1) {
            var msg = 'Drop ' + nodes.length + " objects ?";
        } else {
            var msg = "Drop '" + nodes[0].attributes.pid + "' object ?";
        }
        
		// alert(' Delete ' + node.getPath('pid') + ' ?');
		Ext.Msg.show({
			title: 'Drop object...', 
			msg: msg,
			icon: Ext.Msg.QUESTION,
			buttons: Ext.Msg.YESNO,
			scope: this,
			fn: function(btn){
					if (btn == 'yes') {
						this._delNodes(nodes);
					}
		   }
		});
                */
	},
				
//------------------------------------------------------------------------------------------------------------------------------------------------
	getContextMenu: function(tip) {
		switch (tip) {
            case 'server':
                if (! this.cmMenuServer) {
                    this.cmMenuServer = new Ext.menu.Menu({
                        items: [{text: 'Process List', disabled: true}, 
                                {text: 'System Variables', disabled: true}, 
                                {text: 'Status Variables', disabled: true}]
                    });
                }
                return this.cmMenuServer;
                break;
            case 'db': 
                if (! this.cmMenuDatabase) {
                    this.cmMenuDatabase = new Ext.menu.Menu({
                        items: [{text: 'Create Database...', disabled: true}, {text: 'Drop Database', disabled: true}]
                    });
                }
                return this.cmMenuDatabase;
                break;
            case 'table':
                if (! this.cmMenuTable) {
                    this.cmMenuTable = new Ext.menu.Menu({
                        items: [{text: 'Edit Data', iconCls: 'icon-tbl_edit', handler: this.onTblEdit, scope: this},   // createDelegate(
                                {text: 'Manage Columns', iconCls: 'icon-col_man', disabled: false},
                                {text: 'Manage Indexes', iconCls: 'icon-idx_man', disabled: false},
                                '-', 
                                {text: 'Rename', iconCls: 'icon-edit', disabled: false},
                                {text: 'Drop', iconCls: 'icon-minus', handler: this.onDeleteNodes, scope: this}
                               ]
                    });
                }
                return this.cmMenuTable;
                break;
        }
	},
	
//------------------------------------------------------------------------------------------------------------------------------------------------
	onTblEdit: function() {

        var ary = this.getSelectionModel().getSelectedNodes();
        if (!ary) { return; } // { ary = [this.getRootNode().childNodes[0]] }
        
		// if (!node) { node = this.getRootNode().childNodes[0] }
        
        for (var i=0; i<ary.length; i++) {
            var node = ary[i];
            var ico = node.attributes.iconCls;
            if (ico == 'icon-tbl2' || ico == 'icon-tblview2' || ico == 'icon-tblview_off2') {
                this.editTableData(node, i+1 == ary.length);
            }
        }
    },
//------------------------------------------------------------------------------------------------------------------------------------------------
    editTableData: function(node, withLayout) {
        // var node = btn.parentMenu.contextNode;
		var pids = this._explodePids(node.getPath('pid'));
		
		var pn = new DBADMIN.DBTable({serverId: pids[0], dbName: pids[1], tblName: pids[3]});
		
   		this.pnWnd.add(pn);
		if (withLayout) {
            this.pnWnd.setActiveTab(pn);
            this.pnWnd.doLayout();
        }
	},
//------------------------------------------------------------------------------------------------------------------------------------------------
	_explodePids: function (pids) {
		var ary = pids.split('/');
		ary.shift(); // remove the first empty element
		ary.shift(); // remove the second 'root' element
		return ary;
	}
});

Ext.reg('meDBTree', DBADMIN.DBTree); // register xtype
 
