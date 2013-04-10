<?php



/**
 * Return array with all category's.
 */
function style_manager_get_cat_list() {
  $cache = cache_get('style_manager_cat_list');
  if (!empty($cache->data)) {
    return $cache->data;
  }
  $out = array();
  $result = db_select('variable', 'v')
    ->condition('v.name', 'style_manager_preset%', 'LIKE')
    ->fields('v', array('name'))
    ->execute()
    ->fetchAll();

  if ($result) {
    foreach ($result as $data) {
      $name = str_replace('style_manager_preset_', '', $data->name);
      $out[$name] = $name;
    }
  }
  cache_set('style_manager_cat_list', $out);
  return $out;
}


/**
 * Return category info.
 */
function style_manager_get_cat_info($cat_id = FALSE, $var = FALSE, $type = 'info') {
  if ($cat_id) {
    $cat_data = variable_get('style_manager_preset_' . $cat_id, array());
    $cat_data = style_manager_get_cat_info_add_id($cat_data);
  }
  if (!$cat_id) {
    $all_cat_data = array();
    $cat_list = style_manager_get_cat_list();
    foreach ($cat_list as $cat) {
      $cat_data = variable_get('style_manager_preset_' . $cat, array());
      $cat_data = style_manager_get_cat_info_add_id($cat_data);
      $all_cat_data[$cat_data['info']['id']] = $cat_data;
    }
    return $all_cat_data;
  }
  if ($var) {
    if (!empty($cat_data[$type][$var])) {
      return $cat_data[$type][$var];
    }
    else {
      return FALSE;
    }
  }
  elseif (!empty($cat_data[$type]) && !$var) {
    return $cat_data[$type];
  }
  else {
    return FALSE;
  }
}

/**
 * Add id key for all elements in array.
 */
function style_manager_get_cat_info_add_id($cat_data) {
  if (!empty($cat_data['data'])) {
    foreach ($cat_data['data'] as $key => $data) {
      $cat_data['data'][$key]['id'] = $key;
    }
  }
  return $cat_data;
}

/**
 * Set category info.
 */
function style_manager_set_cat_info($cat_id, $data, $type = 'info') {
  $store_data = variable_get('style_manager_preset_' . $cat_id, array());
  $store_data[$type] = $data;
  variable_set('style_manager_preset_' . $cat_id, $store_data);
}


/**
 * Set default preset.
 */
function style_manager_set_default_preset($cat_id, $preset_id) {
  $cat_info = style_manager_get_cat_info($cat_id);
  $cat_info['default_preset'] = $preset_id;
  style_manager_set_cat_info($cat_id, $cat_info);
}


/**
 * Get default preset.
 */
function style_manager_get_default_preset($cat_id) {
  $default_preset = style_manager_get_cat_info($cat_id, 'default_preset');
  if (!$default_preset) {
    $default_preset = 'default';
  }
  return $default_preset;
}


/**
 * Get all presets.
 */
function style_manager_get_all_presets($cat) {
  $store_data = variable_get('style_manager_preset_' . $cat, array());
  if (!empty($store_data['preset_data'])) {
    return $store_data['preset_data'];
  }
  else {
    return array();
  }
}


/**
 * Get preset hash.
 */
function style_manager_get_preset_key($cat, $preset) {
  $preset_data = style_manager_preset_get($cat, $preset);
  if (!empty($preset_data['info']['key'])) {
    return $preset_data['info']['key'];
  }
  elseif ($preset_data) {
    style_manager_preset_set($cat, $preset, $preset_data);
    return style_manager_get_preset_key($cat, $preset);
  }
}


/**
 * Get preset data.
 */
function style_manager_preset_get($cat, $preset, $add_info = FALSE) {
  $presets = style_manager_get_all_presets($cat);
  if (!empty($presets[$preset])) {
    $cat_data = style_manager_get_cat_info($cat, FALSE, 'data');
    foreach ($presets[$preset]['data'] as $key => $data) {
      if (!empty($cat_data[$key])) {
        if ($add_info) {
          $presets[$preset]['data'][$key] = $data + $cat_data[$key];
        }
      }
      else {
        unset($presets[$preset]['data'][$key]);
      }
    }
    return $presets[$preset];
  }
  else {
    return FALSE;
  }
}


