import * as React from 'react';
import { Node } from '@patternfly/react-topology';
import { ActionsLoader } from '@console/shared';
import { kebabActionsToMenu } from '@console/shared/src/components/kebab/kebab-utils';
import { createMenuItems } from '@console/topology/src/components/graph-view';
import { getResource } from '@console/topology/src/utils';
import { HelmActionOrigins } from '../../types/helm-types';

export const helmReleaseContextMenu = (element: Node): any => {
  const { namespace } = getResource(element).metadata;
  const actionsScope = {
    releaseName: element.getLabel(),
    namespace,
    actionOrigin: HelmActionOrigins.topology,
  };

  return (
    <ActionsLoader contextId="helm-actions" scope={actionsScope}>
      {(actions, loaded) => loaded && createMenuItems(kebabActionsToMenu(actions))}
    </ActionsLoader>
  );
};
