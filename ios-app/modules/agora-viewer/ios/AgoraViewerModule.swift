import ExpoModulesCore
import AgoraRtcKit

// Shared references — accessible from AgoraViewerView in the same Swift module.
var sharedAgoraEngine: AgoraRtcEngineKit?
var sharedAgoraDelegate: AgoraDelegate?

// AgoraRtcEngineDelegate requires NSObject; cannot be satisfied by Module directly.
class AgoraDelegate: NSObject, AgoraRtcEngineDelegate {
  var onUserJoined: ((UInt, Int) -> Void)?
  var onUserOffline: ((UInt, AgoraUserOfflineReason) -> Void)?

  func rtcEngine(_ engine: AgoraRtcEngineKit, didJoinedOfUid uid: UInt, elapsed: Int) {
    onUserJoined?(uid, elapsed)
  }

  func rtcEngine(_ engine: AgoraRtcEngineKit, didOfflineOfUid uid: UInt, reason: AgoraUserOfflineReason) {
    onUserOffline?(uid, reason)
  }
}

public class AgoraViewerModule: Module {

  public func definition() -> ModuleDefinition {
    Name("AgoraViewer")
    Events("onUserJoined", "onUserOffline", "onError")

    AsyncFunction("initialize") { (appId: String, promise: Promise) in
      let delegate = AgoraDelegate()
      delegate.onUserJoined = { [weak self] uid, elapsed in
        self?.sendEvent("onUserJoined", ["uid": uid, "elapsed": elapsed])
      }
      delegate.onUserOffline = { [weak self] uid, reason in
        self?.sendEvent("onUserOffline", ["uid": uid, "reason": reason.rawValue])
      }
      sharedAgoraDelegate = delegate

      let engine = AgoraRtcEngineKit.sharedEngine(withAppId: appId, delegate: delegate)
      engine.setChannelProfile(.liveBroadcasting)
      engine.setClientRole(.audience)
      engine.enableVideo()
      sharedAgoraEngine = engine
      promise.resolve(nil)
    }

    AsyncFunction("joinChannel") { (token: String?, channelName: String, uid: Int, promise: Promise) in
      guard let engine = sharedAgoraEngine else {
        promise.reject("NOT_INITIALIZED", "Agora engine not initialized")
        return
      }
      let options = AgoraRtcChannelMediaOptions()
      options.channelProfile = .liveBroadcasting
      options.clientRoleType = .audience
      options.autoSubscribeAudio = true
      options.autoSubscribeVideo = true
      engine.joinChannel(byToken: token, channelId: channelName, uid: UInt(uid), mediaOptions: options)
      promise.resolve(nil)
    }

    AsyncFunction("leaveChannel") { (promise: Promise) in
      sharedAgoraEngine?.leaveChannel()
      promise.resolve(nil)
    }

    AsyncFunction("release") { (promise: Promise) in
      AgoraRtcEngineKit.destroy()
      sharedAgoraEngine = nil
      sharedAgoraDelegate = nil
      promise.resolve(nil)
    }

    View(AgoraViewerView.self) {
      Prop("uid") { (view: AgoraViewerView, uid: Int) in
        view.attachRemoteUid(UInt(uid))
      }
    }
  }
}
