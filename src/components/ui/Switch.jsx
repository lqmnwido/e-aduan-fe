export default function Switch({ id, checked, onChange, label, tone = 'danger', disabled }) {
  return (
    <label className={`switch switch--${tone}`} htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        role="switch"
        className="switch__input"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="switch__track" aria-hidden="true">
        <span className="switch__thumb" />
      </span>
      <span className="switch__label">{label}</span>
    </label>
  )
}
