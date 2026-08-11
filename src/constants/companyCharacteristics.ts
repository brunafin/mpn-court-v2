/** Comodidades alinhadas aos ícones do portal público (ArenaDetailClient). */
export const COMPANY_CHARACTERISTICS = [
  "Estacionamento gratuito",
  "Estacionamento pago",
  "Estacionamento na frente",
  "Lanches e bebidas",
  "Vestiário",
  "Churrasqueira",
  "Mesa de sinuca",
  "Televisão",
] as const;

export type CompanyCharacteristic =
  (typeof COMPANY_CHARACTERISTICS)[number];
