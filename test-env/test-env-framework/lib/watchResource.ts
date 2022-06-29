interface WatchOptions {
  kind: string;
};

interface Resource {
  kind: string;
}

type WatchCallback = (resource: Resource) => void;

interface Watcher {
  options: WatchOptions
  callback: WatchCallback;
}

const watchers: Watcher[] = []

export const watchResource = (options: WatchOptions, callback: WatchCallback) => {
  const watcher: Watcher = { options, callback };
  watchers.push(watcher);
}

export const getWatchResourceWatchers = () => watchers;
