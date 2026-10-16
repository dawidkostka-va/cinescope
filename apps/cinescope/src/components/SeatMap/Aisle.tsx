interface AisleProps {
  row: number;
  gridColumn: string;
}

export function Aisle({ row, gridColumn }: AisleProps) {
  return (
    <span
      data-testid="aisle"
      data-row={row}
      style={{ gridColumn }}
    />
  );
}
