const takaFormatter = new Intl.NumberFormat("en-BD", {
  style: "currency",
  currency: "BDT",
});

export function formatFare(paisa: number): string {
  return takaFormatter.format(paisa / 100);
}
