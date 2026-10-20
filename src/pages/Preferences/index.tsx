import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../../components/AppLayout";
import Select from "../../components/Select";
import ThemeModeSwitch from "../../components/ThemeModeSwitch";
import { useErrors } from "../../contexts/ErrorsContext";
import { getAccessToken } from "../../utils/authCookie";
import { useCompanyPublicId } from "../../hooks/useCompanyPublicId";
import {
  infosByCompanyPublicId,
  updatePreferencesByCompanyPublicId,
} from "../../api/companies";
const HOURS_OPTIONS = [
  { id: "show", name: "Mostrar" },
  { id: "hide", name: "Ocultar" },
];

function Preferences() {
  const navigate = useNavigate();
  const { notifyError } = useErrors();
  const publicId = useCompanyPublicId();
  const [hideInactive, setHideInactive] = useState(false);
  const [ready, setReady] = useState(false);
  const [savingHours, setSavingHours] = useState(false);

  useEffect(() => {
    if (!getAccessToken()) navigate("/");
  }, [navigate]);

  useEffect(() => {
    if (!publicId) return;
    let cancelled = false;
    infosByCompanyPublicId(publicId)
      .then((response) => {
        if (cancelled) return;
        setHideInactive(Boolean(response?.preferences?.isHiddenInactiveHours));
        setReady(true);
      })
      .catch((error) => {
        console.error(error);
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [publicId]);

  const saveHideInactive = async (next: boolean) => {
    if (!publicId || savingHours) return;
    const previous = hideInactive;
    setHideInactive(next);
    setSavingHours(true);
    try {
      await updatePreferencesByCompanyPublicId(publicId, {
        isHiddenInactiveHours: next,
      });
    } catch (error) {
      console.error(error);
      setHideInactive(previous);
      notifyError({
        message: "Não foi possível salvar. Tente de novo.",
        type: "error",
      });
    } finally {
      setSavingHours(false);
    }
  };

  return (
    <AppLayout>
      <main className="mx-auto min-h-0 w-full max-w-2xl flex-1 overflow-y-auto bg-master px-3 pb-10 pt-4 text-text-light lg:px-8 lg:pt-6">
        <h1 className="text-xl font-semibold tracking-tight">Preferências</h1>
        <div className="mt-5">
          <ThemeModeSwitch showLabel />
          <Select
            name="horarios-inativos"
            title="Horários inativos"
            mode="dark"
            surface="raised"
            value={hideInactive ? "hide" : "show"}
            options={HOURS_OPTIONS}
            disabled={!ready || savingHours}
            onChange={(event) => {
              void saveHideInactive(event.target.value === "hide");
            }}
          />
        </div>
      </main>
    </AppLayout>
  );
}

export default Preferences;
