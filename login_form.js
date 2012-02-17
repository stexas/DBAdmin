/*
 * Ext JS Library 2.2.1
 * Copyright(c) 2006-2009, Ext JS, LLC.
 * licensing@extjs.com
 * 
 * http://extjs.com/license
 */

Ext.onReady(function(){

    Ext.QuickTips.init();

    // turn on validation errors beside the field globally
    Ext.form.Field.prototype.msgTarget = 'side';

    var bd = Ext.getBody();

    /*
     * ================  Simple form  =======================
     */
    bd.createChild({tag: 'h3', html: 'Database Management '});

	var buttonHandler = function(button,event) {
		data = simple.form.submit({
			url:'login_try.php', 
			method:'GET',
			waitMsg:'Login process...',
			success:doneFunction,
			failure:errores
		});
		
	};  
	
	var errores =  function(form,action) {
		Ext.MessageBox.show({  
                        title: 'Incorrect Login',  
                        msg: 'Inorrect login, please be sure you write the correct: \n User name \n Password',  
                        buttons: Ext.MessageBox.OK,  
                        icon: Ext.MessageBox.INFO  
                    });
	}
	var doneFunction = function(form,action) {
	//alert("Ir a index.php");
  
		document.location='index.php';
	}


    var simple = new Ext.FormPanel({
        labelWidth: 75, // label settings here cascade unless overridden
        url:'login_try.php',
		method: 'POST', 
        frame:false,
        title: 'Login Area',
        bodyStyle:'padding:5px 5px 0',
        width: 350,
        defaults: {width: 230},
        defaultType: 'textfield',

        items: [{
                fieldLabel: 'User Name',
                name: 'user_name',
                allowBlank:false
            },{
                fieldLabel: 'Password',
                name: 'password',
				inputType: 'password'
            }
        ],

        buttons: [{
            text: 'Login'
			,formBind:true
			,scope:this
			,handler:buttonHandler
        }]
		
    });

    simple.render(document.body);

    
});

