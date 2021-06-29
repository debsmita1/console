import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  getHelmDeleteAction,
  getHelmRollbackAction,
  getHelmRollbackAction1,
  getHelmRollbackAction2,
  getHelmUpgradeAction,
  getHelmUpgradeAction1,
} from './creators';
import { HelmActionsScope } from './types';

export const useHelmActionProvider = (scope: HelmActionsScope) => {
  const { t } = useTranslation();
  const actions = React.useMemo(
    () => [
      getHelmUpgradeAction(scope, t),
      getHelmRollbackAction(scope, t),
      getHelmUpgradeAction1(scope, t),
      getHelmRollbackAction1(scope, t),
      getHelmRollbackAction2(scope, t),
      getHelmDeleteAction(scope, t),
    ],
    [scope, t],
  );

  return [actions, true, undefined];
};
