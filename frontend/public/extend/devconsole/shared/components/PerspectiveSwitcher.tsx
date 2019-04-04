/* eslint-disable no-unused-vars, no-undef */
import * as React from 'react';
import { connect, Dispatch } from 'react-redux';
import { CodeIcon, CogsIcon } from '@patternfly/react-icons';
import * as openshiftIconImg from '../../../../imgs/openshift-favicon.png';
import { connectToFlags, flagPending, FLAGS } from '../../../../features';
import { UIActions } from '../../../../ui/ui-actions';
import { getActivePerspective } from '../../../../ui/ui-selectors';
import MegaMenu from './MegaMenu/MegaMenu';
import MegaMenuItem from './MegaMenu/MegaMenuItem';
import MegaMenuSection from './MegaMenu/MegaMenuSection';
import MegaMenuNav from './MegaMenu/MegaMenuNav';

export interface PerspectiveSwitcherProps {
  isNavOpen: boolean;
  flags: { [_: string]: boolean };
  onNavToggle: (MouseEvent) => void;
}

export interface StateProps {
  activePerspective: string;
}

export interface DispatchProps {
  onPerspectiveChange(string): void;
}

type Props = StateProps & DispatchProps & PerspectiveSwitcherProps;

export const PerspectiveSwitcher: React.FunctionComponent<Props> = (props: Props) => {
  const devconsoleItem = () => {
    if (!props.flags[FLAGS.SHOW_DEV_CONSOLE]) {
      return null;
    }
    return (
      <MegaMenuItem
        to="/dev"
        title="Developer"
        icon={<CodeIcon />}
        onClick={(e) => {
          props.onPerspectiveChange('dev');
          props.onNavToggle(e);
        }}
      />
    );
  };

  if (flagPending(props.flags[FLAGS.SHOW_DEV_CONSOLE]) || !props.flags[FLAGS.SHOW_DEV_CONSOLE]) {
    return null;
  }

  return (
    <MegaMenu isNavOpen={props.isNavOpen} onNavToggle={props.onNavToggle}>
      <MegaMenuNav onSelect={props.onNavToggle}>
        <MegaMenuSection>
          <MegaMenuItem
            to="https://cloud.openshift.com"
            title="Multi-Cluster Manager"
            icon={openshiftIconImg}
            externalLink
          />
          <MegaMenuItem
            to="/"
            title="Administrator"
            icon={<CogsIcon />}
            isActive={() => props.activePerspective === 'admin'}
            onClick={(e) => {
              props.onPerspectiveChange('admin');
              props.onNavToggle(e);
            }}
          />
          {devconsoleItem()}
        </MegaMenuSection>
      </MegaMenuNav>
    </MegaMenu>
  );
};

const mapStateToProps = (state): StateProps => {
  return {
    activePerspective: getActivePerspective(state),
  };
};

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => {
  return {
    onPerspectiveChange: (perspective) => {
      dispatch(UIActions.setActivePerspective(perspective));
    },
  };
};

export default connect<StateProps, DispatchProps, PerspectiveSwitcherProps>(
  mapStateToProps,
  mapDispatchToProps,
)(connectToFlags(FLAGS.SHOW_DEV_CONSOLE)(PerspectiveSwitcher));
