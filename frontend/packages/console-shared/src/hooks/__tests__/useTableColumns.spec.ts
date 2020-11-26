import { referenceForModel } from '@console/internal/module/k8s';
import { PodModel, NamespaceModel } from '@console/internal/models';
import * as userHooks from '@console/shared/src/hooks/useUserSettingsCompatibility';
import { testHook } from '../../../../../__tests__/utils/hooks-utils';
import { useTableColumns } from '../useTableColumns';

const podColumnManagementID = referenceForModel(PodModel);
const NamespacesColumnManagementID = referenceForModel(NamespaceModel);

describe('useTableColumns', () => {
  it('should return columns based on the id', () => {
    spyOn(userHooks, 'useUserSettingsCompatibility').and.returnValue([
      {
        'core~v1~Pod': [
          'name',
          'namespace',
          'status',
          'ready',
          'restarts',
          'owner',
          'memory',
          'cpu',
        ],
        'core~v1~Node': [
          'name',
          'status',
          'memory',
          'cpu',
          'filesystem',
          'created',
          'instanceType',
        ],
        'core~v1~Namespace': [
          'name',
          'displayName',
          'status',
          'requester',
          'memory',
          'cpu',
          'created',
        ],
      },
      () => null,
      true,
    ]);
    testHook(() => {
      const [state] = useTableColumns(podColumnManagementID);
      expect(state).toEqual([
        'name',
        'namespace',
        'status',
        'ready',
        'restarts',
        'owner',
        'memory',
        'cpu',
      ]);
    });
    testHook(() => {
      const [state] = useTableColumns(NamespacesColumnManagementID);
      expect(state).toEqual([
        'name',
        'displayName',
        'status',
        'requester',
        'memory',
        'cpu',
        'created',
      ]);
    });
  });
});
