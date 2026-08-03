/** Mesma regra do back (`AuthService.changePassword`). */
export const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

export const PASSWORD_HINT =
  "Precisa ter no mínimo 8 caracteres, com maiúscula, minúscula, número e caractere especial.";

export function isValidPassword(password: string): boolean {
  return PASSWORD_REGEX.test(password);
}
