import * as React from 'react';
// FIXME upgrading redux types is causing many errors at this time
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { useSelector } from 'react-redux';
import { RootState } from '@console/internal/redux';
import { ConfigMapModel } from '@console/internal/models';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { useUserSettingsLocalStorage } from './useUserSettingsLocalStorage';
import {
  createConfigMap,
  deseralizeData,
  getProject,
  createProject,
  seralizeData,
  updateConfigMap,
  USER_SETTING_CONFIGMAP_NAMESPACE,
} from '../utils/user-settings';

const useCounterRef = (initialValue: number = 0): [boolean, () => void, () => void] => {
  const counterRef = React.useRef<number>(initialValue);
  const increment = React.useCallback(() => {
    counterRef.current += 1;
  }, []);
  const decrement = React.useCallback(() => {
    counterRef.current -= 1;
  }, []);
  return [counterRef.current !== initialValue, increment, decrement];
};

export const useUserSettings = <T>(
  key: string,
  defaultValue?: T,
  sync: boolean = false,
): [T, React.Dispatch<React.SetStateAction<T>>, boolean] => {
  const defaultValueRef = React.useRef<T>(defaultValue);
  const keyRef = React.useRef<string>(key);
  const [isRequestPending, increaseRequest, decreaseRequest] = useCounterRef();
  const userUid = useSelector(
    (state: RootState) => state.UI.get('user')?.metadata?.uid ?? 'kubeadmin',
  );
  const configMapResource = React.useMemo(
    () => ({
      kind: ConfigMapModel.kind,
      namespace: USER_SETTING_CONFIGMAP_NAMESPACE,
      isList: false,
      name: `user-settings-${userUid}`,
    }),
    [userUid],
  );
  const [cfData, cfLoaded, cfLoadError] = useK8sWatchResource<K8sResourceKind>(configMapResource);
  const [settings, setSettings] = React.useState<T>();
  const settingsRef = React.useRef<T>(settings);
  settingsRef.current = settings;
  const [loaded, setLoaded] = React.useState(false);

  const [fallbackLocalStorage, setFallbackLocalStorage] = React.useState<boolean>(false);
  const [lsData, setLsDataCallback] = useUserSettingsLocalStorage(
    keyRef.current,
    defaultValueRef.current,
    fallbackLocalStorage,
  );

  React.useEffect(() => {
    if (cfLoadError || (!cfData && cfLoaded)) {
      (async () => {
        // this would be replaced with proxy endpoint to create ConfigMap
        try {
          const projectExists = await getProject();
          if (!projectExists) await createProject();
          await createConfigMap({
            apiVersion: ConfigMapModel.apiVersion,
            kind: ConfigMapModel.kind,
            metadata: {
              name: `user-settings-${userUid}`,
              namespace: USER_SETTING_CONFIGMAP_NAMESPACE,
            },
            data: {
              ...(defaultValueRef.current !== undefined && {
                [keyRef.current]: seralizeData(defaultValueRef.current),
              }),
            },
          });
        } catch (err) {
          if (err?.response?.status === 403) {
            setFallbackLocalStorage(true);
          } else {
            setSettings(defaultValueRef.current);
            setLoaded(true);
          }
        }
      })();
    } else if (
      !fallbackLocalStorage &&
      cfData &&
      cfLoaded &&
      (!cfData.data?.hasOwnProperty(keyRef.current) ||
        seralizeData(settings) !== cfData.data?.[keyRef.current])
    ) {
      setSettings(deseralizeData(cfData.data?.[keyRef.current]) ?? defaultValueRef.current);
      setLoaded(true);
    } else if (!fallbackLocalStorage && cfLoaded) {
      setSettings(defaultValueRef.current);
      setLoaded(true);
    }
    // This effect should only be run on change of configmap data, status.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfLoadError, cfLoaded, fallbackLocalStorage]);

  const callback = React.useCallback<React.Dispatch<React.SetStateAction<T>>>(
    (action: React.SetStateAction<T>) => {
      const previousSettings = settingsRef.current;
      const newState =
        typeof action === 'function' ? (action as (prevState: T) => T)(previousSettings) : action;
      setSettings(newState);
      if (cfLoaded) {
        increaseRequest();
        updateConfigMap(cfData, keyRef.current, seralizeData(newState))
          .then(() => {
            decreaseRequest();
          })
          .catch(() => {
            decreaseRequest();
            setSettings(previousSettings);
          });
      }
    },
    [cfData, cfLoaded, decreaseRequest, increaseRequest],
  );

  const resultedSettings = React.useMemo(() => {
    if (
      sync &&
      !isRequestPending &&
      cfData &&
      cfLoaded &&
      seralizeData(settingsRef.current) !== cfData?.data?.[keyRef.current]
    ) {
      return deseralizeData(cfData?.data?.[keyRef.current]);
    }
    return settings;
  }, [sync, isRequestPending, cfData, cfLoaded, settings]);

  return fallbackLocalStorage
    ? [lsData, setLsDataCallback, true]
    : [resultedSettings, callback, loaded];
};
