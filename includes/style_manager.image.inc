<?php

/**
 * Exporting images.
 */
function style_manager_images_export($preset) {
  $out = array();
  if ($preset) {
    foreach ($preset as $item) {
      if (is_array($item) && !empty($item['settings']['image']['url'])) {
        $url = style_manager_get_rial_url($item['settings']['image']['url']);
        if (file_exists($url)) {
          $imgbinary = fread(fopen($url, "r"), filesize($url));
          $out[md5($item['settings']['image']['url'])] = base64_encode($imgbinary);
        }
      }
    }
  }
  return $out;
}

/**
 * Importing images.
 */
function style_manager_images_import($preset, $images) {
  if ($preset) {
    foreach ($preset as &$item) {
      if (!empty($item['settings']['image']['url'])) {
        $url = style_manager_get_rial_url($item['settings']['image']['url']);
        if (file_exists($url)) {
          continue;
        }
        if (!empty($images[md5($item['settings']['image']['url'])])) {
          $img_hash = md5($images[md5($item['settings']['image']['url'])]);
          $img_data = base64_decode($images[md5($item['settings']['image']['url'])]);
          $pathinfo = pathinfo($item['settings']['image']['url']);
          $img_url = file_build_uri('style_manager_images/' . $img_hash . '.' . $pathinfo['extension']);
          if (file_exists($img_url)) {
            $item['settings']['image']['url'] = file_create_url($img_url);
            continue;
          }
          elseif (!file_prepare_directory(file_build_uri('style_manager_images'), FILE_CREATE_DIRECTORY | FILE_MODIFY_PERMISSIONS)) {
            continue;
          }
          file_unmanaged_save_data($img_data, $img_url, FILE_EXISTS_REPLACE);
          $item['settings']['image']['url'] = file_create_url($img_url);
        }
      }
    }
  }
  return $preset;
}

/**
 * Get existing image or make a new color conversion.
 */
function style_manager_image_post_processing($url, $settings, $bg_color = FALSE) {
  module_load_include('inc', 'style_manager', 'includes/style_manager.render');
  if (empty($settings['color'])) {
    return $url;
  }
  $pathinfo = pathinfo($url);
  $extension = in_array($pathinfo['extension'], array('jpeg', 'jpg')) ? 'jpg' : 'png';
  $hex_color = style_manager_color_render(array('settings' => $settings['color']));
  $rgb_color = ($hex_color) ? style_manager_color_hex2rgb($hex_color) : FALSE;
  $new_url = file_build_uri('style_manager_cache/images/' . md5($url) . '-' . md5(serialize($rgb_color) . serialize($settings) . $bg_color) . '.' . $extension);

  if ($bg_color) {
    $bg_color = style_manager_color_hex2rgb($bg_color);
  }
  $success = file_exists($new_url) || style_manager_duotone_image($url, $new_url, $rgb_color, $settings, $bg_color);
  if ($success) {
    return file_create_url($new_url);
  }
  else {
    return $url;
  }
}

/**
 * Change color of image.
 */
function style_manager_duotone_image($url_from, $url_to, $rgb, $settings, $bg_color) {
  $url_from = urldecode($url_from);
  module_load_include('inc', 'style_manager', 'includes/style_manager.color');
  $pathinfo_from = pathinfo(strtolower($url_from));
  $pathinfo_to = pathinfo(strtolower($url_to));
  $url_from = style_manager_get_rial_url($url_from);
  if (!file_exists($url_from) || empty($pathinfo_from['extension'])) {
    return FALSE;
  }
  if (!file_prepare_directory($pathinfo_to['dirname'], FILE_CREATE_DIRECTORY | FILE_MODIFY_PERMISSIONS)) {
    return FALSE;
  }
  if ($pathinfo_from['extension'] == 'png') {
    $image = imagecreatefrompng($url_from);
    $alpha = TRUE;
  }
  if ($pathinfo_from['extension'] == 'jpg' || $pathinfo_from['extension'] == 'jpeg') {
    $image = imagecreatefromjpeg($url_from);
    $alpha = FALSE;
  }
  if ($pathinfo_from['extension'] == 'gif') {
    $image = imagecreatefromgif($url_from);
    $alpha = TRUE;
  }
  if ($rgb) {
    if ($settings['mode'] == 'php_filter') {
      imagefilter($image, IMG_FILTER_GRAYSCALE);
      imagefilter($image, IMG_FILTER_COLORIZE, $rgb['r'], $rgb['g'], $rgb['b']);
    }
    else {
      $image = style_manager_duotone_image_costum_mode($image, $rgb, $settings, $bg_color, $alpha);
    }
  }
  if ($settings['brightness'] && !in_array($settings['mode'], array('mode_2', 'mode_2_custom'))) {
    imagefilter($image, IMG_FILTER_BRIGHTNESS, $settings['brightness']);
  }
  if ($settings['contrast']) {
    imagefilter($image, IMG_FILTER_CONTRAST, $settings['contrast']);
  }


  $path_to = drupal_realpath($url_to);

  if ($pathinfo_to['extension'] == 'png') {
    return imagepng($image, $path_to, 2);
  }
  if ($pathinfo_to['extension'] == 'jpg' || $pathinfo_to['extension'] == 'jpeg') {
    return imagejpeg($image, $path_to, 95);
  }
}

/**
 * Prepare images for processing.
 */
