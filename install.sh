#!/bin/bash  -e
#
# Copyright (c) 2024 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# install a helm chart with the correct global.clusterRouterBase

# default namespace if none set
namespace="rhdh-helm"
chartrepo=0 # by default don't create a new chart repo unless the version chart version includes "CI" suffix

usage ()
{
  echo "Usage: $0 CHART_VERSION [-n namespace]

Examples:
  $0 1.1.1 
  $0 1.5-78-CI -n rhdh-ci

Options:
  -n, --namespace   Project or namespace into which to install specified chart; default: $namespace
  -r, --chartrepo   If set, a Helm Chart Repo will be applied to the cluster, based on the chart version.
                    If CHART_VERSION ends in CI, this is done by default.
"
  exit
}

if [[ $# -lt 1 ]]; then usage; fi
# ./install.sh 1.5-78-CI --namespace rhdh-1-5-78-ci --chartrepo --package ${{ needs.detect-changes.outputs.package_yaml }}
while [[ "$#" -gt 0 ]]; do
  case $1 in
    '-r'|'--chartrepo') chartrepo=1;;
    '-n'|'--namespace') namespace="$2"; shift 1;;
    '-p'|'--package') package_yaml="$2"; shift 1;;  # New flag for package_yaml
    '-h') usage;;
    *) CV="$1";;
  esac
  shift 1
done

if [[ ! $CV ]]; then usage; fi

export KUBECONFIG=/opt/.kube/config
tmpfile=/tmp/redhat-developer-hub.chart.values.yml
CHART_URL="https://github.com/rhdh-bot/openshift-helm-charts/raw/redhat-developer-hub-${CV}/charts/redhat/redhat/redhat-developer-hub/${CV}/redhat-developer-hub-${CV}.tgz"

# choose namespace for the install (or create if non-existant)
oc --kubeconfig /opt/.kube/config new-project "$namespace" || oc project "$namespace"

# if a CI chart, create a chart repo
if [[ $CV == *"-CI" ]]; then chartrepo=1; fi
if [[ $chartrepo -eq 1 ]]; then
    oc --kubeconfig /opt/.kube/config apply -f https://github.com/rhdh-bot/openshift-helm-charts/raw/redhat-developer-hub-${CV}/installation/rhdh-next-ci-repo.yaml
fi

# 1. install (or upgrade)
helm --kubeconfig /opt/.kube/config upgrade redhat-developer-hub -f values.yaml -i "${CHART_URL}"

# 2. collect values
PASSWORD=$(kubectl get secret redhat-developer-hub-postgresql -o jsonpath="{.data.password}" | base64 -d)
CLUSTER_ROUTER_BASE=$(oc get route console -n openshift-console -o=jsonpath='{.spec.host}' | sed 's/^[^.]*\.//')

# 3. change values
helm_cmd="helm --kubeconfig /opt/.kube/config upgrade redhat-developer-hub -i \"${CHART_URL}\" \
    --reuse-values \
    --set global.clusterRouterBase=\"${CLUSTER_ROUTER_BASE}\" \
    --set global.postgresql.auth.password=\"$PASSWORD\""

# Validate package_yaml file before using it
if [[ -n "$package_yaml" ]]; then
  if [[ -s "$package_yaml" ]]; then
    helm_cmd+=" -f $package_yaml"
  else
    echo "Skipping empty values file: $package_yaml"
  fi
fi

# Execute the Helm command
echo "Running: $helm_cmd"
eval "$helm_cmd"

# 4. cleanup
rm -f "$tmpfile"

echo "
Once deployed, Developer Hub $CV will be available at
https://redhat-developer-hub-${namespace}.${CLUSTER_ROUTER_BASE}
"