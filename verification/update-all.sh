#!/bin/bash

verification/verify-live-data-dry-run.sh
cp verification/verify-live-data-dry-run/cases.actual.json verification/verify-live-data-dry-run/cases.expected.json
cp verification/verify-live-data-dry-run/interventions.actual.json verification/verify-live-data-dry-run/interventions.expected.json

cp verification/verify-live-data-dry-run/cached/* verification/verify-cached-data-dry-run/cache
verification/verify-cached-data-dry-run.sh
cp verification/verify-cached-data-dry-run/cases.actual.json verification/verify-cached-data-dry-run/cases.expected.json
cp verification/verify-cached-data-dry-run/interventions.actual.json verification/verify-cached-data-dry-run/interventions.expected.json

cp verification/verify-live-data-dry-run/cached/* verification/verify-cached-data/cache
verification/verify-cached-data.sh
cp verification/verify-cached-data/cases.actual.out verification/verify-cached-data/cases.expected.out
cp verification/verify-cached-data/interventions.actual.out verification/verify-cached-data/interventions.expected.out

verification/verify-live-data.sh
cp verification/verify-live-data/cases.actual.out verification/verify-live-data/cases.expected.out
cp verification/verify-live-data/interventions.actual.out verification/verify-live-data/interventions.expected.out
