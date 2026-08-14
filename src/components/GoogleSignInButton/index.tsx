import { useEffect, useRef, useState } from 'react';

const GIS_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';
const GIS_SCRIPT_ID = 'google-gsi-client';
/** Mesmo raio do botão Entrar (rounded-xl = 12px). */
const BUTTON_RADIUS_PX = 12;

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

/** Largura do botão GIS: cabe no card (mobile) e no range do Google (200–400). */
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
 *
 * Importante: não recria o iframe quando o Google mostra o e-mail da conta
 * (mudança de altura do widget). Só remonta em resize real da janela.
 *
 * O botão personalizado (“Continuar como …”) pinta cantos retos no iframe —
 * overflow/clip-path no pai costuma falhar no mobile. Cobramos os 4 cantos
 * com o fundo do card (master-light) para forçar o mesmo raio do Entrar.
 */
export default function GoogleSignInButton({
  onCredential,
  disabled = false,
  text = 'continue_with',
  onReadyChange,
}: GoogleSignInButtonProps) {
  const shellRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(onCredential);
  const onReadyChangeRef = useRef(onReadyChange);
  const renderedWidthRef = useRef(0);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [shellWidth, setShellWidth] = useState(0);
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

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell || !clientId || failed) return;

    const measure = () => {
      const next = buttonWidthFor(shell);
      if (next <= 0) return;
      setShellWidth((prev) => (Math.abs(prev - next) < 8 ? prev : next));
    };

    measure();
    const raf = requestAnimationFrame(measure);
    window.addEventListener('resize', measure);
    window.addEventListener('orientationchange', measure);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', measure);
      window.removeEventListener('orientationchange', measure);
    };
  }, [clientId, failed]);

  useEffect(() => {
    if (!clientId || failed || shellWidth <= 0) return;
    if (
      renderedWidthRef.current > 0 &&
      Math.abs(shellWidth - renderedWidthRef.current) < 8
    ) {
      return;
    }

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

        const width =
          (shellRef.current ? buttonWidthFor(shellRef.current) : 0) ||
          shellWidth;
        renderedWidthRef.current = width;
        containerRef.current.innerHTML = '';
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (response.credential) {
              callbackRef.current(response.credential);
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
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
  }, [clientId, text, failed, shellWidth]);

  if (!clientId || failed) {
    return null;
  }

  const r = BUTTON_RADIUS_PX;

  return (
    <div
      ref={shellRef}
      className={`w-full max-w-full ${
        disabled ? 'pointer-events-none opacity-60' : ''
      }`}
    >
      <div
        className="relative mx-auto w-full max-w-full overflow-hidden rounded-xl"
        style={
          shellWidth > 0
            ? {
                width: shellWidth,
                maxWidth: '100%',
                // body usa color-scheme: dark — sem isso o texto do GIS some (branco no branco).
                colorScheme: 'light',
              }
            : { colorScheme: 'light' }
        }
      >
        <div ref={containerRef} className="min-h-10 w-full" />
        {/*
          Iframe do GIS ignora border-radius no mobile. Máscaras nos cantos
          com a cor do card (master-light) arredondam os 4 lados de verdade.
        */}
        <span
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 z-10"
          style={{
            width: r,
            height: r,
            background: `radial-gradient(circle at 100% 100%, transparent ${r}px, var(--color-master-light, #0C1728) ${r + 0.5}px)`,
          }}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute right-0 top-0 z-10"
          style={{
            width: r,
            height: r,
            background: `radial-gradient(circle at 0% 100%, transparent ${r}px, var(--color-master-light, #0C1728) ${r + 0.5}px)`,
          }}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-0 z-10"
          style={{
            width: r,
            height: r,
            background: `radial-gradient(circle at 100% 0%, transparent ${r}px, var(--color-master-light, #0C1728) ${r + 0.5}px)`,
          }}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-0 right-0 z-10"
          style={{
            width: r,
            height: r,
            background: `radial-gradient(circle at 0% 0%, transparent ${r}px, var(--color-master-light, #0C1728) ${r + 0.5}px)`,
          }}
        />
      </div>
      {!ready && (
        <p className="mt-2 text-center text-sm text-text-light/55">
          Carregando Google…
        </p>
      )}
    </div>
  );
}
