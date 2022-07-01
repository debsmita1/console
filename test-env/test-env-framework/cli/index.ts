import { resolve } from 'path';
import { Item, parseFile, getRootItem } from '../api';
import { getWatchResourceWatchers } from '../lib/watchResource';

const intent = (level: number, intention = '  ') => {
  return Array(level).fill(intention).join('');
}

const print = (item: Item, level = 0) => {
  console.log(`${intent(level)}- ${item.type} ${item.name}`);
  item.children?.forEach((child) => print(child, level + 1));
}

const printRoot = (item: Item, level = 0) => {
  item.children.forEach((child) => print(child, level));
}

const filenames = (process.argv[2] || '').split(',');
if (filenames.length === 0) {
  throw new Error('Please specific at least one filename');
}

(async () => {
  const cwd = process.cwd();
  for (const filename of filenames) {
    const fullFilename = resolve(cwd, filename);
    console.log(`Import ${filename} (${fullFilename})...`)
    await parseFile(filename, () => import(fullFilename));
  }
})().then(
  () => printRoot(getRootItem()),
  (error) => console.error(error),
);
