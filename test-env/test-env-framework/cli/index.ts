import { resolve } from 'path';
import { getWatchResourceWatchers } from '../lib/watchResource';

const filenames = (process.argv[2] || '').split(',');
if (filenames.length === 0) {
  throw new Error('Please specific at least one filename');
}

const cwd = process.cwd();
const importFiles = filenames.map((filename) => {
  console.log(`Import ${filename} (${resolve(cwd, filename)})...`)
  return import(resolve(cwd, filename))
});

Promise.all(importFiles).then(() => {
    const watchers = getWatchResourceWatchers();

    watchers.forEach((watcher, index) => {
      console.log(`- watcher ${index + 1}`, watcher);
    });
  
});
