Ext.onReady(function () {
  Drupal.css_gen.catStore = Ext.create('Ext.data.TreeStore', {
    proxy: {
      type: 'ajax',
      url: Drupal.settings.basePath + 'style_manager/get_cat_list.json',
      extraParams: {
        token: Drupal.settings.style_manager.token
      }
    }
  });

  Drupal.css_gen.catTree = Ext.create('Ext.tree.Panel', {
    store: Drupal.css_gen.catStore,
    rootVisible: false,
    useArrows: true,
    frame: false,
    singleExpand: true,
    width: 170,
    anchor: '100%',
    tbar: [
      {
        text: 'New category',
        iconCls: 'new_category_icon',
        id: 'style_manager_btn_category_new',
        disabled: false,
        handler: function () {
          style_manager_settings('');
        }
      }
    ],
    listeners: {
      selectionchange: function (selModel, selections) {
        Ext.getCmp('style_manager_cat_table').enable();
        Ext.getCmp('style_manager_el_form').enable();
        if (!selections[0]) {
          Drupal.css_gen.selected_cat = false;
          Drupal.css_gen.selected_cat_arr = [];
          Ext.getCmp('style_manager_btn_category_settings').setDisabled(true);
          Ext.getCmp('style_manager_el_form').disable();
          Ext.getCmp('style_manager_cat_table').disable();
          return false;
        }
        if (selections[0].data.depth == 1) {
          Drupal.css_gen.selected_cat = selections[0].data.id;
          Drupal.css_gen.selected_cat_arr = [selections[0].data.id];
          Drupal.css_gen.previous_selected_preset = '';
          Drupal.css_gen.previous_proxy = '';
          Drupal.css_gen.styleStore.removeAll();
        }
        else {
          Drupal.css_gen.selected_cat_data = selections[0];
          Drupal.css_gen.selected_cat = selections[0].data.id;
          Drupal.css_gen.selected_cat_arr = selections[0].data.id.split('--');
          if (Drupal.css_gen.selected_cat_arr[1]
              && Drupal.css_gen.selected_cat_arr[1] != 'disable'
              && (!Drupal.css_gen.previous_proxy
                 || Drupal.css_gen.previous_proxy != Drupal.css_gen.selected_cat_arr[0])
          ) {
            Drupal.css_gen.previous_proxy = Drupal.css_gen.selected_cat_arr[0];
            Drupal.css_gen.styleStore.load({url: Drupal.css_gen.styleStoreProxy.url + '?cat=' + selections[0].data.id});
          }
          else {
            Drupal.css_gen.styleGrid.getSelectionModel().deselectAll();
          }
          if (Drupal.css_gen.selected_cat_arr[1]) {
            Drupal.css_gen.upd_page_styles();
            if (Drupal.css_gen.selected_cat_arr[0] != Drupal.css_gen.previous_selected_cat) {
              Drupal.css_gen.upd_page_styles(Drupal.css_gen.previous_selected_cat);
            }
            if (Drupal.css_gen.selected_cat_arr[1] == 'disable') {
              Ext.getCmp('style_manager_el_form').disable();
              Ext.getCmp('style_manager_cat_table').disable();
            }
          }
          Drupal.css_gen.previous_selected_preset = Drupal.css_gen.selected_cat_arr[1];
          Drupal.css_gen.previous_selected_cat = Drupal.css_gen.selected_cat_arr[0];
        }
      }
    }
  });
});