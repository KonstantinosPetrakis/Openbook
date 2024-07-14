export default function ChoiceInput({ options, value, setValue }) {
    return (
        <select onInput={(e) => setValue(e.target.value)} value={value}>
            <option label=" "></option>
            {Object.entries(options).map(([optionKey, optionLabel]) => (
                <option key={optionKey} value={optionKey}>
                    {optionLabel}
                </option>
            ))}
        </select>
    );
}
