// Shared email constants for Nyali Shore Real Estate
export const BRAND = {
  name: "Nyali Shore Real Estate",
  tagline: "Your Coastal Getaway in Mombasa",
  // Hosted on the production site so all email clients can fetch it reliably.
  logoUrl: "https://nyalishorerealestate.netlify.app/logo.png",
  siteUrl: "https://nyalishorerealestate.netlify.app",
  adminEmail: "omaryw003@gmail.com",
  contactPhone: "+254 725 409 996",
};

// Compact HTML so SMTP quoted-printable encoding doesn't insert "=20" or
// soft-wrap markers between words.  We collapse all whitespace runs to a
// single space and strip leading indentation.
function compact(html: string): string {
  return html
    .split("\n")
    .map((l) => l.trim())
    .join("")
    .replace(/\s{2,}/g, " ");
}

export function emailLayout(opts: {
  title: string;
  bannerColor?: string;
  bodyHtml: string;
  preheader?: string;
}) {
  const banner = opts.bannerColor ?? "#0891B2";
  const raw = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${opts.title}</title></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f4f4f4;">
${opts.preheader ? `<div style="display:none;max-height:0;overflow:hidden;">${opts.preheader}</div>` : ""}
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:20px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);max-width:600px;">
<tr><td style="background:#0891B2;background-image:linear-gradient(135deg,#0891B2 0%,#164E63 100%);padding:30px;text-align:center;">
<img src="${BRAND.logoUrl}" alt="${BRAND.name}" width="72" height="72" style="display:block;margin:0 auto 12px;border-radius:50%;background:#ffffff;padding:6px;border:0;outline:none;text-decoration:none;" />
<h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:bold;font-family:'Segoe UI',Tahoma,sans-serif;">${BRAND.name}</h1>
<p style="color:#E0F2FE;margin:6px 0 0;font-size:13px;">${BRAND.tagline}</p>
</td></tr>
<tr><td style="background:${banner};padding:14px;text-align:center;">
<h2 style="color:#ffffff;margin:0;font-size:17px;font-weight:600;">${opts.title}</h2>
</td></tr>
<tr><td style="padding:28px 26px;color:#374151;font-size:15px;line-height:1.6;">
${opts.bodyHtml}
</td></tr>
<tr><td style="background:#1F2937;padding:20px;text-align:center;">
<p style="color:#9CA3AF;font-size:12px;margin:0 0 6px;">${BRAND.name} — ${BRAND.tagline}</p>
<p style="color:#6B7280;font-size:11px;margin:0 0 8px;">Mombasa, Kenya | <a href="mailto:${BRAND.adminEmail}" style="color:#9CA3AF;text-decoration:underline;">${BRAND.adminEmail}</a> | ${BRAND.contactPhone}</p>
<p style="margin:0;"><a href="${BRAND.siteUrl}" style="color:#60A5FA;font-size:12px;text-decoration:underline;">Visit ${BRAND.siteUrl.replace("https://", "")}</a></p>
</td></tr>
</table>
</td></tr></table>
</body></html>`;
  return compact(raw);
}
