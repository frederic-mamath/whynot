import ExpoModulesCore
import AgoraRtcKit

class AgoraViewerView: ExpoView {
  func attachRemoteUid(_ uid: UInt) {
    guard let engine = sharedAgoraEngine else { return }
    let canvas = AgoraRtcVideoCanvas()
    canvas.uid = uid
    canvas.renderMode = .hidden
    canvas.view = self
    engine.setupRemoteVideo(canvas)
  }
}