/**
 * Get visibility status.
 */
function style_manager_get_item_visibility_status($cat, $preset, $group, $item_id) {
  $preset = style_manager_preset_get($cat, $preset);
  if (empty($preset['info']['visibility_settings'][$group]['visibility_type'])
    || $preset['info']['visibility_settings'][$group]['visibility_type'] == 'show_all'
  ) {
    return TRUE;
  }
  elseif ($preset['info']['visibility_settings'][$group]['visibility_type'] == 'show_selected') {
    return !empty($preset['info']['visibility_settings'][$group][$item_id]);
  }
  elseif ($preset['info']['visibility_settings'][$group]['visibility_type'] == 'hide_selected') {
    return empty($preset['info']['visibility_settings'][$group][$item_id]);
  }
}


/**
 * Set preset data.
 */
function style_manager_preset_set($cat, $preset, $data) {
  $presets = variable_get('style_manager_preset_' . $cat, array());
  $presets['preset_data'][$preset] = $data;
  $presets['preset_data'][$preset]['info']['key'] = md5(serialize($data['data']));
  variable_set('style_manager_preset_' . $cat, $presets);
}


/**
 * Delete preset.
 */
function style_manager_preset_delete($cat, $preset) {
  $presets = variable_get('style_manager_preset_' . $cat, array());
  unset($presets['preset_data'][$preset]);
  variable_set('style_manager_preset_' . $cat, $presets);
}

function style_manager_cat_delete($cat_id) {
  variable_del('style_manager_preset_' . $cat_id);
  cache_set('style_manager_cat_list', FALSE);
}

/**
 * Print data in json.
 */
function style_manager_print_json($data) {
  print json_encode($data);
}


/**
 * Convert url to internal format.
 */
function style_manager_get_rial_url($url) {
  if (file_exists($url)) {
    return $url;
  }
  $tmp_url = strstr($url, 'sites/');
  if (file_exists($tmp_url)) {
    return $tmp_url;
  }
  $tmp_url = substr($url, 0, 1) == '/' ? substr($url, 1) : $url;
  if (file_exists($tmp_url)) {
    return $tmp_url;
  }

  return $url;
}


/**
 * Return array of all categories.
 */
function _style_manager_get_cat_tree() {
  $cat_info = style_manager_get_cat_info();
  $cat_list = array();
  if (!empty($cat_info)) {
    foreach ($cat_info as $key => $val) {
      $cat_list[$key] = $val['info']['title'];
    }
  }
  return $cat_list;
}

/**
 * Return global variable.
 *
 * @see style_manager_style_manager_widgets(), style_manager_global_color()
 */
function style_manager_get_globals_var($type = 'global_color', $key = FALSE, $cat_id = FALSE, $preset_id = FALSE) {
  module_load_include('inc', 'style_manager', 'includes/style_manager.render');
  $default_preset = style_manager_get_default_preset('global_config');
  $preset = style_manager_preset_get('global_config', $default_preset, TRUE);
  if (empty($preset['data'])) {
    return FALSE;
  }
  $selected_preset = style_manager_get_active_preset();
  if ($selected_preset) {
    $preset['data'] += $selected_preset['data'];
  }

  $global_vars = array();
  foreach ($preset['data'] as $id => $data) {
    if ($id == $key || !$key) {
      if ($data['type'] == 'style_manager_global_color') {
        $global_vars['global_color'][$id]['title'] = t($data['title']);
        $global_vars['global_color'][$id]['value'] = style_manager_color_render($data);
      }
      if ($data['type'] == 'style_manager_global_font') {
        $global_vars['global_font'][$id]['title'] = t($data['title']);
        $global_vars['global_font'][$id]['value'] = $data['settings']['font'];
      }
      if ($data['type'] == 'style_manager_global_numeric') {
        $global_vars['global_numeric'][$id]['title'] = t($data['title']);
        $global_vars['global_numeric'][$id]['value'] = $data['settings']['value'];
      }
    }
  }
  if ($key && !empty($global_vars[$type][$key]['value'])) {
    return $global_vars[$type][$key]['value'];
  }
  elseif (!empty($global_vars[$type])) {
    return $global_vars[$type];
  }
  else {
    return FALSE;
  }
}

