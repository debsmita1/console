import * as React from 'react';
import { getRolloutAction, getPauseAction } from './creators';
import { ResourceActionsScope } from './types';

export const useDeploymentConfigActionMenuProvider = (scope: ResourceActionsScope) => {
  const actions = React.useMemo(() => [getRolloutAction(scope), getPauseAction(scope)], [scope]);

  return [actions, true, undefined];
};
