import * as React from 'react';
import { GraphElement, Node } from '@patternfly/react-topology';
import { Action } from '@console/dynamic-plugin-sdk';
import { modelFor, referenceFor } from '@console/internal/module/k8s';
import { isWorkloadRegroupable } from '@console/topology/src/components/graph-view/components/nodeContextMenu';
import { getResource, isOperatorBackedNode } from '@console/topology/src/utils/topology-utils';
import { getRolloutAction, getPauseAction, getModifyApplication } from './creators';
import { ResourceActionsScope } from './types';

const deploymentConfigMenuActions = (actions: Action[], scope: ResourceActionsScope) => {
  return [...actions, getRolloutAction(scope), getPauseAction(scope)];
};

export const useWorkloadActionProvider = (element: GraphElement) => {
  const resourceObj = getResource(element as Node);
  const { resources } = element.getData();
  const isOperatorBacked = isOperatorBackedNode(element);
  const resourceKind = modelFor(referenceFor(resourceObj));
  const scope = React.useMemo(() => {
    return {
      kind: resourceKind,
      obj: resourceObj,
      customData: { isOperatorBacked },
      resources,
    };
  }, [isOperatorBacked, resourceKind, resourceObj, resources]);

  if (!resourceObj) {
    return [[], true, undefined];
  }

  let menuActions: Action[] = [];
  if (isWorkloadRegroupable(element as Node)) {
    menuActions.push(getModifyApplication(scope));
  }

  switch (resourceKind.kind) {
    case 'DeploymentConfig':
      menuActions = deploymentConfigMenuActions(menuActions, scope);
      break;
    /* case 'Deployment':
      menuActions.push(...deploymentMenuActions);
      break;
    case 'StatefulSet':
      menuActions.push(...statefulSetMenuActions);
      break;
    case 'DaemonSet':
      menuActions.push(...daemonSetMenuActions);
      break;
    case 'CronJob':
      menuActions.push(...cronJobActions);
      break;
    case 'Job':
      menuActions.push(...jobActions);
      break;
    case 'Pod':
      menuActions.push(...podActions);
      break;
    default:
      menuActions.push(...defaultMenuForKind(contextMenuResource.kind));
      break; */

    default:
      break;
  }

  /*  return _.map(menuActions, (a) =>
    a(modelFor(referenceFor(contextMenuResource)), contextMenuResource, resources, {
      isOperatorBacked,
    }),
  ); */

  // const actions = React.useMemo(() => [getRolloutAction(scope), getPauseAction(scope)], [scope]);

  return [menuActions, true, undefined];
};
