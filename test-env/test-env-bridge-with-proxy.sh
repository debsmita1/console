#!/bin/bash

BRIDGE=./bin/bridge
#BRIDGE=~/go/bin/gow run github.com/openshift/console/cmd/bridge 

# Custom base address
export BRIDGE_LISTEN="http://localhost:9091"

# Use test-env k8s api
export BRIDGE_USER_AUTH="disabled"
export BRIDGE_K8S_MODE="off-cluster"
export BRIDGE_K8S_MODE_OFF_CLUSTER_ENDPOINT="http://127.0.0.1:8090/"
export BRIDGE_K8S_AUTH="bearer-token"
export BRIDGE_K8S_AUTH_BEARER_TOKEN="ignored-by-proxy"

# Enable test-env and import yaml files and start watchers
BRIDGE_TEST_ENV=""
BRIDGE_TEST_ENV="$BRIDGE_TEST_ENV,test-env/openshift/project.yaml"
BRIDGE_TEST_ENV="$BRIDGE_TEST_ENV,test-env/openshift/deploymentconfig.ts"
export BRIDGE_TEST_ENV

echo $BRIDGE_TEST_ENV

# Test env kubebuilder assets
export KUBEBUILDER_ASSETS=`~/go/bin/setup-envtest use 1.21 -p path`

cd ..
$BRIDGE
