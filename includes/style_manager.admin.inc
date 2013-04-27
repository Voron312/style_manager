<?php


/**
 * Settings form.
 */
function style_manager_settings($form, $form_state) {
  $form = array();
  $form['style_manager_exclude_editor_paths'] = array(
    '#type' => 'textarea',
    '#title' => t('Exclude Style Manager editor on paths'),
    '#default_value' => variable_get('style_manager_exclude_editor_paths', "admin*\nimce*"),
    '#description' => t('Exclude the Style Manager editor on some pages, usually administration pages. Enter one page per line as Drupal paths. The \'*\' character is a wildcard. &lt;front&gt; is the front page.'),
    '#wysiwyg' => FALSE,
  );
  $form['style_manager_exclude_css_paths'] = array(
    '#type' => 'textarea',
    '#title' => t("Don't add Style Manager css on paths"),
    '#default_value' => variable_get('style_manager_exclude_css_paths', ''),
    '#description' => t('Do not add styles created by Style Manager on pages. Enter one page per line as Drupal paths. The \'*\' character is a wildcard. &lt;front&gt; is the front page.'),
    '#wysiwyg' => FALSE,
  );

  $form = system_settings_form($form);
  return $form;
}
