import * as React from 'react';
import { Node } from '@patternfly/react-topology';
import { kebabOptionsToMenu } from '@console/internal/components/utils';
import { ActionsLoader } from '@console/shared';
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
      {(actions, loaded) => loaded && createMenuItems(kebabOptionsToMenu(actions))}
    </ActionsLoader>
  );
};
