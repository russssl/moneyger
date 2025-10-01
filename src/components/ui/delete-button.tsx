"use client";

import { useState } from "react";
import { Button } from "./button";
import { Trash } from "lucide-react";

export default function DeleteButton({ onClick }: { onClick: () => void }) {
  const [clicked, setClicked] = useState(false);
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (clicked) {
      onClick();
      setClicked(false);
    } else {
      setClicked(true);
      setTimeout(() => {
        setClicked(false);
      }, 1000);
    }
  };
  return (
    <Button variant="destructive" onClick={handleClick}>
      {clicked ? (
        <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M8 4v4m0 4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ) : (
        <Trash className="h-4 w-4" />
      )}
    </Button>
  );
}