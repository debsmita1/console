import * as React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { WatchK8sResults } from '@console/dynamic-plugin-sdk';
import { useFlag } from '@console/shared/src/hooks/flag';
import {
  HealthState,
  healthStateMapping,
  healthStateMessage,
} from '@console/shared/src/components/dashboard/status-card/states';
import Status, {
  StatusPopupSection,
} from '@console/shared/src/components/dashboard/status-card/StatusPopup';
import { getCephHealthState } from './dashboards/persistent-internal/status-card/utils';
import { WatchCephResource } from '../types';
import { ODF_MODEL_FLAG } from '../constants/common';

export const StoragePopover: React.FC<StoragePopoverProps> = ({ ceph }) => {
  const { t } = useTranslation();

  const health = getCephHealthState({ ceph }, t);
  const icon =
    health.state === HealthState.LOADING ? (
      <div className="skeleton-health" />
    ) : (
      healthStateMapping[health.state].icon
    );
  const value = health.message || healthStateMessage(health.state, t);
  const isOdfInstalled = useFlag(ODF_MODEL_FLAG);
  const operatorName = !isOdfInstalled
    ? t('ceph-storage-plugin~OpenShift Container Storage')
    : t('ceph-storage-plugin~OpenShift Data Foundation');
  const dashboardLink = !isOdfInstalled ? '/ocs-dashboards' : '/odf';

  return (
    <>
      {t(
        "ceph-storage-plugin~Storage status represents the health status of {{operatorName}}'s StorageCluster.",
        { operatorName },
      )}
      <StatusPopupSection
        firstColumn={t('ceph-storage-plugin~Provider')}
        secondColumn={t('ceph-storage-plugin~Health')}
      >
        <Status key="ocs" value={value} icon={icon}>
          <Link to={dashboardLink}>{operatorName}</Link>
        </Status>
      </StatusPopupSection>
    </>
  );
};

type StoragePopoverProps = WatchK8sResults<WatchCephResource>;
