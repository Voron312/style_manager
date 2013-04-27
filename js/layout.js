  Ext.require([
    'Ext.tip.*',
    'Ext.form.*',
    'Ext.window.Window',
    //'Ext.state.*',
    'Ext.window.MessageBox',
    'Ext.tip.QuickTipManager',
    'Ext.tip.*',
    'Ext.tree.*',
    'Ext.data.*'
  ]);
  Ext.scopeResetCSS = true;

  Ext.onReady(function () {
    if (Ext.getCmp('style_manager_el_form') || (Drupal.overlay && Drupal.overlay.isOpen)) {
      return false;
    }
    Ext.tip.QuickTipManager.init();
    Drupal.css_gen.add_style_settings_btn();
    //Ext.state.Manager.setProvider(Ext.create('Ext.state.CookieProvider'));
    var border = Ext.create('Ext.panel.Panel', {
      layout: {
        type: 'border'
      },
      stateId: 'stateBorder',
      stateful: true,
      border: false,
      items: [
        {
          region: 'west',
          id: 'west-panel',
          title: 'Category and presets',
          iconCls: 'categories_icon',
          split: true,
          border: false,
          width: 175,
          minWidth: 175,
          maxWidth: 175,
          layout: 'fit',
          items: Drupal.css_gen.catTree
        },
        {
          region: 'center',
          title: 'Groups',
          iconCls: 'category_icon',
          id: 'style_manager_cat_table',
          border: false,
          width: 175,
          minWidth: 175,
          maxWidth: 175,
          layout: 'fit',
          items: Drupal.css_gen.styleGrid
        },
        {
          split: true,
          width: 695,
          height: 440,
          title: 'Settings',
          iconCls: 'category-item_icon',
          region: 'east',
          border: false,
          //layout: 'fit',
          autoScroll: false,
          id: 'style_manager_el_form',
          items: [
            {
              //layout: 'fit',
              height: 440,
              frame: true
            }
          ]
        }
      ]
    });


    Drupal.css_gen.output_css_win = Ext.create('Ext.window.Window', {
      title: 'Output CSS',
      stateful: true,
      stateId: 'stateOutputCssWindow',
      height: 300,
      width: 800,
      layout: 'fit',
      plain: true,
      closeAction: 'hide',
      items: [
        {
          autoScroll: true,
          html: '<pre id="style_manager_output_css"ospace; font-size: 14px; line-height: 120%;"></pre>'
        }
      ],
      listeners: {
        afterrender: function () {
          Drupal.css_gen.upd_page_output_css_textarea();
        }
      }
    });

    var css_gen_win_width = 1065;
    Drupal.css_gen.win = Ext.create('Ext.window.Window', {
      title: 'Style Manager',
      iconCls: 'status',
      collapsible: true,
      stateful: true,
      resizable: false,
      stateId: 'stateWindow',
      height: 500,
      width: css_gen_win_width,
      minWidth: css_gen_win_width,
      maxWidth: css_gen_win_width,
      minHeight: 400,
      layout: 'fit',
      plain: true,
      animateTarget: 'style_settings_btn',
      closeAction: 'hide',
      items: border,
      listeners: {
        afterrender: function () {
          jQuery('link[href*="style_manager_cache/css"]').remove();
          Drupal.css_gen.upd_page_styles();
          Ext.getCmp('style_manager_el_form').disable();
          Ext.getCmp('style_manager_cat_table').disable();
        }
      },
      tools: [
        {
          handler: function () {
            Drupal.css_gen.output_css_win.show();
          },
          is: 'style_manager_gear_btn',
          type: 'gear'
        }
      ]
    });

    Drupal.css_gen.loadMask = new Ext.LoadMask(Ext.getCmp('style_manager_el_form'), {msg: "Please wait...", shadow: true, shrinkWrap: true});
//    Drupal.css_gen.win.show();
    jQuery('body').removeClass('x-body');
  });