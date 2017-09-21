'use strict';

var upload = require('@tagplay/cloudinary-upload');
var identifier = require('@tagplay/asset-identifier');
var config = require('prefect-worker-config');
var log = config.log;

module.exports = persist;

function persist (base64, identification, cb) {
  if (typeof identification === 'function') {
    cb = identification;
    identification = {};
  }
  var options = {
    tags: identifier.tags(identification),
    folder: identifier.prefix(config.name)
  };

  upload(base64, options, function (err, result) {
    if (err) {
      log.warn({ err: err, base64_first_chars: base64.substring(0, 40) }, 'Problem with upload');
      return cb(err);
    }
    cb(err, parseResult(result));
  });
}

function parseResult (result, type) {
  if (!type) type = result.resource_type;
  if (!type) {
    log.info({ result, type }, 'Unknown type');
    return {};
  }
  if (type === 'image') {
    return {
      source_type: type,
      url: result.secure_url,
      width: result.width,
      height: result.height
    };
  }
  if (type === 'video') {
    return {
      source_type: type,
      url: result.secure_url,
      width: result.width,
      height: result.height,
      aspect_ratio: result.video.dar,
      bitrate: result.video.bit_rate,
      content_type: result.resource_type + '/' + result.format,
      thumbnail: result.secure_url.replace(result.format, 'jpg')
    };
  }
}
