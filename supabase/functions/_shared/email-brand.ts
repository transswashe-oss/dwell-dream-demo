// Shared email constants for Nyali Shore Real Estate
export const BRAND = {
  name: "Nyali Shore Real Estate",
  tagline: "Your Coastal Getaway in Mombasa",
  logoUrl: "https://dwell-dream-demo.lovable.app/logo.png",
  adminEmail: "omaryw003@gmail.com",
  contactPhone: "+254 725 409 996",
};

export function emailLayout(opts: {
  title: string;
  bannerColor?: string;
  bodyHtml: string;
  preheader?: string;
}) {
  const banner = opts.bannerColor ?? "#0891B2";
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f4f4f4;">
${opts.preheader ? `<div style="display:none;max-height:0;overflow:hidden;">${opts.preheader}</div>` : ""}
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:20px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
<tr><td style="background:linear-gradient(135deg,#0891B2 0%,#164E63 100%);padding:30px;text-align:center;">
<img src="${BRAND.logoUrl}" alt="${BRAND.name}" width="80" height="80" style="display:block;margin:0 auto 12px;border-radius:50%;background:#fff;padding:6px;" />
<h1 style="color:#fff;margin:0;font-size:24px;font-weight:bold;">${BRAND.name}</h1>
<p style="color:#E0F2FE;margin:6px 0 0;font-size:13px;">${BRAND.tagline}</p>
</td></tr>
<tr><td style="background:${banner};padding:14px;text-align:center;">
<h2 style="color:#fff;margin:0;font-size:18px;">${opts.title}</h2>
</td></tr>
<tr><td style="padding:30px;color:#374151;font-size:15px;line-height:1.6;">
${opts.bodyHtml}
</td></tr>
<tr><td style="background:#1F2937;padding:20px;text-align:center;">
<p style="color:#9CA3AF;font-size:12px;margin:0 0 6px;">${BRAND.name} — ${BRAND.tagline}</p>
<p style="color:#6B7280;font-size:11px;margin:0;">Mombasa, Kenya | <a href="mailto:${BRAND.adminEmail}" style="color:#9CA3AF;">${BRAND.adminEmail}</a> | ${BRAND.contactPhone}</p>
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}
