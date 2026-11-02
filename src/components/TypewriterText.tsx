import React, { useState, useEffect, useRef } from 'react';

interface TypewriterTextProps {
  text: string;
  speed?: number; // ms per char (default: 36ms for deliberate, readable cadence)
  onComplete?: () => void;
  onTick?: () => void;
  className?: string;
  cursorColor?: string;
  allowSkip?: boolean;
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  speed = 36,
  onComplete,
  onTick,
  className = '',
  cursorColor = 'text-amber-400',
  allowSkip = true,
}) => {
  const [displayedLength, setDisplayedLength] = useState<number>(0);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const onCompleteRef = useRef(onComplete);
  const onTickRef = useRef(onTick);
  onCompleteRef.current = onComplete;
  onTickRef.current = onTick;

  useEffect(() => {
    setDisplayedLength(0);
    setIsFinished(false);

    if (!text) {
      setIsFinished(true);
      onCompleteRef.current?.();
      return;
    }

    let currentIndex = 0;
    let timerId: any = null;

    const typeNextChar = () => {
      currentIndex++;
      setDisplayedLength(currentIndex);
      onTickRef.current?.();

      if (currentIndex >= text.length) {
        setIsFinished(true);
        onCompleteRef.current?.();
        return;
      }

      // Check character for natural typing pauses
      const lastChar = text[currentIndex - 1];
      let delay = speed;
      if (lastChar === '.' || lastChar === '?' || lastChar === '!') {
        delay = speed * 3.5; // subtle natural pause after sentences
      } else if (lastChar === ',' || lastChar === ';' || lastChar === ':') {
        delay = speed * 2; // subtle natural pause after clauses
      }

      timerId = setTimeout(typeNextChar, delay);
    };

    timerId = setTimeout(typeNextChar, speed);

    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [text, speed]);

  const handleSkip = () => {
    if (!isFinished && allowSkip) {
      setDisplayedLength(text.length);
      setIsFinished(true);
      onCompleteRef.current?.();
    }
  };

  const visibleText = text.slice(0, displayedLength);

  return (
    <span
      onClick={handleSkip}
      className={`inline ${allowSkip && !isFinished ? 'cursor-pointer select-none' : ''} ${className}`}
      title={allowSkip && !isFinished ? 'Click to show all text' : undefined}
    >
      <span className="whitespace-pre-line">{visibleText}</span>
      {!isFinished && (
        <span
          className={`inline-block font-bold ml-0.5 animate-pulse ${cursorColor}`}
          aria-hidden="true"
        >
          ▍
        </span>
      )}
    </span>
  );
};
