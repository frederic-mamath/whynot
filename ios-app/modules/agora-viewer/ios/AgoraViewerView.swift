import ExpoModulesCore
import AgoraRtcKit

class AgoraViewerView: ExpoView {
  var isLocal: Bool = false

  func attachRemoteUid(_ uid: UInt) {
    if isLocal { return }
    guard let engine = sharedAgoraEngine else { return }
    let canvas = AgoraRtcVideoCanvas()
    canvas.uid = uid
    canvas.renderMode = .hidden
    canvas.view = self
    engine.setupRemoteVideo(canvas)
  }

  func attachLocal() {
    guard let engine = sharedAgoraEngine else { return }
    let canvas = AgoraRtcVideoCanvas()
    canvas.uid = 0
    canvas.renderMode = .hidden
    canvas.view = self
    engine.setupLocalVideo(canvas)
  }
}
