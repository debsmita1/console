// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useSelector } from 'react-redux';
import { getActivePerspective } from '@console/internal/reducers/ui';
import { useUserSettingsCompatibility } from './useUserSettingsCompatibility';
import { PINNED_RESOURCES_LOCAL_STORAGE_KEY } from '../constants';

type PinnedResourcesType = {
  [perspective: string]: string[];
};

const PINNED_RESOURCES_CONFIG_MAP_KEY = 'console.pinnedResources';

export const usePinnedResources = (): [string[], (pinnedResources: string[]) => void, boolean] => {
  const activePerspective = useSelector(getActivePerspective);
  const [pinnedResources, setPinnedResources, loaded] = useUserSettingsCompatibility<
    PinnedResourcesType
  >(PINNED_RESOURCES_CONFIG_MAP_KEY, PINNED_RESOURCES_LOCAL_STORAGE_KEY, {}, true);
  return [
    loaded ? pinnedResources[activePerspective] : [],
    (pr: string[]) => {
      setPinnedResources((prevPR) => ({ ...prevPR, [activePerspective]: pr }));
    },
    loaded,
  ];
};
