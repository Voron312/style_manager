Drupal.css_gen = {
  'id': 'style_manager_class',
  'advanced_numeric_store': {},
  'btn_autosave_pressed': true,
  'autosave_form_time': 500,
  'previous_selected_cat': '',
  'previous_selected_preset': '',

  'add_style_settings_btn': function () {

    jQuery('body').append('<a id="style_settings_btn" href="#"; ></a>');
    jQuery('#style_settings_btn').click(function () {
      if (Drupal.css_gen.win.isVisible()) {
        Drupal.css_gen.win.hide();
      }
      else {
        Drupal.css_gen.win.show();
      }
      return false;
    });
    jQuery('#style_settings_btn').hover(function () {
        Drupal.css_gen.settings_btn_animate_hide = false;
        jQuery(this).stop().animate({width: '30px'}, {duration: 100});
      },
      function () {
        Drupal.css_gen.settings_btn_animate_hide = true;
        setTimeout(function () {
          if (Drupal.css_gen.settings_btn_animate_hide) {
            jQuery('#style_settings_btn').stop().animate({width: "10px"}, {duration: 100});
            Drupal.css_gen.settings_btn_animate_hide = false;
          }
        }, 1000);

      });
  },

  'colorpicker': function () {
    jQuery('.colorpickerfield input').not('.colorpicker_processed').addClass('colorpicker_processed').each(function () {
      new jscolor.color(jQuery(this)[0], {required: false, pickerZIndex: 30000, pickerFaceColor: '#dbe3ed'});
    });
  },

  'ext_fieldset': function () {
    jQuery('.x-fieldset-header-text').not('.processed').addClass('processed').click(function () {
      var fieldset_id = jQuery(this).parents('fieldset:first').attr('id');
      Ext.getCmp(fieldset_id).toggle();
    });
  },

  'get_form': function (cat_id) {
    Drupal.css_gen.form_loading(true);
    jQuery.post(Drupal.settings.basePath + 'style_manager/get_styles_form.json', {cat: cat_id, group: Drupal.css_gen.selectrd_group}, function (data) {
      var form_obj = eval('(' + data + ')');
      Drupal.css_gen.replase_form(form_obj);
    });
  },

  'show_alerts': function (data) {
    if (data['message']) {
      alert(data['message']);
    }
  },


  'preset_item_visibility_settings_upd': function (item, checked){
    var data = {};
    data.cat = Drupal.css_gen.selected_cat;
    data.group = Drupal.css_gen.selectrd_group;
    if (item.global) {
      if (!checked) {
        return ;
      }
      Drupal.css_gen.form_loading(true);
      Drupal.css_gen.preset_item_visibility_changed = false;
      data.key = 'visibility_type';
      data.value = item.id;
    }
    else {
      data.key = item.id;
      data.value = checked;
      Drupal.css_gen.preset_item_visibility_changed = true;
    }
    jQuery.post(Drupal.settings.basePath + 'style_manager/preset_item_visibility_settings_save.json', data, function (data) {
      if (data.key == 'visibility_type') {
        Drupal.css_gen.get_form(data.cat_id);
        Drupal.css_gen.upd_page_styles(data.cat_id);
      }
    }, 'json');
  },

  'replase_form': function (data) {
    if (data.cat_id == Drupal.css_gen.selected_cat) {
      Drupal.css_gen.original_form_data = data;
      Drupal.css_gen.original_menu_data = [];
      jQuery.each(data.presets, function (index, value) {
        if (Drupal.css_gen.selected_cat != value.id && value.id.split('--')[1] != 'disable') {
          Drupal.css_gen.original_menu_data.push({
              text: 'Load from: ' + value.text,
              iconCls: 'reset_from_icon',
              handler: function () {
                Drupal.css_gen.reset_form = true;
                Drupal.css_gen.form_loading(true);
                Drupal.css_gen.get_form(value.id);
              }}
          );
        }
      });
    }
    Drupal.css_gen.preset_item_visibility_changed = false;
    Drupal.css_gen.elements_menu = [];
    jQuery.each(data.visibility_settings, function (index, value) {
      value.checkHandler = Drupal.css_gen.preset_item_visibility_settings_upd;
      value.global = false;
      Drupal.css_gen.elements_menu.push(value);
    });
    if (Drupal.css_gen.reset_form) {
      var visibility_settings_arr = {};
      jQuery.each(data.visibility_settings, function (index, value) {
        visibility_settings_arr[value.id] = value.checked;
      });
      visibility_settings_arr.visibility_type = data.visibility_type;
      var post_data = {};
      post_data.cat = Drupal.css_gen.selected_cat;
      post_data.group = Drupal.css_gen.selectrd_group;
      post_data.visibility_settings = Ext.JSON.encode(visibility_settings_arr);
      jQuery.post(Drupal.settings.basePath + 'style_manager/preset_item_visibility_settings_save_all.json', post_data, function (data) {
      }, 'json');
    }
    Drupal.css_gen.reset_form = false;
    var formPanel = Ext.create('Ext.form.Panel', {
      autoScroll: true,
      id: 'style_manager_form',
      frame: true,
      stateful: false,
      height: 440,
      defaults: { width: 645, stateful: false },
      items: data.form,

      bbar: [
        {
          iconCls: data.visibility_type,
          id: 'style_manager_preset_settings',
          menu: {
            xtype: 'menu',
            stateful: false,
            items: [
              {
                text: 'Show all',
                id: 'show_all',
                global: true,
                checked: (data.visibility_type == 'show_all'),
                checkHandler: Drupal.css_gen.preset_item_visibility_settings_upd,
                group: 'elements_menu'
              },
              {
                text: 'Show selected',
                id: 'show_selected',
                global: true,
                checked: (data.visibility_type == 'show_selected'),
                checkHandler: Drupal.css_gen.preset_item_visibility_settings_upd,
                group: 'elements_menu'
              },
              {
                text: 'Hide selected',
                id: 'hide_selected',
                global: true,
                checked: (data.visibility_type == 'hide_selected'),
                checkHandler: Drupal.css_gen.preset_item_visibility_settings_upd,
                group: 'elements_menu'
              }, '-', {
                text: 'Selected elements',
                menu: {
                  items: Drupal.css_gen.elements_menu
                }
              }
            ],
            listeners: {
              beforehide: function () {
                if (Drupal.css_gen.preset_item_visibility_changed) {
                  Drupal.css_gen.form_loading(true);
                  Drupal.css_gen.get_form(Drupal.css_gen.selected_cat);
                }
              }
            }
          }
        },
        '->',
        {
          text: 'Reset',
          xtype: 'splitbutton',
          minWidth: 85,
          id: 'style_manager_btn_reset_form',
          handler: function () {
            Drupal.css_gen.reset_form = true;
            Drupal.css_gen.form_loading(true);
            Drupal.css_gen.replase_form(Drupal.css_gen.original_form_data);
          },
          stateful: false,
          menu: new Ext.menu.Menu({
            items: Drupal.css_gen.original_menu_data
          })
        },
        '-',
        {
          text: 'Save',
          minWidth: 85,
          id: 'style_manager_btn_save_form',
          handler: Drupal.css_gen.save_form,
          stateful: false
        },
        {
          text: 'Autosave',
          minWidth: 85,
          id: 'style_manager_btn_autosave_form',
          stateful: false,
          enableToggle: true,
          toggleHandler: function (item, pressed) {
            Drupal.css_gen.btn_autosave_pressed = pressed;
          },
          pressed: Drupal.css_gen.btn_autosave_pressed
        }
      ]
    });
    Ext.getCmp('style_manager_el_form').removeAll();
    Ext.getCmp('style_manager_el_form').add(formPanel);

    Drupal.css_gen.form_loading(false);
  },

  'save_form': function () {
    var form = Ext.getCmp('style_manager_form').getForm().getFieldValues();
    jQuery.each(form, function (index, value) {
      if (index.substring(0, 7) == 'ext-gen') {
        delete form[index];
      }
    });
    delete form['type'];
    if (!Object.keys(form).length) {
      return;
    }
    if (this.id && this.id == 'style_manager_class') {
      jQuery.post(Drupal.settings.basePath + 'style_manager/save_styles.json', {field_values: Ext.JSON.encode(form), cat: Drupal.css_gen.selected_cat}, function (data) {
        Drupal.css_gen.upd_page_styles();
        Drupal.css_gen.show_alerts(data);
      }, 'json');
    }
    else {
      Drupal.css_gen.form_loading(true);
      jQuery.post(Drupal.settings.basePath + 'style_manager/save_styles.json', {field_values: Ext.JSON.encode(form), cat: Drupal.css_gen.selected_cat}, function (data) {
        Drupal.css_gen.upd_page_styles();
        Drupal.css_gen.show_alerts(data);
        Drupal.css_gen.form_loading(false);
      }, 'json');
    }
  },

  'autosave': function () {
    var btn = Ext.getCmp('style_manager_btn_autosave_form');
    var save_btn = Ext.getCmp('style_manager_btn_save_form');

    var save_btn_disabled = false;
    if (btn && btn.disabled === false && btn.pressed === true) {
      save_btn_disabled = true;
      var form = Ext.JSON.encode(Ext.getCmp('style_manager_form').getForm().getFieldValues());
      if (Drupal.css_gen.last_cat != Drupal.css_gen.selected_cat) {
        Drupal.css_gen.last_autosave_data = form;
        Drupal.css_gen.last_cat = Drupal.css_gen.selected_cat;
      }
      else if (form != Drupal.css_gen.last_autosave_data) {
        Drupal.css_gen.save_form();
        Drupal.css_gen.last_autosave_data = form;
      }
    }

    if (save_btn) {
      save_btn.setDisabled(save_btn_disabled);
    }
    Drupal.css_gen.colorpicker();
    Drupal.css_gen.ext_fieldset();
    Drupal.css_gen.preset_menu_init();
    Drupal.css_gen.category_menu_init();
    setTimeout(Drupal.css_gen.autosave, Drupal.css_gen.autosave_form_time);

  },

  'form_loading': function (loading) {
    if (loading) {
      if (Ext.getCmp('style_manager_btn_save_form')) {
        Ext.getCmp('style_manager_btn_save_form').setDisabled(true);
        Ext.getCmp('style_manager_btn_reset_form').setDisabled(true);
        Ext.getCmp('style_manager_btn_autosave_form').setDisabled(true);
      }
      Drupal.css_gen.loadMask.show();
    }
    else {
      if (Ext.getCmp('style_manager_btn_save_form')) {
        Ext.getCmp('style_manager_btn_save_form').setDisabled(false);
        Ext.getCmp('style_manager_btn_reset_form').setDisabled(false);
        Ext.getCmp('style_manager_btn_autosave_form').setDisabled(false);
      }
      Drupal.css_gen.loadMask.hide();
    }
  },

  'preset_save_as': function (selected_cat) {
    Ext.MessageBox.prompt('Save preset as', 'Preset name:', function (btn, text) {
      if (btn == 'ok' && text != '') {
        jQuery.post(Drupal.settings.basePath + 'style_manager/preset_save_as.json', {cat: selected_cat, title: text}, function (data) {
          Drupal.css_gen.filter_category_tree_load(data.old_id);
          Drupal.css_gen.show_alerts(data);
        }, 'json');
      }
      if (btn == 'ok' && text == '') {
        Drupal.css_gen.preset_save_as();
      }
    });
  },

  'preset_delete': function (selected_cat) {
    Ext.MessageBox.confirm('Confirm', 'Are you sure you want to delete selectrd preset?', function (btn, text) {
      if (btn == 'yes' && text != '') {
        jQuery.post(Drupal.settings.basePath + 'style_manager/preset_delete.json', {cat: selected_cat}, function (data) {
          Drupal.css_gen.filter_category_tree_load(data.cat_id);
          Drupal.css_gen.show_alerts(data);
        }, 'json');
      }
    });
  },

  'preset_rename': function (selected_cat) {
    Ext.MessageBox.prompt('Rename preset', 'New name:', function (btn, text) {
      if (btn == 'ok' && text != '') {
        jQuery.post(Drupal.settings.basePath + 'style_manager/preset_rename.json', {cat: selected_cat, title: text}, function (data) {
          Drupal.css_gen.filter_category_tree_load(data.new_id);
          Drupal.css_gen.show_alerts(data);
        }, 'json');
      }
      if (btn == 'ok' && text == '') {
        Drupal.css_gen.preset_rename();
      }
    });
  },

  'filter_category_tree_load': function (new_id) {
    Drupal.css_gen.new_tree_id = new_id;
    var cat = '';
    if (Drupal.css_gen.selected_cat_arr) {
      cat = Drupal.css_gen.selected_cat_arr[0];
    }
    jQuery.post(Drupal.settings.basePath + 'style_manager/get_cat_list.json', {selected_cat: cat}, function (data) {
      var root = Drupal.css_gen.catTree.getRootNode();
      root.removeAll();
      root.appendChild(data);
      setTimeout(Drupal.css_gen.select_in_preset_tree, 50);
    }, 'json');
  },

  'set_default_preset': function (selected_cat) {
    jQuery.post(Drupal.settings.basePath + 'style_manager/set_default_preset.json', {cat: selected_cat}, function (data) {
      Drupal.css_gen.filter_category_tree_load(Drupal.css_gen.selected_cat);
    }, 'json');
  },

  'select_in_preset_tree': function () {
    Drupal.css_gen.previous_selected_cat = '';
    Drupal.css_gen.previous_selected_preset = '';
    Drupal.css_gen.catTree.getSelectionModel().select(Drupal.css_gen.catStore.getNodeById(Drupal.css_gen.new_tree_id), true);
  },

  'upd_page_styles': function (selected_cat) {
    if (!Drupal.css_gen.selected_cat && !selected_cat) {
      selected_cat = '';
    }
    else if (!selected_cat){
      selected_cat = Drupal.css_gen.selected_cat;
    }
    jQuery.post(Drupal.settings.basePath + 'style_manager/get_css.json', {cat: selected_cat}, function (data) {
      if (data.reset_all) {
        jQuery('.style_manager_preview_styles').remove();
      }
      jQuery(data.data).each(function (key, cat_data) {
        jQuery('#style_manager_cat_' + cat_data.cat).remove();
        jQuery('body').append('<style class="style_manager_preview_styles" id="style_manager_cat_' + cat_data.cat + '">' + cat_data.css + '</style>');
      });
      Drupal.css_gen.upd_page_output_css_textarea();
    }, 'json');
  },

  'imce_browser_open': function (wrapper_id) {
    var input_id = jQuery('#' + wrapper_id + ' .x-form-field:first').attr('id');
    window.open(Drupal.settings.style_manager.imce.url + encodeURIComponent(input_id), '', 'width=760,height=560,resizable=1');
  },

  'upd_page_output_css_textarea': function () {
    var css_code = '';
    jQuery('.style_manager_preview_styles').each(function () {
      css_code += jQuery(this).html();
    });

    jQuery('#style_manager_output_css').html(css_code);
    jQuery('#style_manager_output_css').syntaxCSS();
  },

  'preset_menu_init': function () {
    jQuery('.preset_menu').not('.processed').addClass('processed').click(function () {
      var id = jQuery(this).attr('data-id');
      var cat_arr = id.split('--');
      var contextMenu = Ext.create('Ext.menu.Menu', {
        focusOnToFront: false,
        items: [
          {
            text: 'Default',
            iconCls: 'act_preset_icon',
            id: 'style_manager_btn_default_preset',
            handler: function() { Drupal.css_gen.set_default_preset(id); },
            disabled: (Drupal.css_gen.selected_cat_data && Drupal.css_gen.selected_cat_data.raw['default'])
          }, '-',
          {
            text: 'Clone preset',
            iconCls: 'clone_icon',
            id: 'style_manager_btn_save_preset_as',
            handler: function() { Drupal.css_gen.preset_save_as(id); },
            disabled: (cat_arr[1] == 'disable')
          },
          {
            text: 'Rename',
            iconCls: 'rename_icon',
            id: 'style_manager_btn_preset_rename',
            handler: function() { Drupal.css_gen.preset_rename(id); },
            disabled: (cat_arr[1] == 'disable' || cat_arr[1] == 'default')
          },
          {
            text: 'Delete',
            iconCls: 'delete_icon',
            id: 'style_manager_btn_delete_preset',
            handler: function() { Drupal.css_gen.preset_delete(id); },
            disabled: (cat_arr[1] == 'disable' || cat_arr[1] == 'default')
          }
        ]
      });
      var position = jQuery(this).offset();
      contextMenu.showAt(position.left, position.top + 15);
      return false;
    });
  },

  'category_menu_init': function () {
    jQuery('.category_menu').not('.processed').addClass('processed').click(function () {
      var id = jQuery(this).attr('data-id');
      style_manager_settings(id);
      return false;
    });
  }
}
