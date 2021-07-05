import * as React from 'react';
import { GraphElement, Node } from '@patternfly/react-topology';
import { getResource } from '@console/topology/src/utils';
import { TYPE_HELM_RELEASE } from '../topology/components/const';
import { getHelmDeleteAction, getHelmRollbackAction, getHelmUpgradeAction } from './creators';
import { HelmActionsScope } from './types';

export const useHelmActionProvider = (scope: HelmActionsScope) => {
  const actions = React.useMemo(
    () => [getHelmUpgradeAction(scope), getHelmRollbackAction(scope), getHelmDeleteAction(scope)],
    [scope],
  );

  return [actions, true, undefined];
};

export const useHelmActionProviderForTopology = (element: GraphElement) => {
  const nodeType = element.getType();
  const scope = React.useMemo(() => {
    const releaseName = element.getLabel();
    const { namespace } = getResource(element as Node).metadata;
    return {
      releaseName,
      namespace,
      actionOrigin: 'topology',
    };
  }, [element]);
  const actions = useHelmActionProvider(scope);
  if (nodeType !== TYPE_HELM_RELEASE) return [[], true, undefined];
  return actions;
};
