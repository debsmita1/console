import * as React from 'react';
import { DualListSelector, FormSection } from '@patternfly/react-core';
import * as fuzzy from 'fuzzysearch';
import { useTranslation } from 'react-i18next';
import { CatalogItemType, isCatalogItemType } from '@console/dynamic-plugin-sdk/src/extensions';
import { useResolvedExtensions } from '@console/dynamic-plugin-sdk/src/lib-core';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { useTelemetry } from '@console/shared/src';
import {
  useDebounceCallback,
  useConsoleOperatorConfig,
  patchConsoleOperatorConfig,
  LoadError,
  SaveStatus,
  SaveStatusProps,
} from '@console/shared/src/components/cluster-configuration';

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

const CatalogTypesConfiguration: React.FC<{ readonly: boolean }> = ({ readonly }) => {
  const { t } = useTranslation();
  const fireTelemetryEvent = useTelemetry();

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
  const [saveStatus, setSaveStatus] = React.useState<SaveStatusProps>();
  const save = useDebounceCallback(() => {
    fireTelemetryEvent('Console cluster configuration changed', {
      customize: 'Developer Catalog types',
      state: types.state,
      types: (types.state === 'Disabled' ? types.disabled : types.enabled) ?? [],
    });
    setSaveStatus({ status: 'in-progress' });

    const patch: DeveloperCatalogTypesConsoleConfig = {
      spec: {
        customization: {
          developerCatalog: {
            types,
          },
        },
      },
    };
    patchConsoleOperatorConfig(patch)
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
    <FormSection title={t('devconsole~Developer catalog')} data-test="catalog-types form-section">
      <DualListSelector
        availableOptionsTitle={t('devconsole~Enabled types')}
        chosenOptionsTitle={t('devconsole~Disabled types')}
        isSearchable
        availableOptions={enabledOptions}
        chosenOptions={disabledOptions}
        onListChange={onListChange}
        filterOption={filterOption}
        isDisabled={
          readonly || !catalogTypesExtensionsLoaded || !consoleConfigLoaded || !!consoleConfigError
        }
      />

      <LoadError error={consoleConfigError} />
      <SaveStatus {...saveStatus} />
    </FormSection>
  );
};

export default CatalogTypesConfiguration;