/**
 * Set act preset, for preset globals var.
 */
function style_manager_set_active_category($cat, $preset) {
  $category = &drupal_static('style_manager_active_category');
  $category = array($cat, $preset);
}

/**
 * Get act preset, for preset globals var.
 */
function style_manager_get_active_preset() {
  $category = &drupal_static('style_manager_active_category');
  if (!empty($_POST['cat']) && empty($category)) {
    $category = explode('--', $_POST['cat']);
  }
  if (!empty($category[1])) {
    $preset = style_manager_preset_get($category[0], $category[1], TRUE);
    return $preset;
  }
  return FALSE;
}

/**
 * Formatting css code.
 */
function style_manager_css_code_formating($css, $add_important = FALS, $comment = FALSE) {
  preg_match_all('/([^\}\/]*)\{([^\}]*)\}/isU', $css, $matches, PREG_SET_ORDER);
  if ($matches) {
    foreach ($matches as $matches_data) {
      if (empty($matches_data[1]) || empty($matches_data[0])) {
        continue;
      }
      $matches_data[1] = str_replace(array("\r", "\n"), array('', ''), $matches_data[1]);
      $matches_data[2] = str_replace(array("\r", "\n"), array('', ''), $matches_data[2]);
      $selectors = explode(',', $matches_data[1]);
      $properties = explode(';', $matches_data[2]);
      foreach ($selectors as $key => $selector_data_sort) {
        $selectors[$key] = trim(preg_replace('/\s+/', ' ', $selector_data_sort));
      }
      foreach ($properties as $key => $property_data_sort) {
        $properties[$key] = trim($property_data_sort);
      }
      asort($selectors);
      asort($properties);
      $out = '';
      foreach ($selectors as $selector_data) {
        if (!$selector_data) {
          continue;
        }
        if ($out) {
          $out .= ",\r\n";
        }
        $out .= $selector_data;
      }
      $out .= " {\r\n";
      foreach ($properties as $property_data) {
        if (!$property_data) {
          continue;
        }
        if ($add_important) {
          $out .= '  ' . $property_data . " !important;\r\n";
        }
        else {
          $out .= '  ' . $property_data . ";\r\n";
        }
      }
      $out .= "}\r\n\r\n";
      $css = str_replace($matches_data[0], $out, $css);
    }
  }

  $css = str_replace('*/', "*/\r\n", $css);
  if ($comment) {
    $line = '---------------------------------------------------------';
    $css = "\r\n/* {$line}\r\n   {$comment}\r\n   {$line} */\r\n\r\n" . $css;
  }
  return $css;
}

/**
 * Return selector merged with css prefix.
 */
function style_manager_get_css_selectors($prefix_selectors, $el_selectors) {
  $prefix_selectors_arr = explode(',', $prefix_selectors);
  $el_selectors_arr = explode(',', $el_selectors);
  $out_selectors = array();
  foreach ($el_selectors_arr as $el_selector_item) {
    foreach ($prefix_selectors_arr as $prefix_selector_item) {
      $merged_selector = str_replace('{this}', trim($prefix_selector_item), $el_selector_item);
      if ($merged_selector == $el_selector_item) {
        $merged_selector = trim($prefix_selector_item) . ' ' . trim($el_selector_item);
      }
      $merged_selector = trim($merged_selector);
      if ($merged_selector) {
        $out_selectors[$merged_selector] = $merged_selector;
      }
    }
  }
  return $out_selectors;
}

/**
 * Clean css cache.
 */
function style_manager_clean_css_cache() {
  $path = file_build_uri('style_manager_cache/css/');
  $files = file_scan_directory($path, '/.*\.css/');
  if (!empty($files)) {
    foreach ($files as $file_data) {
      unlink($file_data->uri);
    }
  }
}