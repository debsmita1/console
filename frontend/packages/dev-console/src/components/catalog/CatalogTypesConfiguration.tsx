import * as React from 'react';
import { Alert, DualListSelector } from '@patternfly/react-core';
import * as fuzzy from 'fuzzysearch';
import { useTranslation } from 'react-i18next';
import useConsoleOperatorConfig from '@console/app/src/components/cluster-configuration/useConsoleOperatorConfig';
import { CatalogItemType, isCatalogItemType } from '@console/dynamic-plugin-sdk/src/extensions';
import { useResolvedExtensions } from '@console/dynamic-plugin-sdk/src/lib-core';
import { k8sPatchResource } from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-resource';
import { ConsoleOperatorConfigModel } from '@console/internal/models';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { useDebounceCallback } from '@console/shared/src';

type Types = {
  state: 'Enabled' | 'Disabled';
  enabled?: string[];
  disabled?: string[];
};

type DeveloperCatalogTypesConsoleConfig = K8sResourceKind & {
  spec: {
    customization?: {
      developerCatalog?: {
        types?: Types;
      };
    };
  };
};

type ItemProps = { type: string; title: string };

const Item: React.FC<ItemProps> = ({ title }) => <>{title}</>;

type SaveStatus =
  | { status: 'pending' }
  | { status: 'in-progress' }
  | { status: 'successful' }
  | { status: 'error'; error: any };

const CatalogTypesConfiguration: React.FC<{ readonly: boolean }> = ({ readonly }) => {
  const { t } = useTranslation();

  // Available catalog types
  const [catalogTypesExtensions, catalogTypesExtensionsLoaded] = useResolvedExtensions<
    CatalogItemType
  >(isCatalogItemType);
  const catalogTypesByType = React.useMemo<Record<string, CatalogItemType>>(
    () =>
      catalogTypesExtensions.reduce((acc, catalogItemType) => {
        acc[catalogItemType.properties.type] = catalogItemType;
        return acc;
      }, {}),
    [catalogTypesExtensions],
  );

  // Current configuration
  const [consoleConfig, consoleConfigLoaded, consoleConfigError] = useConsoleOperatorConfig<
    DeveloperCatalogTypesConsoleConfig
  >();
  const [types, setTypes] = React.useState<Types>();
  React.useEffect(() => {
    if (consoleConfig && consoleConfigLoaded && !types) {
      setTypes(consoleConfig?.spec?.customization?.developerCatalog?.types);
    }
  }, [consoleConfig, consoleConfigLoaded, types]);

  // Calculate options
  const [enabledOptions, disabledOptions] = React.useMemo<
    [React.ReactElement<ItemProps>[], React.ReactElement<ItemProps>[]]
  >(() => {
    if (!consoleConfigLoaded) {
      return [[], []];
    }
    if (!types?.state || types.state === 'Enabled') {
      if (types?.enabled?.length > 0) {
        return [
          types.enabled.map((type) => (
            <Item type={type} title={catalogTypesByType[type]?.properties.title || type} />
          )),
          catalogTypesExtensions
            .filter((catalogItemType) => !types.enabled.includes(catalogItemType.properties.type))
            .map((catalogItemType) => (
              <Item
                type={catalogItemType.properties.type}
                title={catalogItemType.properties.title}
              />
            )),
        ];
      }
      return [
        catalogTypesExtensions.map((catalogItemType) => (
          <Item type={catalogItemType.properties.type} title={catalogItemType.properties.title} />
        )),
        [],
      ];
    }
    if (types?.state === 'Disabled') {
      if (types.disabled?.length > 0) {
        return [
          catalogTypesExtensions
            .filter((catalogItemType) => !types.disabled.includes(catalogItemType.properties.type))
            .map((catalogItemType) => (
              <Item
                type={catalogItemType.properties.type}
                title={catalogItemType.properties.title}
              />
            )),
          types.disabled.map((type) => (
            <Item type={type} title={catalogTypesByType[type]?.properties.title || type} />
          )),
        ];
      }
      return [
        [],
        catalogTypesExtensions.map((catalogItemType) => (
          <Item type={catalogItemType.properties.type} title={catalogItemType.properties.title} />
        )),
      ];
    }
    return [[], []];
  }, [catalogTypesByType, catalogTypesExtensions, consoleConfigLoaded, types]);

  // Save the latest value (types)
  const [saveStatus, setSaveStatus] = React.useState<SaveStatus>();
  const save = useDebounceCallback(() => {
    setSaveStatus({ status: 'in-progress' });
    k8sPatchResource({
      model: ConsoleOperatorConfigModel,
      resource: consoleConfig,
      data: [
        {
          op: 'replace',
          path: '/spec/customization/developerCatalog/types',
          value: types,
        },
      ],
    })
      .then(() => setSaveStatus({ status: 'successful' }))
      .catch((error) => setSaveStatus({ status: 'error', error }));
  }, 2000);

  // Extract types from Items
  const onListChange = (
    newEnabledOptions: React.ReactElement<ItemProps>[],
    newDisabledOptions: React.ReactElement<ItemProps>[],
  ) => {
    if (types?.state === 'Enabled') {
      if (newEnabledOptions.length === 0) {
        setTypes({ state: 'Disabled' });
      } else {
        setTypes({ state: 'Enabled', enabled: newEnabledOptions.map((node) => node.props.type) });
      }
    }
    if (!types?.state || types?.state === 'Disabled') {
      if (newDisabledOptions.length === 0) {
        setTypes({ state: 'Enabled' });
      } else {
        setTypes({
          state: 'Disabled',
          disabled: newDisabledOptions.map((node) => node.props.type),
        });
      }
    }
    setSaveStatus({ status: 'pending' });
    save();
  };

  const filterOption = (option: React.ReactElement<ItemProps>, input: string): boolean => {
    return fuzzy(input.toLocaleLowerCase(), option.props.title.toLocaleLowerCase());
  };

  return (
    <>
      <h2>{t('devconsole~Developer catalog')}</h2>
      <DualListSelector
        availableOptionsTitle={t('devconsole~Enabled types')}
        chosenOptionsTitle={t('devconsole~Disabled types')}
        isSearchable
        availableOptions={enabledOptions}
        chosenOptions={disabledOptions}
        onListChange={onListChange}
        filterOption={filterOption}
        isDisabled={
          readonly || !catalogTypesExtensionsLoaded || !consoleConfigLoaded || consoleConfigError
        }
      />
      <pre>{JSON.stringify(types, null, 2)}</pre>
      {consoleConfigError ? (
        <Alert variant="warning" isInline title={t('devconsole~Could not load configuration.')} />
      ) : null}
      {saveStatus?.status === 'successful' ? (
        <Alert variant="success" isInline title={t('devconsole~Saved.')}>
          {t(
            'devconsole~This config update requires a console rollout, this can take up to a minute and require a browser refresh.',
          )}
        </Alert>
      ) : null}
      {saveStatus?.status === 'error' ? (
        <Alert variant="danger" isInline title={t('devconsole~Could not save configuration.')} />
      ) : null}
    </>
  );
};

export default CatalogTypesConfiguration;
