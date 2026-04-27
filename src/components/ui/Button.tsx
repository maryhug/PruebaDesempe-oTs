interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "danger";
    loading?: boolean;
}

export function Button({ variant = "primary", loading, children, disabled, ...props }: ButtonProps) {
    const styles = {
        primary: "bg-blue-600 hover:bg-blue-700 text-white",
        secondary: "bg-gray-200 hover:bg-gray-300 text-gray-800",
        danger: "bg-red-600 hover:bg-red-700 text-white",
    };

    return (
        <button
            {...props}
            disabled={disabled || loading}
            className={`px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${styles[variant]} ${props.className ?? ""}`}
        >
            {loading ? "Cargando..." : children}
        </button>
    );
}