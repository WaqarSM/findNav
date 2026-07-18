type FindNavChromeApi = {
  tabs: {
    query(
      queryInfo: { active: boolean; currentWindow: boolean },
      callback: (tabs: Array<{ id?: number; url?: string; title?: string }>) => void,
    ): void;
    sendMessage(tabId: number, message: unknown, callback?: (response?: unknown) => void): void;
  };
  runtime: {
    lastError?: { message: string };
    onMessage?: {
      addListener(
        callback: (
          message: unknown,
          sender: { tab?: { id?: number; url?: string } },
          sendResponse: (response?: unknown) => void,
        ) => void,
      ): void;
    };
  };
};

declare const chrome: FindNavChromeApi | undefined;
