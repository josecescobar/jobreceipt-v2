export type MoneyCents = number & { readonly __brand: 'MoneyCents' };

export const toMoneyCents = (value: number): MoneyCents => {
  return Math.round(value * 100) as MoneyCents;
};

export const fromMoneyCents = (value: MoneyCents): number => {
  return value / 100;
};
