"use client";

interface HashtagTextProps {
  note: string;
  onTagClick: (tag: string) => void;
}

export function HashtagText({ note, onTagClick }: HashtagTextProps) {
  const parts = note.split(/(#[^\s#]+)/g);

  return (
    <>
      {parts.map((part, i) =>
        /^#[^\s#]+$/.test(part) ? (
          <button
            key={i}
            onClick={(e) => {
              e.stopPropagation();
              onTagClick(part);
            }}
            className="text-blue-500 hover:underline"
          >
            {part}
          </button>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}
