import { isAllowedGifUrl } from '../lib/gif-url';

const GIF_PATTERN = /\[\[gif:(https:\/\/[^\]]+)\]\]/g;

export default function MessageBody({
  body,
}: {
  body: string;
}) {
  const parts: Array<
    { type: 'text'; value: string } |
    { type: 'gif'; value: string }
  > = [];

  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let index = 0;

  while ((match = GIF_PATTERN.exec(body)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        value: body.slice(lastIndex, match.index),
      });
    }

    if (isAllowedGifUrl(match[1])) {
      parts.push({ type: 'gif', value: match[1] });
    } else {
      parts.push({ type: 'text', value: match[0] });
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < body.length) {
    parts.push({ type: 'text', value: body.slice(lastIndex) });
  }

  return (
    <>
      {parts.map(part => {
        const key = index++;

        if (part.type === 'gif') {
          return (
            <img
              key={key}
              className="chatGif"
              src={part.value}
              alt="GIF"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          );
        }

        return (
          <span key={key} style={{ whiteSpace: 'pre-wrap' }}>
            {part.value}
          </span>
        );
      })}
    </>
  );
}
