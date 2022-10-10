import * as React from 'react';
import { QuickStart } from '@patternfly/quickstarts';
import { Alert, DualListSelector } from '@patternfly/react-core';
import * as fuzzy from 'fuzzysearch';
import { useTranslation } from 'react-i18next';
import {
  getGroupVersionKindForModel,
  ResourceIcon,
} from '@console/dynamic-plugin-sdk/src/lib-core';
import { useK8sWatchResource } from '@console/dynamic-plugin-sdk/src/utils/k8s/hooks/useK8sWatchResource';
import { k8sPatchResource } from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-resource';
import { ConsoleOperatorConfigModel } from '@console/internal/models';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { useDebounceCallback } from '@console/shared/src';
import { QuickStartModel } from '../../models';
import useConsoleOperatorConfig from '../cluster-configuration/useConsoleOperatorConfig';

type DisabledQuickStartsConsoleConfig = K8sResourceKind & {
  spec: {
    customization?: {
      quickStarts?: {
        disabled: string[];
      };
    };
  };
};

type ItemProps = { id: string; quickStart?: QuickStart };

const Item: React.FC<ItemProps> = ({ id, quickStart }) => (
  <div style={{ display: 'flex', alignItems: 'center' }}>
    {quickStart ? (
      <>
        <ResourceIcon groupVersionKind={getGroupVersionKindForModel(QuickStartModel)} />
        <div>
          <div>{quickStart.spec.displayName || quickStart.metadata.name}</div>
          {quickStart.spec.displayName ? <div>{quickStart.metadata.name}</div> : null}
        </div>
      </>
    ) : (
      id
    )}
  </div>
);

type SaveStatus =
  | { status: 'pending' }
  | { status: 'in-progress' }
  | { status: 'successful' }
  | { status: 'error'; error: any };

const QuickStartConfiguration: React.FC<{ readonly: boolean }> = ({ readonly }) => {
  const { t } = useTranslation();

  // All available quick starts
  const [allQuickStarts, allQuickStartsLoaded, allQuickStartsError] = useK8sWatchResource<
    QuickStart[]
  >({
    groupVersionKind: getGroupVersionKindForModel(QuickStartModel),
    isList: true,
  });

  // Current configuration
  const [consoleConfig, consoleConfigLoaded, consoleConfigError] = useConsoleOperatorConfig<
    DisabledQuickStartsConsoleConfig
  >();
  const [disabled, setDisabled] = React.useState<string[]>();
  React.useEffect(() => {
    if (consoleConfig && consoleConfigLoaded && !disabled) {
      setDisabled(consoleConfig?.spec?.customization?.quickStarts?.disabled || []);
    }
  }, [consoleConfig, consoleConfigLoaded, disabled]);

  // Calculate options
  const enabledOptions = React.useMemo<React.ReactElement<ItemProps>[]>(() => {
    if (!consoleConfigLoaded || !allQuickStartsLoaded || allQuickStartsError || !disabled) {
      return [];
    }
    return allQuickStarts
      .filter((quickStart) => !disabled || !disabled.includes(quickStart.metadata.name))
      .map((quickStart) => (
        <Item
          key={quickStart.metadata.name}
          id={quickStart.metadata.name}
          quickStart={quickStart}
        />
      ));
  }, [allQuickStarts, allQuickStartsError, allQuickStartsLoaded, consoleConfigLoaded, disabled]);
  const disabledOptions = React.useMemo<React.ReactElement<ItemProps>[]>(() => {
    if (!disabled) {
      return [];
    }
    const quickStartsByName = allQuickStarts.reduce((acc, quickStart) => {
      acc[quickStart.metadata.name] = quickStart;
      return acc;
    }, {});
    return disabled.map((id) => <Item key={id} id={id} quickStart={quickStartsByName[id]} />);
  }, [allQuickStarts, disabled]);

  // Save the latest value (disabled string array)
  const [saveStatus, setSaveStatus] = React.useState<SaveStatus>();
  const save = useDebounceCallback(() => {
    setSaveStatus({ status: 'in-progress' });
    k8sPatchResource({
      model: ConsoleOperatorConfigModel,
      resource: consoleConfig,
      data: [
        {
          op: 'replace',
          path: '/spec/customization/quickStarts/disabled',
          value: disabled,
        },
      ],
    })
      .then(() => setSaveStatus({ status: 'successful' }))
      .catch((error) => setSaveStatus({ status: 'error', error }));
  }, 2000);

  // Extract disabled string array from Items
  const onListChange = (
    newEnabledOptions: React.ReactElement<ItemProps>[],
    newDisabledOptions: React.ReactElement<ItemProps>[],
  ) => {
    setDisabled(newDisabledOptions.map((node) => node.props.id));
    setSaveStatus({ status: 'pending' });
    save();
  };

  const filterOption = (option: React.ReactElement<ItemProps>, input: string): boolean => {
    const title =
      option.props.quickStart?.spec.displayName ||
      option.props.quickStart?.metadata.name ||
      option.props.id;
    return fuzzy(input.toLocaleLowerCase(), title);
  };

  return (
    <>
      <h2>{t('console-app~Quick starts')}</h2>
      <DualListSelector
        availableOptionsTitle={t('console-app~Enabled Quick starts')}
        chosenOptionsTitle={t('console-app~Disabled Quick starts')}
        isSearchable
        availableOptions={enabledOptions}
        chosenOptions={disabledOptions}
        onListChange={onListChange}
        filterOption={filterOption}
        isDisabled={readonly || !allQuickStartsLoaded || !consoleConfigLoaded || consoleConfigError}
      />
      <pre>{JSON.stringify(disabled, null, 2)}</pre>
      {consoleConfigError ? (
        <Alert variant="warning" isInline title={t('console-app~Could not load configuration.')} />
      ) : null}
      {saveStatus?.status === 'successful' ? (
        <Alert variant="success" isInline title={t('console-app~Saved.')}>
          {t(
            'console-app~This config update requires a console rollout, this can take up to a minute and require a browser refresh.',
          )}
        </Alert>
      ) : null}
      {saveStatus?.status === 'error' ? (
        <Alert variant="danger" isInline title={t('console-app~Could not save configuration.')} />
      ) : null}
    </>
  );
};

export default QuickStartConfiguration;
