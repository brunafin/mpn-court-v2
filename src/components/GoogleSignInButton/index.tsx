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
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
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
    if (!clientId || disabled || failed) return;

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

        // Espera layout para medir largura real do container.
        await new Promise<void>((r) => requestAnimationFrame(() => r()));
        if (cancelled || !containerRef.current) return;

        const width = Math.min(
          Math.max(containerRef.current.offsetWidth || 320, 240),
          400,
        );

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
  }, [clientId, disabled, text, failed]);

  if (!clientId || failed) {
    return null;
  }

  return (
    <div
      className={`w-full max-w-full overflow-hidden ${
        disabled ? 'pointer-events-none opacity-60' : ''
      }`}
    >
      <div
        ref={containerRef}
        className="flex min-h-10 w-full max-w-full justify-center overflow-hidden [&_iframe]:max-w-full"
      />
      {!ready && (
        <p className="mt-2 text-center text-sm text-text-light/55">
          Carregando Google…
        </p>
      )}
    </div>
  );
}
