interface PageSizeSelectProps<T extends number> {
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
}

export function PageSizeSelect<T extends number>({
  value,
  options,
  onChange,
}: PageSizeSelectProps<T>) {
  return (
    <div className="d-flex align-items-center gap-2">
      <label htmlFor="page-size" className="form-label mb-0 text-nowrap">
        Results per page
      </label>
      <select
        id="page-size"
        className="form-select form-select-sm w-auto"
        value={value}
        onChange={(event) => onChange(Number(event.target.value) as T)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
