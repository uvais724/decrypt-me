// components/Board.jsx
import Cell from "./Cell";

export default function Board({ board, onGuess, activeIndex, setActiveIndex, errorIndex }) {
  return (
    <div className="flex flex-col items-center my-5">
      {(() => {
        // Group cells by words (words are separated by spaces or non-letters)
        const groups = [];
        let currentGroup = [];

        board.forEach((cell, index) => {
          const isLetter = /[A-Z]/.test(cell.letter);
          const isSpace = cell.letter === " ";

          if (isLetter) {
            currentGroup.push({ cell, index });
          } else {
            // Push current word group if it exists
            if (currentGroup.length > 0) {
              groups.push(currentGroup);
              currentGroup = [];
            }
            // Push the non-letter as its own group
            groups.push([{ cell, index }]);
          }
        });

        // Don't forget the last group
        if (currentGroup.length > 0) {
          groups.push(currentGroup);
        }

        // Calculate lines based on word lengths
        const lines = [];
        let currentLine = [];
        let currentLineLength = 0;

        groups.forEach((group) => {
          const groupLength = group.length;
          const isWord = groupLength > 1 || (groupLength === 1 && /[A-Z]/.test(group[0].cell.letter));

          if (isWord) {
            // For words, check if they fit on current line
            if (currentLineLength + groupLength <= 8 || currentLine.length === 0) {
              // Word fits or it's the first word on line
              currentLine.push(group);
              currentLineLength += groupLength;
            } else {
              // Word doesn't fit, start new line
              lines.push(currentLine);
              currentLine = [group];
              currentLineLength = groupLength;
            }
          } else {
            // For single non-letter characters (spaces, punctuation)
            currentLine.push(group);
            currentLineLength += 1;
          }
        });

        // Push the last line
        if (currentLine.length > 0) {
          lines.push(currentLine);
        }

        // Render lines
        return lines.map((line, lineIndex) => (
          <div key={`line-${lineIndex}`} className="flex justify-center items-end mb-2">
            {line.map((group, groupIndex) => (
              <div key={`group-${lineIndex}-${groupIndex}`} className="flex items-end">
                {group.map(({ cell, index: cellIndex }) => (
                  cell.letter === " " || !/[A-Z]/.test(cell.letter) ? (
                    <span key={cellIndex} className="text-4xl px-1">
                      {cell.letter}
                    </span>
                  ) : (
                    <Cell
                      key={`cell-${cellIndex}`}
                      cell={cell}
                      isActive={cellIndex === activeIndex}
                      onGuess={onGuess}
                      onFocus={() => setActiveIndex(cell.index)}
                      isError={cellIndex === errorIndex}
                    />
                  )
                ))}
              </div>
            ))}
          </div>
        ));
      })()}
    </div>
  );
}
