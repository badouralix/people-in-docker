What about some security headers ?

```
add_header Content-Security-Policy      "script-src 'self'"                             always;
add_header Strict-Transport-Security    "max-age=31536000; includeSubdomains; preload"  always;
add_header X-Content-Type-Options       "nosniff"                                       always;
add_header X-Frame-Options              "SAMEORIGIN"                                    always;
add_header X-XSS-Protection             "1; mode=block"                                 always;

proxy_hide_header X-Powered-By;
```

Checkout [here](https://gist.github.com/plentz/6737338) and [there](https://www.keycdn.com/blog/http-security-headers/).