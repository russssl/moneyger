interface GoogleProps {
  noBackground?: boolean;
}

const Google = ({ noBackground = false }: GoogleProps) => {
  return (
    <div className={noBackground ? "" : "bg-[#1c1c1c] rounded-full p-2"}>
      <svg
        role="img"
        viewBox="0 0 24 24"
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`w-5 h-5 ${noBackground ? "stroke-foreground" : "stroke-white"}`}
        xmlns="http://www.w3.org/2000/svg"
        style={{ transform: "scaleY(-1)" }}
      >
        <title>Google</title>
        <path d="M21 12a9 9 0 1 0-9 9c2.28 0 4.3-.84 5.87-2.23a.5.5 0 0 0 .13-.61l-1.14-2a.5.5 0 0 0-.74-.15 5.5 5.5 0 1 1 1.52-5.95H12v3h9z" />
      </svg>
    </div>
  );
};

export default Google;
