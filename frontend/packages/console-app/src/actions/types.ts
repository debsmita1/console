import { K8sKind, K8sResourceKind } from '@console/internal/module/k8s';

export type ResourceActionsScope = {
  kind: K8sKind;
  obj: K8sResourceKind;
  customData?: { [key: string]: any };
  resources?: any;
};
