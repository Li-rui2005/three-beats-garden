package com.threebeats.garden;

import android.app.Activity;
import android.app.AlertDialog;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.DisplayCutout;
import android.view.View;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;

/** Fully offline game. No native-JavaScript bridge and no network permission. */
public final class MainActivity extends Activity {
    private WebView game;
    private AlertDialog exitDialog;

    @Override public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR | View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);
        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.rgb(243, 242, 234));
        root.setOnApplyWindowInsetsListener((view, insets) -> {
            // Also handles Android 15's enforced edge-to-edge display.
            int left=insets.getSystemWindowInsetLeft(), top=insets.getSystemWindowInsetTop();
            int right=insets.getSystemWindowInsetRight(), bottom=insets.getSystemWindowInsetBottom();
            if (Build.VERSION.SDK_INT >= 28) {
                DisplayCutout cutout=insets.getDisplayCutout();
                if (cutout != null) {
                    left=Math.max(left,cutout.getSafeInsetLeft());
                    top=Math.max(top,cutout.getSafeInsetTop());
                    right=Math.max(right,cutout.getSafeInsetRight());
                    bottom=Math.max(bottom,cutout.getSafeInsetBottom());
                }
            }
            view.setPadding(left,top,right,bottom);
            return insets.consumeSystemWindowInsets();
        });
        setContentView(root);
        try {
            game = new WebView(this);
            game.setBackgroundColor(Color.rgb(243, 242, 234));
            WebView.setWebContentsDebuggingEnabled(false);
            WebSettings settings = game.getSettings();
            settings.setJavaScriptEnabled(true);
            settings.setDomStorageEnabled(true);
            settings.setAllowFileAccess(false);
            settings.setAllowContentAccess(false);
            settings.setAllowFileAccessFromFileURLs(false);
            settings.setAllowUniversalAccessFromFileURLs(false);
            settings.setBlockNetworkLoads(true);
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
            settings.setJavaScriptCanOpenWindowsAutomatically(false);
            settings.setSupportMultipleWindows(false);
            settings.setMediaPlaybackRequiresUserGesture(true);
            settings.setBuiltInZoomControls(false);
            settings.setDisplayZoomControls(false);
            game.setWebChromeClient(new WebChromeClient());
            game.setWebViewClient(new WebViewClient() {
                @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                    // The game never leaves its bundled document.
                    return true;
                }
                @Override public boolean shouldOverrideUrlLoading(WebView view, String url) {
                    return true;
                }
                @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                    return new WebResourceResponse("text/plain", "UTF-8",
                        new ByteArrayInputStream(new byte[0]));
                }
            });
            root.addView(game, new FrameLayout.LayoutParams(-1, -1));
            String html;
            try (InputStream input = getAssets().open("index.html");
                 ByteArrayOutputStream content = new ByteArrayOutputStream()) {
                byte[] buffer = new byte[8192];
                int count;
                while ((count = input.read(buffer)) != -1) content.write(buffer, 0, count);
                html = content.toString("UTF-8");
            }
            // A stable HTTPS origin enables localStorage; the HTML itself comes from the APK.
            String origin = "https://appassets.androidplatform.net/";
            game.loadDataWithBaseURL(origin, html, "text/html", null, origin);
        } catch (Exception error) {
            new AlertDialog.Builder(this).setTitle("暂时无法打开花园")
                .setMessage("请确认手机已启用 Android 系统 WebView，然后重新打开慢三拍。")
                .setPositiveButton("关闭", (dialog, which) -> finish()).setCancelable(false).show();
        }
    }

    @Override public void onBackPressed() {
        if (game == null) { finish(); return; }
        game.evaluateJavascript("(function(){var d=document.getElementById('help-dialog');"
            + "if(d&&d.open){d.close();return true;}return false;})()", result -> {
            if ("true".equals(result)) return;
            if (exitDialog != null && exitDialog.isShowing()) return;
            exitDialog = new AlertDialog.Builder(this).setTitle("离开小花园？")
                .setMessage("已完成的关卡和最佳步数会保留在这台手机上。")
                .setNegativeButton("再玩一会", null)
                .setPositiveButton("退出", (dialog, which) -> finish()).show();
        });
    }
    @Override protected void onPause() { if(game != null) game.onPause(); super.onPause(); }
    @Override protected void onResume() { super.onResume(); if(game != null) game.onResume(); }
    @Override protected void onDestroy() {
        if(game != null) { game.stopLoading(); game.destroy(); game = null; }
        super.onDestroy();
    }
}
