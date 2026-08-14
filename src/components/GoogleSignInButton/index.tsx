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

/**
 * O botão “Continuar como …” pode nascer mais largo que o card.
 * Escala para caber; 1px a menos evita sangrar o canto direito do clip.
 */
function fitGoogleButton(container: HTMLElement, maxWidth: number) {
  const iframe = container.querySelector('iframe');
  if (!iframe || maxWidth <= 0) return;

  iframe.style.transform = '';
  iframe.style.transformOrigin = '';
  container.style.height = '';

  const targetWidth = Math.max(1, maxWidth - 1);
  const iframeWidth =
    iframe.offsetWidth || Math.ceil(iframe.getBoundingClientRect().width);
  if (iframeWidth <= targetWidth + 0.5) return;

  const scale = targetWidth / iframeWidth;
  const iframeHeight =
    iframe.offsetHeight || Math.ceil(iframe.getBoundingClientRect().height);
  iframe.style.transform = `scale(${scale})`;
  iframe.style.transformOrigin = 'top left';
  container.style.height = `${Math.ceil(iframeHeight * scale)}px`;
}

function applyButtonClip(container: HTMLElement) {
  const radius = `${BUTTON_RADIUS_PX}px`;
  container.style.overflow = 'hidden';
  container.style.borderRadius = radius;
  container.style.clipPath = `inset(0 round ${radius})`;
  // Safari/WebKit: iframe ignora overflow+radius; máscara opaca força o canto.
  const mask = '-webkit-radial-gradient(circle, #fff 100%, #000 100%)';
  container.style.webkitMaskImage = mask;
  container.style.maskImage = 'radial-gradient(circle, #fff 100%, #000 100%)';
  container.style.transform = 'translateZ(0)';
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

  // Mede o shell externo (largura estável). Não observa o nó do iframe —
  // quando o Google preenche o e-mail, a altura muda e um ResizeObserver
  // no container destruiria o botão no meio do clique.
  useEffect(() => {
    const shell = shellRef.current;
    if (!shell || !clientId || failed) return;

    const measure = () => {
      const next = buttonWidthFor(shell);
      if (next <= 0) return;
      setShellWidth((prev) => (Math.abs(prev - next) < 8 ? prev : next));
      // Só reajusta scale; não remonta o iframe.
      if (containerRef.current && renderedWidthRef.current > 0) {
        applyButtonClip(containerRef.current);
        fitGoogleButton(containerRef.current, next);
      }
    };

    measure();
    // rAF: após padding/fonte do card estabilizar no mobile.
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
    let disposeFit: (() => void) | undefined;

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
        containerRef.current.style.height = '';
        applyButtonClip(containerRef.current);
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (response.credential) {
              callbackRef.current(response.credential);
            }
          },
          // Evita One Tap automático; só o botão.
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        window.google.accounts.id.renderButton(containerRef.current, {
          theme: 'outline',
          size: 'large',
          text,
          // "rectangular" no botão genérico; no personalizado (e-mail) o GIS
          // ignora e fica quadrado — o radius vem do wrapper abaixo.
          shape: 'rectangular',
          width,
          locale: 'pt-BR',
        });

        const container = containerRef.current;
        const applyFit = () => {
          if (cancelled || !container) return;
          const maxW =
            (shellRef.current ? buttonWidthFor(shellRef.current) : 0) || width;
          applyButtonClip(container);
          fitGoogleButton(container, maxW);
        };
        requestAnimationFrame(() => {
          applyFit();
          requestAnimationFrame(applyFit);
        });
        const iframe = container.querySelector('iframe');
        iframe?.addEventListener('load', applyFit);

        // Personalizado (“Continuar como …”) muda o tamanho depois do render;
        // só reajusta o scale — não remonta o iframe.
        let fitObserver: ResizeObserver | undefined;
        if (iframe && typeof ResizeObserver !== 'undefined') {
          fitObserver = new ResizeObserver(() => applyFit());
          fitObserver.observe(iframe);
        }

        disposeFit = () => {
          fitObserver?.disconnect();
          iframe?.removeEventListener('load', applyFit);
        };

        if (!cancelled) setReady(true);
        else disposeFit();
      } catch {
        if (!cancelled) {
          setFailed(true);
          setReady(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      disposeFit?.();
    };
  }, [clientId, text, failed, shellWidth]);

  if (!clientId || failed) {
    return null;
  }

  return (
    <div
      ref={shellRef}
      className={`w-full max-w-full ${
        disabled ? 'pointer-events-none opacity-60' : ''
      }`}
    >
      {/*
        O botão personalizado (Continuar como …) do GIS vem sem border-radius.
        Iframe no WebKit costuma furar overflow+radius — usamos clip-path + máscara.
      */}
      <div
        ref={containerRef}
        className="mx-auto min-h-10 w-full max-w-full overflow-hidden rounded-xl"
        style={
          shellWidth > 0
            ? {
                width: shellWidth,
                maxWidth: '100%',
                clipPath: `inset(0 round ${BUTTON_RADIUS_PX}px)`,
                WebkitMaskImage:
                  '-webkit-radial-gradient(circle, #fff 100%, #000 100%)',
                maskImage: 'radial-gradient(circle, #fff 100%, #000 100%)',
                transform: 'translateZ(0)',
              }
            : undefined
        }
      />
      {!ready && (
        <p className="mt-2 text-center text-sm text-text-light/55">
          Carregando Google…
        </p>
      )}
    </div>
  );
}
