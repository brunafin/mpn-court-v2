import { useState, type ReactNode } from "react";
import { MdOutlineCelebration, MdOutlineRestaurant } from "react-icons/md";
import Button from "../../components/Button";
import CheckboxGroup from "../../components/CheckboxGroup";
import ConfirmSheet from "../../components/ConfirmSheet";
import EmptyState, {
  emptyStateActionClassName,
} from "../../components/EmptyState";
import Input from "../../components/Input";
import OptionChip from "../../components/OptionChip";
import OptionToggle from "../../components/OptionToggle";
import { PageEyebrow, PageTitle } from "../../components/PageTitle";
import Select from "../../components/Select";
import Textarea from "../../components/Textarea";
import VoleyNetIcon from "../../components/Icons/VoleyNetIcon";
import ReservationItem from "../Reservation/ReservationItem";
import LegendAndFilters from "../Reservation/Legend";
import DateStrip from "../Reservation/DateStrip";
import CalendarButton from "../Reservation/CalendarButton";
import { ReservationStatusEnum } from "../Reservation/enum";
import AgendaFiltersSheet, {
  type AgendaPeriodFilter,
} from "../Reservation/AgendaFiltersSheet";
/**
 * Catálogo local do visual do Manager.
 * A rota só existe com `npm run dev` (import.meta.env.DEV).
 */

const SURFACES = [
  { name: "master", className: "bg-master", note: "fundo da página" },
  { name: "master-light", className: "bg-master-light", note: "card e lista" },
  { name: "text-light", className: "bg-text-light", note: "texto principal" },
] as const;

const PALETTE = [
  {
    name: "Superfície",
    note: "Fundo da página e card.",
    steps: [
      { name: "master", className: "bg-master", ink: "text-text-light" },
      { name: "master-light", className: "bg-master-light", ink: "text-text-light" },
    ],
  },
  {
    name: "Texto",
    note: "Principal. Apoio é 70% e rótulo é 55%.",
    steps: [{ name: "text-light", className: "bg-text-light", ink: "text-master" }],
  },
  {
    name: "Azul",
    note: "Botão e reservado. O claro é texto e link.",
    steps: [
      { name: "accent-blue", className: "bg-accent-blue", ink: "text-text-light" },
      { name: "accent-blue-soft", className: "bg-accent-blue-soft", ink: "text-master" },
    ],
  },
  {
    name: "Verde",
    note: "Disponível e confirmação.",
    steps: [{ name: "accent-green", className: "bg-accent-green", ink: "text-master" }],
  },
  {
    name: "Roxo",
    note: "Fixo. O claro é ícone e texto.",
    steps: [
      { name: "accent-purple", className: "bg-accent-purple", ink: "text-text-light" },
      { name: "accent-purple-soft", className: "bg-accent-purple-soft", ink: "text-master" },
    ],
  },
  {
    name: "Vermelho",
    note: "Texto de erro, lavagem do inativo e botão destrutivo.",
    steps: [
      { name: "danger-soft", className: "bg-danger-soft", ink: "text-master" },
      { name: "danger-400", className: "bg-danger-400", ink: "text-text-light" },
      { name: "danger-600", className: "bg-danger-600", ink: "text-text-light" },
    ],
  },
  {
    name: "Amarelo",
    note: "Faixa de ambiente de teste.",
    steps: [{ name: "warning-500", className: "bg-warning-500", ink: "text-master" }],
  },
] as const;

const SECTIONS = [
  ["superficies", "Superfícies"],
  ["paleta", "Paleta"],
  ["tipo", "Tipo"],
  ["botoes", "Botões"],
  ["campos", "Campos"],
  ["datas", "Datas"],
  ["agenda", "Agenda"],
  ["filtros", "Filtros"],
  ["vazios", "Vazios"],
] as const;

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 rounded-2xl bg-master-light p-4 sm:p-5">
      <h2 className="mb-4 text-lg font-semibold text-text-light">{title}</h2>
      {children}
    </section>
  );
}

function Swatch({
  name,
  className,
  note,
}: {
  name: string;
  className: string;
  note: string;
}) {
  return (
    <li className="overflow-hidden rounded-xl bg-master">
      <div className={`h-12 ring-1 ring-inset ring-text-light/15 ${className}`} />
      <div className="px-3 py-2">
        <p className="text-base font-semibold text-text-light">{name}</p>
        <p className="text-base text-text-light/55">{note}</p>
      </div>
    </li>
  );
}

