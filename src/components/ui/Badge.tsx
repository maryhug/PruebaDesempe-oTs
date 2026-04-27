interface BadgeProps {
    children: React.ReactNode;
    variant?: "green" | "blue" | "red" | "gray" | "yellow";
}

export function Badge({ children, variant = "gray" }: BadgeProps) {
    const styles = {
        green: "bg-green-100 text-green-800",
        blue: "bg-blue-100 text-blue-800",
        red: "bg-red-100 text-red-800",
        gray: "bg-gray-100 text-gray-800",
        yellow: "bg-yellow-100 text-yellow-800",
    };

    return (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[variant]}`}>
      {children}
    </span>
    );
}