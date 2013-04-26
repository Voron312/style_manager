Ext.require([
  'Ext.grid.*',
  'Ext.data.*',
  'Ext.util.*'
]);

Ext.onReady(function () {
  Drupal.css_gen.autosave();
  Ext.define('styleModel', {
    extend: 'Ext.data.Model',
    fields: ['id', 'title']
  });

  Drupal.css_gen.styleStoreProxy = {
    type: 'ajax',
    url: Drupal.settings.basePath + 'style_manager/get_category_groups.json',
    extraParams: {
      token: Drupal.settings.style_manager.token
    },
    simpleSortMode: true
  };
  Drupal.css_gen.styleStore = Ext.create('Ext.data.Store', {
    id: 'styleStore',
    model: 'styleModel',
    remoteSort: false,
    proxy: Drupal.css_gen.styleStoreProxy,
    listeners: {
      load: function () {
        if (Ext.getCmp('settings_window')) {
          Ext.getCmp('settings_window').focus();
        }
      }
    }
  });

  Drupal.css_gen.styleGrid = Ext.create('Ext.grid.Panel', {
    anchor: '100%',
    hideHeaders: true,
    store: 'styleStore',
    columns: [
      {
        text: 'Id',
        dataIndex: 'id',
        width: 50,
        hidden: true
      },
      {
        text: 'Title',
        dataIndex: 'title',
        flex: 1
      }
    ],
    tbar: [
      {
        text: 'Settings',
        iconCls: 'gear_icon',
        handler: function () {
          style_manager_settings(Drupal.css_gen.selected_cat_arr[0], 1);
        },
        stateful: false
      }
    ],
    listeners: {
      selectionchange: function (selModel, selections) {
        if (selections[0]) {
          Drupal.css_gen.selectrd_group = selections[0].data.title;
          Drupal.css_gen.get_form(Drupal.css_gen.selected_cat);
        }
        else {
          Ext.getCmp('style_manager_el_form').removeAll();
          Ext.getCmp('style_manager_el_form').add({height: 440, frame: true});
          Drupal.css_gen.selectrd_group = false;
          Drupal.css_gen.form_loading(false);
        }
      }
    }
  });
});