export default function DesignSystem() {
  const [name, setName] = useState("Ana Souza");
  const [note, setNote] = useState("");
  const [sport, setSport] = useState<string | number>(1);
  const [eventOn, setEventOn] = useState(true);
  const [netOn, setNetOn] = useState(false);
  const [sports, setSports] = useState<string[]>(["volei"]);
  const [court, setCourt] = useState("all");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<ReservationStatusEnum | null>(
    null,
  );
  const [filterSport, setFilterSport] = useState("");
  const [filterPeriod, setFilterPeriod] = useState<AgendaPeriodFilter>("");
  const [agendaDate, setAgendaDate] = useState(() => new Date());

  return (
    <div className="mpn-page bg-master text-text-light">
      <header className="mpn-chrome-top z-10 shrink-0 border-b border-text-light/10 bg-master px-4 pb-3 lg:px-6">
        <div className="mx-auto w-full max-w-lg lg:max-w-5xl">
          <PageEyebrow>Somente localhost</PageEyebrow>
          <PageTitle>Design system</PageTitle>
          <p className="mt-1 text-base leading-6 text-text-light/70">
            Peças reais do Manager. Alterar o componente muda esta página e as
            telas juntas. A aparência segue a preferência salva neste aparelho.
            Abra em{" "}
            <span className="font-semibold text-text-light">/design-system</span>{" "}
            com o servidor de desenvolvimento.
          </p>
          <nav
            aria-label="Seções"
            className="mt-3 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {SECTIONS.map(([id, label]) => (
              <a
                key={id}
                href={`#${id}`}
                className="mpn-tap shrink-0 rounded-full bg-master-light px-3.5 py-2 text-base font-semibold text-text-light/70"
              >
                {label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <div className="mpn-page-scroll mpn-scroll-end">
        <div className="mx-auto flex w-full max-w-lg flex-col gap-4 px-4 py-4 lg:max-w-5xl lg:px-6">
          <Section id="superficies" title="Superfícies e texto">
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {SURFACES.map((item) => (
                <Swatch key={item.name} {...item} />
              ))}
            </ul>
            <div className="mt-4 space-y-1 rounded-xl bg-master px-4 py-3">
              <p className="text-lg font-semibold text-text-light">
                Texto principal
              </p>
              <p className="text-base leading-6 text-text-light/70">
                Apoio, 70%.
              </p>
              <p className="text-base font-semibold uppercase tracking-wide text-text-light/55">
                Rótulo de seção
              </p>
            </div>
          </Section>

          <Section id="paleta" title="Paleta">
            <div className="flex flex-col gap-5">
              {PALETTE.map((family) => (
                <div key={family.name}>
                  <p className="text-base font-semibold uppercase tracking-wide text-text-light/55">
                    {family.name}
                  </p>
                  <p className="mb-2 text-base leading-6 text-text-light/70">
                    {family.note}
                  </p>
                  <div className="flex overflow-hidden rounded-xl">
                    {family.steps.map((item) => (
                      <div
                        key={item.name}
                        className={`flex h-16 min-w-0 flex-1 items-end px-2 py-1.5 text-base font-semibold ${item.className} ${item.ink}`}
                      >
                        {item.name}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section id="tipo" title="Tipo">
            <div className="space-y-3">
              <PageTitle as="h2">Título de página</PageTitle>
              <PageEyebrow>Rótulo discreto</PageEyebrow>
              <p className="text-lg font-semibold text-text-light">
                Título de bloco
              </p>
              <p className="text-base font-medium text-text-light">
                Corpo médio, o padrão dos rótulos.
              </p>
              <p className="text-base leading-6 text-text-light/70">
                Descrição. Linha de 1.5, cor suavizada.
              </p>
              <p className="text-2xl font-bold tabular-nums text-text-light">
                19:00
              </p>
            </div>
          </Section>

          <Section id="botoes" title="Botões">
            <div className="flex flex-col gap-3 lg:grid lg:grid-cols-2">
              <Button>Primário</Button>
              <Button variant="secondary">Secundário</Button>
              <Button variant="success">Sucesso</Button>
              <Button variant="danger">Perigo</Button>
              <Button variant="purple">Roxo</Button>
              <Button variant="ghost">Fantasma</Button>
              <Button size="md" fullWidth={false}>
                Médio, largura do conteúdo
              </Button>
              <Button disabled>Desabilitado</Button>
            </div>
          </Section>

          <Section id="campos" title="Campos">
            <div className="lg:grid lg:grid-cols-2 lg:gap-6">
              <div>
                <Input
                  name="cliente"
                  title="Nome"
                  mode="dark"
                  value={name}
                  required
                  onChange={(event) => setName(event.target.value)}
                />
                <Input
                  name="senha-demo"
                  title="Senha"
                  type="password"
                  mode="dark"
                  value="secreta"
                  onChange={() => undefined}
                />
                <Input
                  name="telefone-erro"
                  title="Telefone"
                  mode="dark"
                  value=""
                  error="Informe um telefone válido."
                  placeholder="(11) 90000-0000"
                />
                <Select
                  name="esporte"
                  title="Esporte"
                  mode="dark"
                  value={sport}
                  options={[
                    { id: 1, name: "Vôlei" },
                    { id: 2, name: "Futebol" },
                  ]}
                  onChange={(event) => setSport(event.target.value)}
                />
                <Textarea
                  name="observacao"
                  title="Observação"
                  mode="dark"
                  value={note}
                  maxLength={120}
                  showCount
                  placeholder="Algum recado para o horário"
                  onChange={(event) => setNote(event.target.value)}
                />
              </div>
              <div className="flex flex-col gap-3">
                <OptionToggle
                  label="Evento"
                  checked={eventOn}
                  onChange={setEventOn}
                  icon={<MdOutlineCelebration size={22} />}
                />
                <OptionToggle
                  label="Rede"
                  checked={netOn}
                  onChange={setNetOn}
                  icon={<VoleyNetIcon className="size-5" />}
                />
                <OptionToggle
                  label="Indisponível"
                  checked={false}
                  disabled
                  onChange={() => undefined}
                  icon={<MdOutlineRestaurant size={22} />}
                />
                <CheckboxGroup
                  name="esportes"
                  title="Esportes da quadra"
                  mode="dark"
                  value={sports}
                  onChange={setSports}
                  options={[
                    { value: "volei", label: "Vôlei" },
                    { value: "futebol", label: "Futebol" },
                    { value: "beach", label: "Beach tennis" },
                  ]}
                />
                <div className="flex flex-wrap gap-2">
                  <OptionChip
                    label="Rede"
                    icon={<VoleyNetIcon className="size-3.5" />}
                  />
                  <OptionChip
                    label="Evento"
                    icon={<MdOutlineCelebration size={13} />}
                  />
                  <OptionChip
                    label="Churrasqueira"
                    icon={<MdOutlineRestaurant size={14} />}
                  />
                </div>
              </div>
            </div>
          </Section>

          <Section id="datas" title="Seletor de data">
            <div className="overflow-hidden rounded-xl bg-master">
              <div className="bg-master-light">
                <DateStrip
                  selectedDate={agendaDate}
                  setSelectedDate={setAgendaDate}
                />
              </div>
              <div className="px-3 py-2">
                <CalendarButton
                  selectedDate={agendaDate}
                  setSelectedDate={setAgendaDate}
                />
              </div>
            </div>
          </Section>

          <Section id="agenda" title="Linha da agenda">
            <div
              className="flex flex-col gap-2 rounded-xl bg-master p-3"
              onClickCapture={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
            >
              <ReservationItem
                scheduleId="ds-livre"
                status={ReservationStatusEnum.AVAILABLE}
                date="2099-06-01"
                time="19:00"
                court="Quadra 1"
                customerName={null}
              />
              <ReservationItem
                scheduleId="ds-reservado"
                status={ReservationStatusEnum.RESERVED}
                date="2099-06-01"
                time="20:00"
                court="Quadra 1"
                customerName="Ana Souza"
                isEvent
              />
              <ReservationItem
                scheduleId="ds-fixo"
                status={ReservationStatusEnum.FIXED}
                date="2099-06-01"
                time="21:00"
                court="Quadra 2"
                customerName="Carlos Lima"
                isNeedsNetting
              />
              <ReservationItem
                scheduleId="ds-inativo"
                status={ReservationStatusEnum.INACTIVE}
                date="2099-06-01"
                time="22:00"
                court="Quadra 2"
                customerName={null}
              />
            </div>
          </Section>

          <Section id="filtros" title="Filtros da agenda">
            <div className="rounded-xl bg-master p-3">
            <LegendAndFilters
              courtsNameList={["Quadra 1", "Quadra 2"]}
              courtSelected={court}
              setCourtSelected={setCourt}
            />
            </div>
            <div className="mt-4">
              <Button
                variant="secondary"
                size="md"
                fullWidth={false}
                onClick={() => setFiltersOpen(true)}
              >
                Abrir filtros
              </Button>
            </div>
          </Section>

          <Section id="vazios" title="Estado vazio e confirmação">
            <EmptyState
              className="py-6"
              title="Nenhum horário neste dia"
              description="A grade deste dia aparece aqui quando há horários."
              action={
                <button type="button" className={emptyStateActionClassName()}>
                  Detalhes do dia
                </button>
              }
            />
            <div className="mt-4 lg:max-w-sm">
              <Button variant="danger" onClick={() => setConfirmOpen(true)}>
                Abrir confirmação
              </Button>
            </div>
          </Section>
        </div>
      </div>

      <AgendaFiltersSheet
        open={filtersOpen}
        sports={["Vôlei", "Futebol", "Beach tennis"]}
        showSportSection
        selectedStatus={filterStatus}
        selectedSport={filterSport}
        selectedPeriod={filterPeriod}
        onClose={() => setFiltersOpen(false)}
        onSelectStatus={setFilterStatus}
        onSelectSport={setFilterSport}
        onSelectPeriod={setFilterPeriod}
      />
      <ConfirmSheet
        isOpen={confirmOpen}
        title="Inativar horário?"
        description="O horário deixa de aparecer como disponível na agenda do dia."
        confirmLabel="Inativar"
        tone="danger"
        onConfirm={() => setConfirmOpen(false)}
        onClose={() => setConfirmOpen(false)}
      />
    </div>
  );
}
