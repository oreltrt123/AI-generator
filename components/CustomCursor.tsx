"use client";

import { useEffect } from "react";

export default function CustomCursor() {
  useEffect(() => {
    const cursor = document.createElement("div");
    cursor.classList.add("custom-cursor");
    document.body.appendChild(cursor);

    const move = (e: MouseEvent) => {
      cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    };

    const addHover = () => cursor.classList.add("clickable");
    const removeHover = () => cursor.classList.remove("clickable");

    window.addEventListener("mousemove", move);
    document.querySelectorAll("button, a, input, textarea, [role='button']").forEach((el) => {
      el.addEventListener("mouseenter", addHover);
      el.addEventListener("mouseleave", removeHover);
    });

    return () => {
      window.removeEventListener("mousemove", move);
      cursor.remove();
    };
  }, []);

  return null;
}
