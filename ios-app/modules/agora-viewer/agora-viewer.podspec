Pod::Spec.new do |s|
  s.name           = 'agora-viewer'
  s.version        = '1.0.0'
  s.summary        = 'Native Agora viewer for Popup iOS'
  s.homepage       = 'https://popup-live.fr'
  s.license        = 'MIT'
  s.authors        = { 'Popup' => 'hello@popup-live.fr' }
  s.platform       = :ios, '15.1'
  s.source         = { :git => '' }
  s.source_files   = 'ios/**/*.{h,m,swift}'
  s.dependency 'ExpoModulesCore'
  s.dependency 'AgoraRtcEngine_iOS'
  s.swift_version  = '5.9'
end
