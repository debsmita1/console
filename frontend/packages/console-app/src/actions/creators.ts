import * as _ from 'lodash';
import { Action } from '@console/dynamic-plugin-sdk';
import { configureUpdateStrategyModal, errorModal } from '@console/internal/components/modals';
import { togglePaused } from '@console/internal/components/utils';
import { truncateMiddle } from '@console/internal/components/utils/truncate-middle';
import i18n from '@console/internal/i18n';
import {
  DaemonSetModel,
  DeploymentConfigModel,
  DeploymentModel,
  StatefulSetModel,
} from '@console/internal/models';
import { k8sCreate, K8sResourceKind, referenceForModel } from '@console/internal/module/k8s';
import { RESOURCE_NAME_TRUNCATE_LENGTH } from '@console/shared/src/constants';
import { editApplicationModal } from '@console/topology/src/components/modals';
import { ResourceActionsScope } from './types';

const modifyWebConsoleApplicationRefs = [
  referenceForModel(DeploymentConfigModel),
  referenceForModel(DeploymentModel),
  referenceForModel(DaemonSetModel),
  referenceForModel(StatefulSetModel),
];

const editApplicationRefs = [
  referenceForModel(DeploymentConfigModel),
  referenceForModel(DeploymentModel),
];

const rollout = (dc: K8sResourceKind): Promise<K8sResourceKind> => {
  const req = {
    kind: 'DeploymentRequest',
    apiVersion: 'apps.openshift.io/v1',
    name: dc.metadata.name,
    latest: true,
    force: true,
  };
  const opts = {
    name: dc.metadata.name,
    ns: dc.metadata.namespace,
    path: 'instantiate',
  };
  return k8sCreate(DeploymentConfigModel, req, opts);
};

export const getRolloutAction = ({ kind, obj }: ResourceActionsScope): Action => ({
  id: 'start-rollout-action',
  label: i18n.t('console-app~Start rollout'),
  cta: () =>
    rollout(obj).catch((err) => {
      const error = err.message;
      errorModal({ error });
    }),
  accessReview: {
    group: kind.apiGroup,
    resource: kind.plural,
    subresource: 'instantiate',
    name: obj.metadata.name,
    namespace: obj.metadata.namespace,
    verb: 'create',
  },
});

export const getPauseAction = ({ kind, obj }: ResourceActionsScope): Action => ({
  id: obj.spec.paused ? 'resume-rollouts-action' : 'pause-rollouts-action',
  label: obj.spec.paused
    ? i18n.t('console-app~Resume rollouts')
    : i18n.t('console-app~Pause rollouts'),
  cta: () => togglePaused(kind, obj).catch((err) => errorModal({ error: err.message })),
  accessReview: {
    group: kind.apiGroup,
    resource: kind.plural,
    name: obj.metadata.name,
    namespace: obj.metadata.namespace,
    verb: 'patch',
  },
});

export const getUpdateStrategy = ({ kind, obj }: ResourceActionsScope): Action => ({
  id: 'edit-update-strategy-action',
  label: i18n.t('console-app~Edit update strategy'),
  cta: () => configureUpdateStrategyModal({ obj }),
  accessReview: {
    group: kind.apiGroup,
    resource: kind.plural,
    name: obj.metadata.name,
    namespace: obj.metadata.namespace,
    verb: 'patch',
  },
});

export const getModifyApplication = ({ kind, obj }: ResourceActionsScope): Action => {
  return {
    id: 'edit-application-group-action',
    label: i18n.t('console-app~Edit Application grouping'),
    cta: () =>
      editApplicationModal({
        resourceKind: kind,
        resource: obj,
        blocking: true,
        initialApplication: '',
      }),
    accessReview: {
      group: kind.apiGroup,
      resource: kind.plural,
      name: obj.metadata.name,
      namespace: obj.metadata.namespace,
      verb: 'patch',
    },
  };
};

export const getEditApplication = ({ kind, obj }: ResourceActionsScope): Action => {
  const annotation = obj?.metadata?.annotations?.['openshift.io/generated-by'];
  const isFromDevfile = obj?.metadata?.annotations?.isFromDevfile;
  return {
    id: 'edit-application-name-action',
    label: i18n.t('console-app~Edit {{applicationName}}'),
    labelKind: {
      applicationName: truncateMiddle(obj.metadata.name, { length: RESOURCE_NAME_TRUNCATE_LENGTH }),
    },
    hidden: annotation !== 'OpenShiftWebConsole' || !!isFromDevfile,
    cta: {
      href: `/edit/ns/${obj.metadata.namespace}?name=${obj.metadata.name}&kind=${obj.kind || kind}`,
    },
    accessReview: {
      group: kind.apiGroup,
      resource: kind.plural,
      name: obj.metadata.name,
      namespace: obj.metadata.namespace,
      verb: 'update',
    },
  };
};

export const getCommonActionsForKind = ({ kind, obj }: ResourceActionsScope): Action[] => {
  if (!kind) {
    // no common actions
    return [];
  }

  return _.includes(modifyWebConsoleApplicationRefs, referenceForModel(kind))
    ? [
        ...(_.includes(editApplicationRefs, referenceForModel(kind))
          ? [getEditApplication({ kind, obj })]
          : []),
      ]
    : [];
};
