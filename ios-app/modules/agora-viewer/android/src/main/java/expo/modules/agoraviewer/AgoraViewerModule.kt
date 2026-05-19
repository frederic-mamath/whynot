package expo.modules.agoraviewer

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import io.agora.rtc2.ChannelMediaOptions
import io.agora.rtc2.Constants
import io.agora.rtc2.IRtcEngineEventHandler
import io.agora.rtc2.RtcEngine
import io.agora.rtc2.RtcEngineConfig

class AgoraViewerModule : Module() {
  companion object {
    var sharedEngine: RtcEngine? = null
  }

  private var eventHandler: IRtcEngineEventHandler? = null

  override fun definition() = ModuleDefinition {
    Name("AgoraViewer")
    Events("onUserJoined", "onUserOffline")

    AsyncFunction("initialize") { appId: String ->
      val context = appContext.reactContext
        ?: throw Exception("React context unavailable")

      val handler = object : IRtcEngineEventHandler() {
        override fun onUserJoined(uid: Int, elapsed: Int) {
          sendEvent("onUserJoined", mapOf("uid" to uid, "elapsed" to elapsed))
        }
        override fun onUserOffline(uid: Int, reason: Int) {
          sendEvent("onUserOffline", mapOf("uid" to uid, "reason" to reason))
        }
      }
      eventHandler = handler

      val config = RtcEngineConfig().apply {
        mContext = context
        mAppId = appId
        mEventHandler = handler
        mChannelProfile = Constants.CHANNEL_PROFILE_LIVE_BROADCASTING
      }
      val engine = RtcEngine.create(config)
      engine.setClientRole(Constants.CLIENT_ROLE_AUDIENCE)
      engine.enableVideo()
      sharedEngine = engine
    }

    AsyncFunction("joinChannel") { token: String?, channelName: String, uid: Int ->
      val engine = sharedEngine
        ?: throw Exception("Agora engine not initialized")

      val options = ChannelMediaOptions().apply {
        channelProfile = Constants.CHANNEL_PROFILE_LIVE_BROADCASTING
        clientRoleType = Constants.CLIENT_ROLE_AUDIENCE
        autoSubscribeAudio = true
        autoSubscribeVideo = true
      }
      engine.joinChannel(token, channelName, uid, options)
    }

    AsyncFunction("leaveChannel") {
      sharedEngine?.leaveChannel()
    }

    AsyncFunction("release") {
      RtcEngine.destroy()
      sharedEngine = null
      eventHandler = null
    }

    View(AgoraViewerView::class) {
      Prop("uid") { view: AgoraViewerView, uid: Int ->
        view.attachRemoteUid(uid)
      }
    }
  }
}
