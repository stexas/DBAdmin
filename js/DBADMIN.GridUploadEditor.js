var nombreimagen = "";
//var ImageForm ="";
Ext.namespace('DBADMIN');

DBADMIN.GridUploadEditor = Ext.extend(Ext.Window, {

	initComponent: function() {
		
	  this.valor ="";
	  var msg = function(title, msg){
			Ext.Msg.show({
				title: title,
				msg: msg,
				minWidth: 200,
				modal: true,
				icon: Ext.Msg.INFO,
				buttons: Ext.Msg.OK
			});
		};

		 this.preview = new Ext.Panel({  
			width:172,  
			height:180,
			align:'center'			
		 });  

		//FORMULARIO ----------------------------------------
		if(!this.ImageForm){
		 this.ImageForm = new Ext.FormPanel({
			fileUpload: true,
			/*frame: true,*/
			id: 'ImageForm',       
			width: 500,
			autoHeight: true,
			labelWidth: 50,
			listeners: {
				'fileselected': function(ImageForm, v){				
				}
			},
			defaults: {
									anchor: '95%',
									allowBlank: false,
									msgTarget: 'side'
								},
			items: [
			{
				fieldLabel:'Image',
				id:'img'
			},
			{
				
				xtype: 'fileuploadfield',
				id: 'form-file',
				emptyText: 'Select an image',
				fieldLabel: 'Photo',
				name: 'photo-path',
				buttonText: '',
				buttonCfg: {
					iconCls: 'upload-icon'
				}
	
			}
			,
								{
									xtype: 'hidden',
									fieldLabel: 'Server',
									name: 'servidor',
									value: servidor_db,
									
								},
								{
									xtype: 'hidden',
									fieldLabel: 'DataBase',
									name: 'bd',
									value: _db,
									
								},
								{
									xtype: 'hidden',
									fieldLabel: 'Table',
									name: 'tabla',
									value: _tbl,
									
								},
								{
									xtype: 'hidden',
									fieldLabel: 'Campo valor',
									name: 'campo_valor',
									allowBlank:true,
									value: campo_valor,
									
					
								},
															{
									xtype: 'hidden',
									fieldLabel: 'Campo name',
									name: 'campo_nombre',
									allowBlank:true,
									value: campo_nombre,
									
					
								},
															{
									xtype: 'hidden',
									fieldLabel: 'Condition name',
									name: 'condicion_nombre',
									allowBlank:true,
									value: condicion_nombre,
								},
															{
									xtype: 'hidden',
									fieldLabel: 'Condition value',
									name: 'condicion_valor',
									allowBlank:true,
									value: condicion_valor,
								}],
			buttons: [{
				text: 'Upload File',
				handler: function(){
					formulario = Ext.getCmp('ImageForm');
					if(formulario.getForm().isValid()){
						formulario.getForm().submit({
							url: 'handleupload.php',
							waitMsg: 'Uploading your file...',
							success: function(ImageForm, request){
								responseData = Ext.util.JSON.decode(request.response.responseText); 
								src = 'uploads/' +_server +'/' +_db +'/' +_tbl +'/' +responseData.fichero;
								Ext.get('preview').dom.src = src;  
								msg('Success', responseData.message);
								var v = responseData.fichero;
								nombreimagen = responseData.fichero;
								this.valor = v;
							},
							failure: function(ImageForm, request){
								responseData = Ext.util.JSON.decode(request.response.responseText);
								msg('Failed','Error: '+responseData.message+'\n file:' +responseData.fichero);
							}
						});
					}
				 }
			}]
		});
		
	
		}
	
		//Contenedor -----------------------------------------------------
        Ext.apply(this, {
			plain: true,
			layout:'column',
			modal:'true',
			closable: true,
			iconCls: 'icon-info',
			id:'TableWin',
			width:280,
			minWidth:280,
			minHeight:140,
			layout:'fit',
			border:false,
			closable:true,
			collapsible:false,
			title:'Image',
			items: [this.ImageForm, this.preview],
			buttons: [
				{text: 'OK', iconCls: 'icon-ok', handler: this.saveItem, scope: this},
				{text: 'Cancel', iconCls: 'icon-cancel', handler: this.cancelItem, scope: this}
			],
			border: false,
           // html: s,
            resizable: false,
			buttonAlign: 'left',
		});
		
		// .superclass.initComponent.call(this);        
		DBADMIN.About.superclass.initComponent.apply(this, arguments);
				this.on('show', 
					function() {
						this.ImageForm.focus();
										
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
	saveItem: function() {
		//var v = this.ImageForm.photo-path.getValue();
		formulario = Ext.getCmp('ImageForm');
		//campo =Ext.get(formulario.items[0].id)
		//form-file
		//photo-path
		/*
		v = Ext.get('form-file').dom.value;
		alert('nombre imagen:' +v);
		alert(nombreimagen);*/
		this._editObj.record.set(this._editObj.field, nombreimagen);
		//ImageForm ="";
		this.close();
        // this.recordForm.show(record, grid.getView().getCell(row, col));
	}
//------------------------------------------------------------------------------------------------------------------------------------------------	
	,

 editItem: function(e,_ruta,_server,_db,_tbl,_file) {    

		this._ruta = _ruta;
		this._server = _server;
		this._db = _db;
		this._tbl = _tbl;
		this._file = e.value;
	
		this._editObj = e;
		this.setTitle(e.field);
		if(e.value=='undefined'){
			src = 'uploads/null.png';	
                        this.preview.html='<img id="preview" src="' +src +'" />';
		}else{
			src = 'uploads/' +_server +'/' +_db +'/' +_tbl +'/' +this._file;
			//alert(src);
                        this.preview.html='<img id="preview" src="' +src +'" width="172" height="180" />';
		}

		if(e.value != null){
               // this.imagePanel.html= '<img src="uploads/' +e.value+'" />';
		}

		
		this.show();
	}

//------------------------------------------------------------------------------------------------------------------------
})
// END -------------------------------------------------------------------------------------------------------------------------------------------