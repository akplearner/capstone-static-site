/**
 * The starter files for the site every Server+ team builds and uploads to the
 * DMZ web server, and the NGINX server block that serves it over TLS in Week 4.
 *
 * Shared by the Week-3 seed step and the guide procedure so the two cannot
 * drift. No addresses live here — the site is the same whichever team serves
 * it — so `page-shape.test.ts` has nothing to scan for.
 */
import { SITE } from '@/lib/serverTopology';

/** The minimum page: a title, the business, what it does, who runs it, how to reach it. */
export const SITE_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Your Business — built by Team X</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <header>
    <h1>Your Business</h1>
    <p>Built, networked and run by Team X for the Server+ capstone.</p>
  </header>
  <main>
    <section>
      <h2>What we do</h2>
      <p>One sentence from your Architecture Brief: what this business sells or does.</p>
    </section>
    <section>
      <h2>What runs it</h2>
      <ul>
        <li>websrv, in the DMZ: this site</li>
        <li>winserver, private: staff logins, DNS and DHCP</li>
        <li>linuxsrv, private: the database</li>
      </ul>
    </section>
    <section>
      <h2>Contact</h2>
      <p>The address your Architecture Brief names — a person, a desk, a mailbox.</p>
    </section>
  </main>
  <footer>Team X · Week 3 · served from the DMZ through the Proxmox host</footer>
</body>
</html>
`;

/** Enough style to show the site is yours, with no colour that clashes on a projector. */
export const SITE_CSS = `body { font-family: system-ui, sans-serif; margin: 0; color: darkslategray; background: whitesmoke; }
header { background: darkslategray; color: white; padding: 2rem; }
header p { margin: 0.5rem 0 0; opacity: 0.85; }
main { max-width: 48rem; margin: 2rem auto; padding: 0 1rem; }
section { background: white; border-radius: 8px; padding: 1rem 1.5rem; margin-bottom: 1rem; }
footer { text-align: center; color: dimgray; padding: 2rem; font-size: 0.9rem; }
`;

/** Writes index.html on the workstation, in a folder named site. */
export const SITE_HTML_CMD = `mkdir -p site && cat > site/index.html <<'EOF'\n${SITE_HTML}EOF`;

/** Writes style.css beside it. */
export const SITE_CSS_CMD = `cat > site/style.css <<'EOF'\n${SITE_CSS}EOF`;

/** The upload: through the host's published port, straight into the document root. */
export const SITE_UPLOAD_CMD = `scp -P ${SITE.uploadPort} -r site/* ${SITE.uploadUser}@10.10.30.T:${SITE.root}/`;

/**
 * Week 4: one NGINX server block serving the same document root on 80 and 443,
 * with the self-signed certificate the hardening step generates.
 */
export const NGINX_TLS_SITE_CMD = `sudo tee /etc/nginx/sites-available/default > /dev/null <<'EOF'
server {
    listen 80 default_server;
    listen 443 ssl default_server;
    ssl_certificate /etc/ssl/certs/websrv.crt;
    ssl_certificate_key /etc/ssl/private/websrv.key;
    root ${SITE.root};
    index index.html;
    server_name _;
    location / {
        try_files $uri $uri/ =404;
    }
}
EOF
sudo nginx -t && sudo systemctl reload nginx`;
