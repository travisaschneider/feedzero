/** Query parameter names used for tracking — always stripped from URLs. */
const TRACKING_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "utm_id",
  "fbclid",
  "gclid",
  "gclsrc",
  "dclid",
  "msclkid",
  "twclid",
  "igshid",
  "mc_cid",
  "mc_eid",
  "_ga",
  "_gl",
  "oly_anon_id",
  "oly_enc_id",
  "vero_id",
  "s_cid",
  "icid",
  "ef_id",
]);

const URL_IN_ATTR_REGEX = /\b(href|src)="([^"]*)"/gi;

function cleanUrl(raw: string): string {
  const qIndex = raw.indexOf("?");
  if (qIndex === -1) return raw;

  const base = raw.slice(0, qIndex);
  const query = raw.slice(qIndex + 1);
  const params = query.split("&").filter((p) => {
    const key = p.split("=")[0].toLowerCase();
    return !TRACKING_PARAMS.has(key);
  });

  return params.length > 0 ? `${base}?${params.join("&")}` : base;
}

/** Strip tracking query parameters from href and src attributes in HTML. */
export function cleanLinks(html: string): string {
  return html.replace(URL_IN_ATTR_REGEX, (_, attr, url) => {
    return `${attr}="${cleanUrl(url)}"`;
  });
}
