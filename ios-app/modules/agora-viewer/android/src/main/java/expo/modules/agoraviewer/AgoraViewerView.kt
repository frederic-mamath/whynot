package expo.modules.agoraviewer

import android.content.Context
import android.view.SurfaceView
import android.view.ViewGroup
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ExpoView
import io.agora.rtc2.video.VideoCanvas

class AgoraViewerView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  fun attachRemoteUid(uid: Int) {
    removeAllViews()
    val surfaceView = SurfaceView(context)
    addView(
      surfaceView,
      ViewGroup.LayoutParams(
        ViewGroup.LayoutParams.MATCH_PARENT,
        ViewGroup.LayoutParams.MATCH_PARENT,
      ),
    )
    val engine = AgoraViewerModule.sharedEngine ?: return
    val canvas = VideoCanvas(surfaceView, VideoCanvas.RENDER_MODE_HIDDEN, uid)
    engine.setupRemoteVideo(canvas)
  }
}
