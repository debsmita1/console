// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useUserSettingsCompatibility } from './useUserSettingsCompatibility';
import { COLUMN_MANAGEMENT_LOCAL_STORAGE_KEY } from '../constants';

type TableColumnsType = {
  [id: string]: string[];
};

export const COLUMN_MANAGEMENT_CONFIGMAP_KEY = 'console.tableColumns';

export const useTableColumns = (
  id: string,
): [string[], (selectedColumns: Set<string>) => void, boolean] => {
  const [tableColumns, setTableColumns, loaded] = useUserSettingsCompatibility<TableColumnsType>(
    COLUMN_MANAGEMENT_CONFIGMAP_KEY,
    COLUMN_MANAGEMENT_LOCAL_STORAGE_KEY,
    {},
    true,
  );

  return [
    loaded ? tableColumns[id] : [],
    (selectedColumns: Set<string>) => {
      setTableColumns((state) => {
        state[id] = [...selectedColumns];
        return state;
      });
    },
    loaded,
  ];
};

/* let currentColumns = {};
try {
  currentColumns = JSON.parse(localStorage.getItem(COLUMN_MANAGEMENT_LOCAL_STORAGE_KEY)) || {};
} catch (e) {
  // Error parsing stored columns. Flag an error and add the selected columns to an empty object
  /* eslint-disable-next-line no-console */
/* console.error('Error parsing column filters from local storage', e);
}
currentColumns[id] = [...selectedColumns];
localStorage.setItem(COLUMN_MANAGEMENT_LOCAL_STORAGE_KEY, JSON.stringify(currentColumns));
return action(ActionType.SetTableColumns, { id, selectedColumns }); */
