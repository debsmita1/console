import * as React from 'react';
import { Node } from '@patternfly/react-topology';
import { ActionsLoader } from '@console/shared';
import ActionMenuContent from '@console/shared/src/components/actions/menu/ActionMenuContent';

export const contextMenuActions = (element: Node): React.ReactElement[] => {
  return [
    <ActionsLoader contextId="topology-actions" scope={element}>
      {(loader) => {
        return loader.loaded && <ActionMenuContent options={loader.options} />;
      }}
    </ActionsLoader>,
  ];
};
