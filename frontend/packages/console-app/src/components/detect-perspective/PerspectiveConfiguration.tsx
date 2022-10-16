import * as React from 'react';
import {
  FormGroup,
  FormSection,
  Select,
  SelectOption,
  ExpandableSection,
  TextContent,
  Text,
  TextVariants,
} from '@patternfly/react-core';
import { safeDump } from 'js-yaml';
import { useTranslation } from 'react-i18next';
import {
  isPerspective,
  Perspective as PerspectiveExtension,
  AccessReviewResourceAttributes,
} from '@console/dynamic-plugin-sdk/src';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { useExtensions } from '@console/plugin-sdk';
import {
  useDebounceCallback,
  useConsoleOperatorConfig,
  patchConsoleOperatorConfig,
  HorizontalFormLayout,
  LoadError,
  SaveStatus,
  SaveStatusProps,
} from '@console/shared/src/components/cluster-configuration';

enum PerspectiveVisibilityState {
  Enabled = 'Enabled',
  Disabled = 'Disabled',
  AccessReview = 'AccessReview',
}

type PerspectiveAccessReview = {
  required?: AccessReviewResourceAttributes[];
  missing?: AccessReviewResourceAttributes[];
};

type PerspectiveVisibility = {
  state: PerspectiveVisibilityState;
  accessReview?: PerspectiveAccessReview;
};

type Perspective = {
  id: string;
  visibility: PerspectiveVisibility;
};

type PerspectivesConsoleConfig = K8sResourceKind & {
  spec: {
    customization?: {
      perspectives: Perspective[];
    };
  };
};

type PerspectiveVisibilitySelectOptions = {
  value: string;
  title: string;
  description: string;
  isSelected: boolean;
  selectedValue?: PerspectiveVisibility;
};

const PerspectiveVisibilitySelect: React.FC<{
  toggleId: string;
  disabled: boolean;
  value?: PerspectiveVisibility;
  onChange: (newValue: PerspectiveVisibility) => void;
}> = ({ toggleId, disabled, value, onChange }) => {
  const { t } = useTranslation();

  const options: PerspectiveVisibilitySelectOptions[] = [
    {
      value: 'Enabled',
      title: t('console-app~Enabled'),
      description: t('console-app~Perspectives are enabled by default.'),
      isSelected: !value || !value.state || value.state === PerspectiveVisibilityState.Enabled,
      selectedValue: { state: PerspectiveVisibilityState.Enabled },
    },
    {
      value: 'RequiredNamespace',
      title: t('console-app~Only visible for privileged users'),
      description: t('console-app~Privileged users can list all namnespaces.'),
      isSelected:
        value?.state === PerspectiveVisibilityState.AccessReview &&
        value.accessReview?.required?.length === 1 &&
        value.accessReview.required[0].resource === 'namespaces' &&
        value.accessReview.required[0].verb === 'get' &&
        Object.values(value.accessReview.required[0]).filter(Boolean).length === 2 &&
        !value.accessReview?.missing?.length,
      selectedValue: {
        state: PerspectiveVisibilityState.AccessReview,
        accessReview: {
          required: [
            {
              resource: 'namespaces',
              verb: 'get',
            },
          ],
        },
      },
    },
    {
      value: 'MissingNamespace',
      title: t('console-app~Only visible for unprivileged users'),
      description: t('console-app~Unprivileged users cannot list all namnespaces.'),
      isSelected:
        value?.state === PerspectiveVisibilityState.AccessReview &&
        value.accessReview?.missing?.length === 1 &&
        value.accessReview.missing[0].resource === 'namespaces' &&
        value.accessReview.missing[0].verb === 'get' &&
        Object.values(value.accessReview.missing[0]).filter(Boolean).length === 2 &&
        !value.accessReview?.required?.length,
      selectedValue: {
        state: PerspectiveVisibilityState.AccessReview,
        accessReview: {
          missing: [
            {
              resource: 'namespaces',
              verb: 'get',
            },
          ],
        },
      },
    },
    {
      value: 'Disabled',
      title: t('console-app~Disabled'),
      description: t('console-app~Disable this perspectives for all users.'),
      isSelected: value?.state === PerspectiveVisibilityState.Disabled,
      selectedValue: { state: PerspectiveVisibilityState.Disabled },
    },
  ];

  if (!options.some((option) => option.isSelected)) {
    options.push({
      value: 'Custom',
      title: t('console-app~Custom'),
      description: t(
        'console-app~This perspective is shown based on custom access review rules. Please open the console configuration resource to inspect or update this rules.',
      ),
      isSelected: true,
    });
  }

  const [isOpen, setIsOpen] = React.useState(false);
  const selection = options.find((option) => option.isSelected)?.value;

  return (
    <>
      <Select
        toggleId={toggleId}
        disabled={disabled}
        isOpen={isOpen}
        selections={selection}
        onToggle={(isExpanded) => setIsOpen(isExpanded)}
        onSelect={() => setIsOpen(false)}
      >
        {options.map((option) => (
          <SelectOption
            key={option.value}
            value={option.value}
            description={option.description}
            onClick={() => option.selectedValue && onChange(option.selectedValue)}
          >
            {option.title}
          </SelectOption>
        ))}
      </Select>
      {selection === 'Custom' && value?.accessReview && (
        <ExpandableSection toggleText={t('console-app~Access review rules')}>
          <TextContent>
            <Text component={TextVariants.pre}>{safeDump(value.accessReview)}</Text>
          </TextContent>
        </ExpandableSection>
      )}
    </>
  );
};

