export const streamHandler = (res) => {
    return {
      write: (chunk) => {
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      },
      end: () => {
        res.write('data: [DONE]\n\n');
        res.end();
      }
    };
  };