function style_manager_duotone_image_costum_mode($image, $rgb, $settings, $bg_color, $alpha) {
  $imagex = imagesx($image);
  $imagey = imagesy($image);
  $image2 = imagecreatetruecolor($imagex, $imagey);
  $color_store = array();
  if ($alpha) {
    imagesavealpha($image2, TRUE);
    imagealphablending($image2, FALSE);
  }
  for ($x = 0; $x < $imagex; ++$x) {
    for ($y = 0; $y < $imagey; ++$y) {
      $imagecolorat = imagecolorat($image, $x, $y);
      $image_color = imagecolorsforindex($image, $imagecolorat);
      $image_color['alpha'] = empty($image_color['alpha']) ? 0 : $image_color['alpha'];
      $color_key = $image_color['red'] . $image_color['green'] . $image_color['blue'] . $image_color['alpha'];

      if (empty($color_store[$color_key])) {
        if ($settings['mode'] == 'mode_1') {
          $new_color = style_manager_duotone_image_mode1($image_color, $rgb);
        }
        elseif ($settings['mode'] == 'mode_2') {
          $new_color = style_manager_duotone_image_mode2($image_color, $rgb, 0, $settings['brightness']);
        }
        elseif ($settings['mode'] == 'mode_2_custom') {
          $new_color = style_manager_duotone_image_mode2($image_color, $rgb, $settings['additional_settings'], $settings['brightness']);
        }
        elseif ($settings['mode'] == 'mode_3') {
          $new_color = style_manager_duotone_image_mode2($image_color, $rgb, 0, $settings['brightness'], TRUE);
        }
        elseif ($settings['mode'] == 'mode_3_custom') {
          $new_color = style_manager_duotone_image_mode2($image_color, $rgb, $settings['additional_settings'], $settings['brightness'], TRUE);
        }

        $image_color['alpha'] = style_manager_duotone_image_get_alpha($image_color['alpha'], $settings['transparency']);

        if (!empty($bg_color) && $image_color['alpha'] > 0) {
          $new_color = style_manager_duotone_image_set_bg_color($new_color, $bg_color, $image_color['alpha']);
          $image_color['alpha'] = 0;
        }
        if ($alpha) {
          $color_store[$color_key] = imagecolorallocatealpha($image2, $new_color['r'], $new_color['g'], $new_color['b'], $image_color['alpha']);
        }
        else {
          $color_store[$color_key] = imagecolorallocate($image2, $new_color['r'], $new_color['g'], $new_color['b']);
        }
      }
      imagesetpixel($image2, $x, $y, $color_store[$color_key]);
    }
  }
  return $image2;
}

/**
 * Duotone image, based on rgb values.
 */
function style_manager_duotone_image_mode1($color_from, $color_to) {
  $grey = floor(($color_from['red'] + $color_from['green'] + $color_from['blue']) / 3);
  $grey_plus = floor(($color_to['r'] + $color_to['g'] + $color_to['b']) / 3);
  $new_color = array();
  $new_color['r'] = $grey + $color_to['r'] - $grey_plus;
  $new_color['g'] = $grey + $color_to['g'] - $grey_plus;
  $new_color['b'] = $grey + $color_to['b'] - $grey_plus;
  foreach ($new_color as &$color) {
    if ($color > 255) {
      $color = 255;
    }
    if ($color < 0) {
      $color = 0;
    }
  }
  return $new_color;
}

/**
 * Duotone image, based on hsl values.
 */
function style_manager_duotone_image_mode2($color_from, $color_to, $percent, $brightness, $saturation_overwrite = FALSE) {
  $hsl_to = style_manager_color_rgb2hsl($color_to['r'], $color_to['g'], $color_to['b'], FALSE);
  $hsl_from = style_manager_color_rgb2hsl($color_from['red'], $color_from['green'], $color_from['blue'], FALSE);
  $hsl_from['h'] = $hsl_to['h'];
  $hsl_from['s'] = ($hsl_from['s'] + (($hsl_to['s'] / 100) * $percent));
  if ($saturation_overwrite) {
    $hsl_from['s'] = ($hsl_from['s'] > $hsl_to['s']) ? $hsl_to['s'] : $hsl_from['s'];
  }
  if ($hsl_from['s'] > 100) {
    $hsl_from['s'] = 100;
  }
  if ($brightness) {
    $hsl_from['l'] = ($hsl_from['l'] < 5) ? $hsl_from['l'] : ($hsl_from['l'] + (0.25 * $brightness));
    if ($hsl_from['l'] < 0) {
      $hsl_from['l'] = 0;
    }
    if ($hsl_from['l'] > 100) {
      $hsl_from['l'] = 100;
    }
  }
  return style_manager_color_hsl2rgb($hsl_from['h'], $hsl_from['s'], $hsl_from['l']);
}

/**
 * Add alpha to image.
 */
function style_manager_duotone_image_get_alpha($alpha, $correct) {
  $alpha += $correct;
  if ($alpha > 127) {
    $alpha = 127;
  }
  if ($alpha < 0) {
    $alpha = 0;
  }
  return $alpha;
}

/**
 * Add bg color to image.
 */
function style_manager_duotone_image_set_bg_color($new_color, $bg_color, $alpha) {
  $new_color['r'] = (int)($new_color['r'] - ((($new_color['r'] - $bg_color['r']) / 127) * $alpha));
  $new_color['g'] = (int)($new_color['g'] - ((($new_color['g'] - $bg_color['g']) / 127) * $alpha));
  $new_color['b'] = (int)($new_color['b'] - ((($new_color['b'] - $bg_color['b']) / 127) * $alpha));
  return $new_color;
}

