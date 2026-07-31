interface StarsProps {
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
}

export function Stars({ value, onChange, readOnly = false }: StarsProps) {
  return (
    <div className={`stars${readOnly ? " ro" : ""}`} data-value={value}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className={n <= value ? "on" : ""}
          disabled={readOnly}
          onClick={() => onChange?.(n)}
          aria-label={`${n}점`}
        >
          {n <= value ? "★" : "☆"}
        </button>
      ))}
    </div>
  );
}
