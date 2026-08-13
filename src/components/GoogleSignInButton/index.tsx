import { useEffect, useRef, useState } from 'react';

const GIS_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';
const GIS_SCRIPT_ID = 'google-gsi-client';

function loadGisScript(): Promise<void> {
  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }

  const existing = document.getElementById(GIS_SCRIPT_ID);
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener(
        'error',
        () => reject(new Error('Falha ao carregar Google Identity')),
        { once: true },
      );
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.id = GIS_SCRIPT_ID;
    script.src = GIS_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error('Falha ao carregar Google Identity'));
    document.head.appendChild(script);
  });
}

/** Largura do botão GIS: cabe no container (mobile ~256px) e respeita o range do Google. */
function buttonWidthFor(el: HTMLElement): number {
  const raw = Math.floor(el.clientWidth || el.getBoundingClientRect().width);
  if (raw <= 0) return 0;
  return Math.min(Math.max(raw, 200), 400);
}

type GoogleSignInButtonProps = {
  onCredential: (idToken: string) => void;
  disabled?: boolean;
  /** GIS text variant */
  text?: 'signin_with' | 'signup_with' | 'continue_with';
  /** Notifica se o botão ficou disponível (para esconder o divisor "ou"). */
  onReadyChange?: (ready: boolean) => void;
};

/**
 * Botão oficial do Google Identity Services.
 * Só renderiza se VITE_GOOGLE_CLIENT_ID estiver definido.
 * Em falha de CSP/rede, some sem quebrar o layout do formulário.
 */
export default function GoogleSignInButton({
  onCredential,
  disabled = false,
  text = 'continue_with',
  onReadyChange,
}: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(onCredential);
  const onReadyChangeRef = useRef(onReadyChange);
  const lastWidthRef = useRef(0);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [layoutWidth, setLayoutWidth] = useState(0);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();

  useEffect(() => {
    callbackRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    onReadyChangeRef.current = onReadyChange;
  }, [onReadyChange]);

  useEffect(() => {
    onReadyChangeRef.current?.(ready);
  }, [ready]);

  // Mede a largura real do card (evita fallback 320px que corta no mobile).
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !clientId || failed) return;

    const measure = () => {
      const next = buttonWidthFor(el);
      if (next > 0) {
        setLayoutWidth((prev) => (Math.abs(prev - next) < 2 ? prev : next));
      }
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener('orientationchange', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('orientationchange', measure);
    };
  }, [clientId, failed]);

  useEffect(() => {
    if (!clientId || disabled || failed || layoutWidth <= 0) return;
    // Evita re-render do iframe a cada pixel (só quando muda de fato).
    if (Math.abs(layoutWidth - lastWidthRef.current) < 2 && ready) return;

    let cancelled = false;

    (async () => {
      try {
        await loadGisScript();
        if (cancelled || !containerRef.current || !window.google?.accounts?.id) {
          if (!cancelled) {
            setFailed(true);
            setReady(false);
          }
          return;
        }

        const width = buttonWidthFor(containerRef.current) || layoutWidth;
        lastWidthRef.current = width;
        containerRef.current.innerHTML = '';
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (response.credential) {
              callbackRef.current(response.credential);
            }
          },
        });
        window.google.accounts.id.renderButton(containerRef.current, {
          theme: 'outline',
          size: 'large',
          text,
          shape: 'rectangular',
          width,
          locale: 'pt-BR',
        });
        if (!cancelled) setReady(true);
      } catch {
        if (!cancelled) {
          setFailed(true);
          setReady(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [clientId, disabled, text, failed, layoutWidth, ready]);

  if (!clientId || failed) {
    return null;
  }

  return (
    <div
      className={`w-full max-w-full ${
        disabled ? 'pointer-events-none opacity-60' : ''
      }`}
    >
      <div
        ref={containerRef}
        className="flex min-h-10 w-full max-w-full justify-center [&_div]:!max-w-full [&_iframe]:!max-w-full"
      />
      {!ready && (
        <p className="mt-2 text-center text-sm text-text-light/55">
          Carregando Google…
        </p>
      )}
    </div>
  );
}
