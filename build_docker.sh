#!/bin/bash
NAMESPACE="${1:-codebase_b86_app}"
docker build -t "$NAMESPACE" .