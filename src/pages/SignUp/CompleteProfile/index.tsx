import { useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import Input from '../../../components/Input';
import { buttonClassName } from '../../../components/Button';
import { formatPhoneMask, onlyPhoneDigits } from '../../../utils/formatPhone';
import {
  formatCpfMask,
  isValidCpf,
  onlyCpfDigits,
} from '../../../utils/formatCpf';
import { completeProfile } from '../../../api/auth';
import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from '../../../utils/authCookie';
import { MPN_PRIVACY_URL, MPN_TERMS_URL } from '../../../constants/legal';
import { MPN_LOGO_URL } from '../../../constants/brand';

type LoginTokenPayload = {
  updatedPassword?: boolean;
  companyPublicId?: string | null;
  termsAccepted?: boolean;
};

function routeAfterLogin(token: string): string {
  const payload = jwtDecode<LoginTokenPayload>(token);
  if (payload.termsAccepted === false) return '/cadastro/completar';
  if (payload.updatedPassword === false) return '/alterar-senha';
  return payload.companyPublicId ? '/reservas' : '/comecar';
}

function CompleteProfile() {
  const navigate = useNavigate();
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerCpf, setOwnerCpf] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      navigate('/', { replace: true });
      return;
    }
    try {
      const payload = jwtDecode<LoginTokenPayload>(token);
      if (payload.termsAccepted !== false) {
        navigate(routeAfterLogin(token), { replace: true });
        return;
      }
    } catch {
      navigate('/', { replace: true });
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        // Sonda: se o servidor já tem termos, renova o JWT e sai.
        // Conta nova responde 400 (esperado) — sem toast; o form pede CPF/termos.
        const result = await completeProfile({}, { silentError: true });
        if (cancelled || result.needsProfileCompletion) return;
        setAccessToken(result.access_token);
        navigate(routeAfterLogin(result.access_token), { replace: true });
      } catch {
        // Conta nova: permanece no form (termos + CPF).
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const phoneDigits = onlyPhoneDigits(ownerPhone);
  const cpfDigits = onlyCpfDigits(ownerCpf);
  const phoneOk = phoneDigits.length === 0 || phoneDigits.length === 11;
  const cpfOk = isValidCpf(cpfDigits);
  const canSubmit = acceptedTerms && phoneOk && cpfOk && !loading;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');

    if (!acceptedTerms) {
      setFormError(
        'Aceite os Termos de Uso e a Política de Privacidade para continuar.',
      );
      return;
    }

    if (!phoneOk) {
      setFormError('Informe um celular com DDD (11 dígitos) ou deixe em branco.');
      return;
    }
    if (!cpfOk) {
      setFormError(
        cpfDigits.length === 11
          ? 'Informe um CPF válido.'
          : 'Informe um CPF válido com 11 dígitos.',
      );
      return;
    }

    setLoading(true);
    try {
      const result = await completeProfile({
        acceptedTerms: true,
        cpf: cpfDigits,
        ...(phoneDigits.length === 11 ? { phone: phoneDigits } : {}),
      });
      setAccessToken(result.access_token);
      navigate(routeAfterLogin(result.access_token), { replace: true });
    } catch (error) {
      const status = (error as AxiosError)?.response?.status;
      const raw =
        (error as AxiosError<{ message?: string | string[] }>)?.response?.data
          ?.message;
      const text = Array.isArray(raw) ? raw.join(' ') : String(raw || '');

      if (status === 401) {
        navigate('/', { replace: true });
        return;
      }
      setFormError(
        text || 'Não foi possível continuar. Tente novamente.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-full flex-col items-center justify-center bg-master px-4 py-8 text-text-light sm:py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(37,84,160,0.18),_transparent_55%)]" />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-3 flex flex-col items-center text-center sm:mb-4">
          <div className="mb-2 flex w-24 items-center justify-center overflow-hidden rounded-xl bg-white p-1.5 sm:mb-3 sm:w-28 sm:rounded-2xl">
            <img
              src={MPN_LOGO_URL}
              alt="Marca Pra Nós"
              className="h-auto w-full object-contain"
            />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-text-light sm:text-2xl">
            Quase lá
          </h1>
          <p className="mt-2 text-sm leading-5 text-text-light/70">
            Informe seu CPF e aceite os termos para começar.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl bg-master-light p-4 sm:p-6"
          noValidate
          aria-busy={loading || undefined}
        >
          <Input
            name="ownerCpf"
            title="CPF"
            placeholder="000.000.000-00"
            type="text"
            mode="dark"
            disabled={loading}
            value={ownerCpf}
            onChange={(e) => {
              setOwnerCpf(formatCpfMask(e.target.value));
              if (formError) setFormError('');
            }}
            inputMode="numeric"
            autoComplete="off"
            error={
              ownerCpf && !cpfOk
                ? cpfDigits.length === 11
                  ? 'Informe um CPF válido.'
                  : 'Informe um CPF com 11 dígitos.'
                : undefined
            }
          />

          <Input
            name="ownerPhone"
            title="Telefone"
            placeholder="(00) 90000-0000"
            type="tel"
            mode="dark"
            disabled={loading}
            value={ownerPhone}
            onChange={(e) => {
              setOwnerPhone(formatPhoneMask(e.target.value));
              if (formError) setFormError('');
            }}
            autoComplete="tel"
            inputMode="tel"
            enterKeyHint="go"
            error={
              ownerPhone && !phoneOk
                ? 'Informe um celular com DDD (11 dígitos) ou deixe em branco.'
                : undefined
            }
          />

          <label
            className={`mt-4 flex items-start gap-3 text-base leading-6 text-text-light/80 ${
              loading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
            }`}
          >
            <input
              type="checkbox"
              name="acceptedTerms"
              checked={acceptedTerms}
              disabled={loading}
              onChange={(e) => {
                setAcceptedTerms(e.target.checked);
                if (formError) setFormError('');
              }}
              className="mt-0.5 size-4 shrink-0 rounded border-text-light/30 bg-master accent-accent-blue disabled:cursor-not-allowed"
            />
            <span>
              Li e aceito os{' '}
              <a
                href={MPN_TERMS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-accent-blue-soft underline-offset-2 hover:underline"
              >
                Termos de Uso
              </a>{' '}
              e a{' '}
              <a
                href={MPN_PRIVACY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-accent-blue-soft underline-offset-2 hover:underline"
              >
                Política de Privacidade
              </a>
              .
            </span>
          </label>

          {formError && (
            <p className="mt-2 text-base font-medium text-danger-400" role="alert">
              {formError}
            </p>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className={buttonClassName({
              variant: 'primary',
              className: 'mt-6',
            })}
          >
            {loading ? 'Continuando…' : 'Começar'}
          </button>

          <p className="mt-5 text-center text-base text-text-light/70">
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                clearAccessToken();
                navigate('/', { replace: true });
              }}
              className="font-semibold text-accent-blue-soft underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
            >
              Voltar para o login
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}

export default CompleteProfile;