const PerspectiveConfiguration: React.FC<{ readonly: boolean }> = ({ readonly }) => {
  const { t } = useTranslation();

  // All available perspectives
  const perspectiveExtensions = useExtensions<PerspectiveExtension>(isPerspective);

  // Current configuration
  const [consoleConfig, consoleConfigLoaded, consoleConfigError] = useConsoleOperatorConfig<
    PerspectivesConsoleConfig
  >();
  const [configuredPerspectives, setConfiguredPerspectives] = React.useState<Perspective[]>();
  React.useEffect(() => {
    if (consoleConfig && consoleConfigLoaded && !configuredPerspectives) {
      setConfiguredPerspectives(consoleConfig?.spec?.customization?.perspectives);
    }
  }, [configuredPerspectives, consoleConfig, consoleConfigLoaded]);

  // Save the latest changes
  const [saveStatus, setSaveStatus] = React.useState<SaveStatusProps>();
  const save = useDebounceCallback(() => {
    setSaveStatus({ status: 'in-progress' });

    const patch: PerspectivesConsoleConfig = {
      spec: {
        customization: {
          perspectives: configuredPerspectives,
        },
      },
    };
    patchConsoleOperatorConfig(patch)
      .then(() => setSaveStatus({ status: 'successful' }))
      .catch((error) => setSaveStatus({ status: 'error', error }));
  }, 2000);

  const disabled =
    readonly || !perspectiveExtensions || !consoleConfigLoaded || !!consoleConfigError;

  return (
    <>
      <HorizontalFormLayout>
        <FormSection title={t('console-app~Perspectives')} data-test="perspectives form-section">
          {perspectiveExtensions.map((perspectiveExtension) => {
            const fieldId = perspectiveExtension.uid;
            const perspectiveId = perspectiveExtension.properties.id;
            const value = configuredPerspectives?.find((p) => p.id === perspectiveId)?.visibility;
            const onChange = (newValue: PerspectiveVisibility) => {
              setConfiguredPerspectives((oldConfiguredPerspectives) => {
                const newConfiguredPerspectives = oldConfiguredPerspectives
                  ? [...oldConfiguredPerspectives]
                  : [];
                const index = newConfiguredPerspectives.findIndex((p) => p.id === perspectiveId);
                if (index === -1) {
                  newConfiguredPerspectives.push({ id: perspectiveId, visibility: newValue });
                } else {
                  newConfiguredPerspectives[index].visibility = newValue;
                }
                return newConfiguredPerspectives;
              });
              save();
            };

            return (
              <FormGroup
                key={perspectiveExtension.uid}
                label={perspectiveExtension.properties.name}
                fieldId={fieldId}
                data-test="perspectives form-group"
              >
                <PerspectiveVisibilitySelect
                  toggleId={fieldId}
                  disabled={disabled}
                  value={value}
                  onChange={onChange}
                />
              </FormGroup>
            );
          })}
        </FormSection>
      </HorizontalFormLayout>

      <LoadError error={consoleConfigError} />
      <SaveStatus {...saveStatus} />
    </>
  );
};

export default PerspectiveConfiguration;
