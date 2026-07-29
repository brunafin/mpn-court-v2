/** URL canônica do site público (front). Ex.: https://marcapranos.com.br */
export const MPN_PUBLIC_SITE_URL = (
  import.meta.env.VITE_PUBLIC_SITE_URL || "https://marcapranos.com.br"
).replace(/\/$/, "");

export const MPN_PRIVACY_URL = `${MPN_PUBLIC_SITE_URL}/privacidade`;
export const MPN_TERMS_URL = `${MPN_PUBLIC_SITE_URL}/termos`;
