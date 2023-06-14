import * as React from 'react';
import {
  Visualization,
  VisualizationSurface,
  GraphElement,
  isNode,
  BaseEdge,
  VisualizationProvider,
  Model,
  GraphModel,
  NodeModel,
  BOTTOM_LAYER,
  GROUPS_LAYER,
  DEFAULT_LAYER,
  TOP_LAYER,
  SelectionEventListener,
  SELECTION_EVENT,
  NODE_POSITIONED_EVENT,
  GRAPH_POSITION_CHANGE_EVENT,
  Node,
  Rect,
} from '@patternfly/react-topology';
import * as _ from 'lodash';
import { action } from 'mobx';
import { connect } from 'react-redux';
import {
  useResolvedExtensions,
  isTopologyComponentFactory as isDynamicTopologyComponentFactory,
  TopologyComponentFactory as DynamicTopologyComponentFactory,
} from '@console/dynamic-plugin-sdk';
import { RootState } from '@console/internal/redux';
import {
  useQueryParams,
  withUserSettingsCompatibility,
  WithUserSettingsCompatibilityProps,
} from '@console/shared';
import { withFallback, ErrorBoundaryFallbackPage } from '@console/shared/src/components/error';
import { TOPOLOGY_LAYOUT_CONFIG_STORAGE_KEY, TOPOLOGY_LAYOUT_LOCAL_STORAGE_KEY } from '../../const';
import { odcElementFactory } from '../../elements';
import { isTopologyComponentFactory, TopologyComponentFactory } from '../../extensions/topology';
import { getTopologyGraphModel, setTopologyGraphModel } from '../../redux/action';
import { SHOW_GROUPING_HINT_EVENT, ShowGroupingHintEventListener } from '../../topology-types';
import { componentFactory } from './components';
import { DEFAULT_LAYOUT, SUPPORTED_LAYOUTS, layoutFactory } from './layouts/layoutFactory';
import TopologyControlBar from './TopologyControlBar';

import './Topology.scss';

const STORED_NODE_LAYOUT_FIELDS = ['id', 'x', 'y'];

const setTopologyLayout = (namespace: string, nodes: NodeModel[], layout: string) => {
  const currentStore = {};
  currentStore[namespace] = {
    nodes: nodes?.map((n) =>
      Object.keys(n).reduce((acc, key) => {
        if (STORED_NODE_LAYOUT_FIELDS.includes(key)) {
          acc[key] = n[key];
        }
        return acc;
      }, {} as NodeModel),
    ),
    layout,
  };
  return currentStore;
};

const nodeDistanceToBounds = (node: Node, bounds: Rect): number => {
  const nodeBounds = node.getBounds();
  const nodeX = nodeBounds.x + nodeBounds.width / 2;
  const nodeY = nodeBounds.y + nodeBounds.height / 2;

  const dx = Math.max(bounds.x - nodeX, 0, nodeX - (bounds.x + bounds.width));
  const dy = Math.max(bounds.y - nodeY, 0, nodeY - (bounds.y + bounds.height));
  return Math.sqrt(dx * dx + dy * dy);
};

interface TopologyGraphViewProps {
  visualizationReady: boolean;
  visualization: Visualization;
  controlsDisabled?: boolean;
  selectedId?: string;
  dragHint?: string;
}

const TopologyGraphView: React.FC<TopologyGraphViewProps> = React.memo(
  ({ visualizationReady, visualization, controlsDisabled, selectedId, dragHint }) => {
    if (!visualizationReady) {
      return null;
    }
    return (
      <div className="odc-topology-graph-view">
        <VisualizationProvider controller={visualization}>
          <VisualizationSurface state={{ selectedIds: [selectedId] }} />
          {dragHint && (
            <div className="odc-topology__hint-container">
              <div className="odc-topology__hint-background">{dragHint}</div>
            </div>
          )}
          <TopologyControlBar visualization={visualization} isDisabled={controlsDisabled} />
        </VisualizationProvider>
      </div>
    );
  },
);

const TOPOLOGY_GRAPH_ID = 'odc-topology-graph';
const graphModel: Model = {
  graph: {
    id: TOPOLOGY_GRAPH_ID,
    type: 'graph',
    layout: DEFAULT_LAYOUT,
    layers: [BOTTOM_LAYER, GROUPS_LAYER, 'groups2', DEFAULT_LAYER, TOP_LAYER],
  },
};

interface StateProps {
  getStoredGraphModel: (namespace: string) => GraphModel;
}

interface DispatchProps {
  onGraphModelChange: (namespace: string, model: GraphModel) => void;
}

