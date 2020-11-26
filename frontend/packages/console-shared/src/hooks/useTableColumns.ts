import * as React from 'react';
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
  const updateTableColumn = React.useCallback(
    (selectedColumns: Set<string>) => {
      setTableColumns((prevState) => {
        return { ...prevState, [id]: [...selectedColumns] };
      });
    },
    [id, setTableColumns],
  );
  const columns = React.useMemo(() => (loaded && tableColumns?.[id]) || [], [
    loaded,
    tableColumns,
    id,
  ]);
  return [columns, updateTableColumn, loaded];
};
