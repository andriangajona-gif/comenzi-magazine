package md.curierfloresti.app;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

public class MainActivity extends Activity {
    private static final String SITE = "https://curierfloresti.github.io/comenzi-magazine/";
    private WebView webView;
    private View errorView;

    @Override
    public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setStatusBarColor(Color.rgb(38, 123, 165));
        getWindow().setNavigationBarColor(Color.rgb(25, 51, 75));

        FrameLayout root = new FrameLayout(this);
        webView = new WebView(this);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri url = request.getUrl();
                if ("https".equals(url.getScheme())
                        && "curierfloresti.github.io".equalsIgnoreCase(url.getHost())
                        && url.getPath() != null
                        && url.getPath().startsWith("/comenzi-magazine/")) {
                    return false;
                }
                if ("https".equals(url.getScheme())) {
                    try {
                        startActivity(new Intent(Intent.ACTION_VIEW, url));
                    } catch (ActivityNotFoundException error) {
                        Toast.makeText(MainActivity.this, "Nu se poate deschide linkul.", Toast.LENGTH_LONG).show();
                    }
                }
                return true;
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame()) {
                    errorView.setVisibility(View.VISIBLE);
                }
            }
        });

        LinearLayout errorLayout = new LinearLayout(this);
        errorLayout.setOrientation(LinearLayout.VERTICAL);
        errorLayout.setGravity(Gravity.CENTER);
        errorLayout.setPadding(40, 40, 40, 40);
        errorLayout.setBackgroundColor(Color.rgb(238, 243, 239));
        TextView message = new TextView(this);
        message.setText("Nu se poate încărca site-ul. Verifică conexiunea la internet.");
        message.setTextSize(18);
        message.setGravity(Gravity.CENTER);
        message.setTextColor(Color.rgb(25, 51, 75));
        Button retry = new Button(this);
        retry.setText("Încearcă din nou");
        retry.setOnClickListener(v -> {
            errorView.setVisibility(View.GONE);
            webView.loadUrl(SITE);
        });
        errorLayout.addView(message);
        errorLayout.addView(retry);
        errorView = errorLayout;
        errorView.setVisibility(View.GONE);

        root.addView(webView);
        root.addView(errorView);
        setContentView(root);
        webView.loadUrl(SITE);
    }

    @Override
    public void onBackPressed() {
        if (errorView.getVisibility() == View.VISIBLE) {
            errorView.setVisibility(View.GONE);
            webView.loadUrl(SITE);
        } else if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