interface TopologyProps {
  model: Model;
  application: string;
  namespace: string;
  onSelect: (entity?: GraphElement) => void;
  setVisualization: (vis: Visualization) => void;
}

const Topology: React.FC<
  TopologyProps & StateProps & DispatchProps & WithUserSettingsCompatibilityProps<object>
> = ({
  model,
  application,
  namespace,
  onSelect,
  setVisualization,
  onGraphModelChange,
  getStoredGraphModel,
  userSettingState: topologyLayoutDataJson,
  setUserSettingState: setTopologyLayoutData,
}) => {
  const applicationRef = React.useRef<string>(null);
  const [visualizationReady, setVisualizationReady] = React.useState<boolean>(false);
  const [dragHint, setDragHint] = React.useState<string>('');
  const storedLayoutApplied = React.useRef<boolean>(false);
  const queryParams = useQueryParams();
  const selectedId = queryParams.get('selectId');
  const [componentFactoryExtensions, isStaticResolved] = useResolvedExtensions<
    TopologyComponentFactory
  >(isTopologyComponentFactory);
  const [dynamicComponentFactoryExtensions, isDynamicResolved] = useResolvedExtensions<
    DynamicTopologyComponentFactory
  >(isDynamicTopologyComponentFactory);

  const createVisualization = React.useCallback(() => {
    const storedLayout = topologyLayoutDataJson?.[namespace];
    const newVisualization = new Visualization();
    newVisualization.registerElementFactory(odcElementFactory);
    newVisualization.registerLayoutFactory(layoutFactory);

    const onCurrentGraphModelChange = _.debounce(() => {
      const visModel = newVisualization.toModel();
      const saveGraphModel = {
        id: visModel.graph.id,
        type: visModel.graph.type,
        x: visModel.graph.x,
        y: visModel.graph.y,
        scale: visModel.graph.scale,
        scaleExtent: visModel.graph.scaleExtent,
      };
      onGraphModelChange(namespace, saveGraphModel);
    }, 200);

    const onVisualizationLayoutChange = _.debounce(() => {
      const visModel = newVisualization.toModel();
      const updatedLayoutData = setTopologyLayout(namespace, visModel.nodes, visModel.graph.layout);
      setTopologyLayoutData((prevState) => {
        return { ...prevState, ...updatedLayoutData };
      });
    }, 200);

    newVisualization.addEventListener(NODE_POSITIONED_EVENT, onVisualizationLayoutChange);
    newVisualization.addEventListener(GRAPH_POSITION_CHANGE_EVENT, onCurrentGraphModelChange);

    if (storedLayout) {
      // Cleanup removed layouts, otherwise the `newVisualization.fromModel` call
      // will crash in @patternfly/react-topology Visualization `getLayout(type: string)`
      if (!SUPPORTED_LAYOUTS.includes(storedLayout.layout)) {
        graphModel.graph.layout = DEFAULT_LAYOUT;
        setTopologyLayoutData((prevState) => {
          return { ...prevState, layout: DEFAULT_LAYOUT };
        });
      } else {
        graphModel.graph.layout = storedLayout.layout;
      }
    }
    newVisualization.fromModel(graphModel);
    newVisualization.addEventListener<SelectionEventListener>(SELECTION_EVENT, (ids: string[]) => {
      const selectedEntity = ids[0] ? newVisualization.getElementById(ids[0]) : null;
      onSelect(selectedEntity);
    });
    return newVisualization;
  }, [namespace, onGraphModelChange, onSelect, setTopologyLayoutData, topologyLayoutDataJson]);

  const visualizationRef = React.useRef<Visualization>();
  if (!visualizationRef.current) {
    visualizationRef.current = createVisualization();
  }
  const visualization = visualizationRef.current;
  React.useEffect(() => {
    if (visualization) {
      setVisualization(visualization);
    }
  }, [setVisualization, visualization]);

  React.useEffect(() => {
    if (model && visualizationReady) {
      if (!storedLayoutApplied.current) {
        const storedGraphModel = getStoredGraphModel(namespace);
        if (storedGraphModel) {
          model.graph = {
            ...graphModel.graph,
            x: storedGraphModel.x,
            y: storedGraphModel.y,
            scale: storedGraphModel.scale,
            scaleExtent: storedGraphModel.scaleExtent,
            data: visualization.getGraph()?.getData(),
          };
        }
        const storedLayout = topologyLayoutDataJson?.[namespace];
        if (storedLayout) {
          model.nodes.forEach((n) => {
            const storedNode = storedLayout.nodes.find((sn) => sn.id === n.id);
            if (storedNode) {
              STORED_NODE_LAYOUT_FIELDS.forEach((key) => {
                n[key] = storedNode[key];
              });
            }
          });
        }
      }

      model.nodes.forEach((n) => {
        const oldNode = visualization.getNodeById(n.id);
        if (oldNode && _.isEqual(oldNode.getData(), n.data)) {
          n.data = oldNode.getData();
        }
      });
      model.edges.forEach((e) => {
        const oldEdge = visualization.getEdgeById(e.id);
        if (oldEdge && _.isEqual(oldEdge.getData(), e.data)) {
          e.data = oldEdge.getData();
        }
      });

      visualization.fromModel(model);

      // Make sure something is visible in the case where stored locations are off the screen
      if (!storedLayoutApplied.current) {
        storedLayoutApplied.current = true;
        if (topologyLayoutDataJson?.[namespace]) {
          const graph = visualization.getGraph();
          const nodes = visualization.getElements().filter(isNode);
          if (nodes.length) {
            const nodesVisible = nodes.find((n) => graph.isNodeInView(n, { padding: 0 }));
            if (!nodesVisible) {
              const graphBounds = graph.getBounds();
              const [viewNode] = nodes.reduce(
                ([closestNode, closestDistance], nextNode) => {
                  const distance = nodeDistanceToBounds(nextNode, graphBounds);
                  if (!closestNode || distance < closestDistance) {
                    return [nextNode, distance];
                  }
                  return [closestNode, closestDistance];
                },
                [null, 0],
              );
              graph.panIntoView(viewNode);
            }
          }
        }
      }

      const selectedItem = selectedId ? visualization.getElementById(selectedId) : null;
      if (!selectedItem || !selectedItem.isVisible()) {
        onSelect();
      } else {
        onSelect(selectedItem);
      }
    }
    // Do not update on selectedId change or stored layout change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model, visualization, visualizationReady]);

  React.useEffect(() => {
    if (!isStaticResolved || !isDynamicResolved) {
      return;
    }

    visualization.registerComponentFactory(componentFactory);
    [...componentFactoryExtensions, ...dynamicComponentFactoryExtensions].forEach((factory) => {
      visualization.registerComponentFactory(factory.properties.getFactory);
    });

    visualization.addEventListener<ShowGroupingHintEventListener>(
      SHOW_GROUPING_HINT_EVENT,
      (element, hint) => {
        setDragHint(hint);
      },
    );
    setVisualizationReady(true);
  }, [
    visualization,
    isStaticResolved,
    isDynamicResolved,
    componentFactoryExtensions,
    dynamicComponentFactoryExtensions,
  ]);

  React.useEffect(() => {
    if (!applicationRef.current) {
      applicationRef.current = application;
      return;
    }
    if (application !== applicationRef.current) {
      applicationRef.current = application;
      if (visualization) {
        visualization.getGraph().reset();
        visualization.getGraph().layout();
      }
    }
  }, [application, visualization]);

  React.useEffect(() => {
    let resizeTimeout = null;
    if (visualization) {
      if (selectedId) {
        const selectedEntity = visualization.getElementById(selectedId);
        if (selectedEntity) {
          const visibleEntity = isNode(selectedEntity)
            ? selectedEntity
            : (selectedEntity as BaseEdge).getSource();
          resizeTimeout = setTimeout(
            action(() => {
              visualization
                .getGraph()
                .panIntoView(visibleEntity, { offset: 20, minimumVisible: 100 });
              resizeTimeout = null;
            }),
            500,
          );
        }
      }
    }
    return () => {
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
    };
  }, [selectedId, visualization]);

  return (
    <TopologyGraphView
      visualizationReady={visualizationReady}
      visualization={visualization}
      controlsDisabled={!model?.nodes.length}
      dragHint={dragHint}
      selectedId={selectedId}
    />
  );
};

const TopologyStateToProps = (state: RootState): StateProps => {
  return {
    getStoredGraphModel: (namespace: string) => getTopologyGraphModel(state, namespace),
  };
};

const TopologyDispatchToProps = (dispatch): DispatchProps => ({
  onGraphModelChange: (namespace: string, model: GraphModel) => {
    dispatch(setTopologyGraphModel(namespace, model));
  },
});

export default withFallback(
  connect<StateProps, DispatchProps, TopologyProps>(
    TopologyStateToProps,
    TopologyDispatchToProps,
  )(
    withUserSettingsCompatibility<
      TopologyProps & WithUserSettingsCompatibilityProps<object>,
      object
    >(
      TOPOLOGY_LAYOUT_CONFIG_STORAGE_KEY,
      TOPOLOGY_LAYOUT_LOCAL_STORAGE_KEY,
      {},
    )(React.memo(Topology)),
  ),
  ErrorBoundaryFallbackPage,
);
